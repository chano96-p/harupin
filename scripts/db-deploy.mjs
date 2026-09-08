/**
 * 원격 Supabase 에 마이그레이션을 적용한다.
 *
 * `supabase db push` 를 쓸 수 없다. 이 프로젝트는 기존 앱과 Supabase 프로젝트를
 * 공유하는데, CLI 가 쓰는 supabase_migrations.schema_migrations 는 프로젝트당
 * 하나뿐이고 그 테이블은 기존 앱 소유다. push 는 "원격 이력 ⊆ 로컬 파일" 을
 * 전제하므로 저쪽 파일이 없는 우리 레포에서는 항상 거부된다.
 * 반대로 우리 버전을 그 테이블에 넣으면 저쪽 push 가 같은 이유로 깨진다.
 *
 * 그래서 이력을 harupin 스키마 안에 따로 둔다. 공유 테이블은 읽지도 쓰지도 않는다.
 * 로컬은 그대로 `supabase db reset` 을 쓴다 — CLI 는 로컬 전용, 이 스크립트는 원격 전용.
 *
 * 이력이 실제 DB 와 어긋났을 때(예: mark-applied 를 잘못 실행)는 이력 행을 지운다:
 *   delete from harupin.schema_migrations where name = '<파일명>';
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
const TRACKING_TABLE = "harupin.schema_migrations";
const DEFAULT_CA_PATH = path.join(
  process.cwd(),
  "supabase",
  "prod-ca-2021.crt",
);

const [, , rawMode, ...rest] = process.argv;
const mode = rawMode ?? "deploy";
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const args = rest.filter((a) => !a.startsWith("--"));

if (!["deploy", "status", "mark-applied"].includes(mode)) {
  console.error(`알 수 없는 명령: ${mode} (deploy | status | mark-applied)`);
  process.exit(1);
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    [
      "SUPABASE_DB_URL 이 없습니다.",
      "",
      "대시보드 → Settings → Database → Connection string 의 Session 모드 값을",
      ".env 에 넣으세요:",
      "",
      "  SUPABASE_DB_URL=postgresql://postgres.<ref>:<비밀번호>@<host>:5432/postgres",
    ].join("\n"),
  );
  process.exit(1);
}

// Supabase 는 자체 CA(Supabase Root 2021 CA)로 서명한 인증서를 쓴다. 시스템
// 신뢰저장소에 없어 기본 검증은 SELF_SIGNED_CERT_IN_CHAIN 으로 실패한다.
// 여기서 검증을 끄면(rejectUnauthorized:false) 호스트명 확인까지 사라져,
// 경로상 공격자가 아무 자체서명 인증서로도 이 연결을 가로챌 수 있다.
// 이 연결은 DB 소유자 비밀번호를 싣고 DDL 을 실행하므로 그래서는 안 된다.
// 대시보드 → Settings → Database → SSL Configuration 에서 prod-ca-2021.crt 를
// 받아 supabase/ 아래 두면 그것으로 검증한다.
const caPath = process.env.SUPABASE_DB_CA ?? DEFAULT_CA_PATH;
let ca;
try {
  ca = await readFile(caPath, "utf8");
} catch {
  console.error(
    [
      `CA 인증서를 찾을 수 없습니다: ${caPath}`,
      "",
      "대시보드 → Settings → Database → SSL Configuration 에서",
      "prod-ca-2021.crt 를 받아 위 경로에 두세요.",
      "다른 위치에 두려면 SUPABASE_DB_CA 로 지정할 수 있습니다.",
      "",
      "검증을 끄는 우회는 두지 않았습니다 — 이 연결은 DB 소유자 권한으로",
      "DDL 을 실행하므로 중간자 공격에 그대로 노출됩니다.",
    ].join("\n"),
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { ca } });
await client.connect();

try {
  // 이력 테이블은 스크립트가 직접 만든다. 마이그레이션 파일로 두면
  // "이 마이그레이션을 적용했는지 기록할 테이블" 자체가 순환이 된다.
  await client.query(`create schema if not exists harupin`);
  await client.query(`
    create table if not exists ${TRACKING_TABLE} (
      name       text primary key,
      checksum   text,
      applied_at timestamptz not null default now()
    )
  `);
  // 예전 버전으로 만들어진 테이블에도 checksum 을 붙인다.
  await client.query(
    `alter table ${TRACKING_TABLE} add column if not exists checksum text`,
  );

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const sums = new Map();
  for (const f of files) {
    const body = await readFile(path.join(MIGRATIONS_DIR, f), "utf8");
    sums.set(f, createHash("sha256").update(body).digest("hex"));
  }

  const { rows } = await client.query(
    `select name, checksum from ${TRACKING_TABLE}`,
  );
  const applied = new Map(rows.map((r) => [r.name, r.checksum]));
  const pending = files.filter((f) => !applied.has(f));

  // 이미 적용된 파일이 나중에 수정되면 로컬(db reset)과 원격이 다른 스키마가 된다.
  // 파일명만 비교하면 조용히 넘어가므로 내용 해시로 잡는다.
  const drifted = files.filter(
    (f) => applied.has(f) && applied.get(f) && applied.get(f) !== sums.get(f),
  );
  if (drifted.length > 0) {
    console.warn("⚠️ 적용 후 내용이 바뀐 마이그레이션이 있습니다:");
    for (const f of drifted) console.warn(`   · ${f}`);
    console.warn(
      "   원격에는 예전 내용이 적용돼 있습니다. 변경분은 새 파일로 만드세요.\n",
    );
  }

  if (mode === "status") {
    console.log(`적용됨 ${applied.size}개 / 대기 ${pending.length}개\n`);
    for (const f of files) {
      const mark = !applied.has(f) ? "⬜" : drifted.includes(f) ? "⚠️" : "✅";
      console.log(`  ${mark} ${f}`);
    }
    process.exit(0);
  }

  if (mode === "mark-applied") {
    // 실행하지 않고 기록만 남기므로, 잘못 쓰면 DB 와 이력이 어긋나고 그 파일은
    // 영영 적용되지 않는다. 대상을 명시하게 해서 실수 여지를 줄인다.
    const targets =
      args.length > 0 ? args : flags.has("--all") ? pending : null;

    if (!targets) {
      console.error(
        [
          "mark-applied 는 SQL 을 실행하지 않고 '적용됨' 으로만 기록합니다.",
          "이미 다른 경로로 반영된 것이 확실할 때만 쓰세요.",
          "",
          "대상을 명시해야 합니다:",
          "  pnpm db:mark-applied <파일명> [<파일명> ...]",
          "  pnpm db:mark-applied --all      # 대기 중인 전부",
          "",
          `대기 중 ${pending.length}개:`,
          ...pending.map((f) => `  · ${f}`),
          "",
          "잘못 기록했다면 이력 행을 지우면 됩니다:",
          `  delete from ${TRACKING_TABLE} where name = '<파일명>';`,
        ].join("\n"),
      );
      process.exit(1);
    }

    const unknown = targets.filter((t) => !pending.includes(t));
    if (unknown.length > 0) {
      console.error(`대기 목록에 없는 파일: ${unknown.join(", ")}`);
      process.exit(1);
    }

    for (const f of targets) {
      await client.query(
        `insert into ${TRACKING_TABLE} (name, checksum) values ($1, $2)`,
        [f, sums.get(f)],
      );
      console.log(`  기록됨: ${f}`);
    }
    console.log(`\n${targets.length}개 기록 완료 (실행하지 않음).`);
    process.exit(0);
  }

  if (pending.length === 0) {
    console.log("적용할 마이그레이션이 없습니다.");
    process.exit(0);
  }

  console.log(`${pending.length}개 적용합니다.\n`);
  for (const file of pending) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`  ${file} ... `);
    try {
      // 파일 하나가 한 트랜잭션이다. 중간에 실패하면 그 파일은 통째로 롤백되고
      // 기록도 남지 않으므로, 고친 뒤 다시 실행하면 그 파일부터 이어진다.
      await client.query("begin");
      await client.query(sql);
      await client.query(
        `insert into ${TRACKING_TABLE} (name, checksum) values ($1, $2)`,
        [file, sums.get(file)],
      );
      await client.query("commit");
      console.log("완료");
    } catch (error) {
      console.log("실패");
      console.error(`\n${error.message}`);
      // 연결이 끊긴 상태면 rollback 도 던진다. 원본 에러를 가리지 않도록 삼킨다.
      try {
        await client.query("rollback");
        console.error("(롤백됨)");
      } catch {
        console.error(
          "(연결이 끊겨 롤백을 확인하지 못했습니다 — 트랜잭션은 서버에서 자동 정리됩니다)",
        );
      }
      process.exit(1);
    }
  }
  console.log("\n전부 적용됐습니다.");
} finally {
  try {
    await client.end();
  } catch {
    // 이미 끊긴 연결
  }
}
