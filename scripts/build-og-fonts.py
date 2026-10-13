"""
OG 이미지(next/og)용 Pretendard 서브셋 TTF 를 만든다.

next/og(satori)는 woff2 와 가변 폰트를 읽지 못한다. 화면용 PretendardVariable.woff2 에서
굵기를 고정한 정적 TTF 를 만들고, OG 이미지에 쓰는 글자만 남겨 수 KB 로 줄인다.

src/app/opengraph-image.tsx 의 문구를 바꾸면 TEXT 도 같이 고치고 다시 실행한다.
빠진 글자가 있으면 next/og 가 빌드 중 Google Fonts(Noto Sans KR)를 받아 섞어 그린다
(네트워크가 없으면 두부). 빌드 로그의 "Failed to load dynamic font" 로 확인한다.

라이선스(SIL OFL 1.1): 서브셋도 수정본이라 저작권·라이선스 고지(name ID 0/13/14)를 남긴다.
글꼴 이름은 "Pretendard" 가 아닌 HarupinOG 로 바꾼다 — 원본 이름이 Reserved Font Name 이면
수정본은 그 이름을 쓸 수 없다. 고지에 원작자와 원본 이름은 그대로 남는다.

  python3 -m venv .venv-fonts && .venv-fonts/bin/pip install fonttools brotli
  .venv-fonts/bin/python scripts/build-og-fonts.py
"""

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SOURCE = "src/app/fonts/PretendardVariable.woff2"
OUT_DIR = "src/app/fonts/og"
FAMILY = "HarupinOG"

TEXT = (
    "하루핀"
    "지도에 핀 찍고"
    "날짜별로 정리하세요"
    "검색 → 핀 → 날짜별 정리. 여행 계획에 필요한 딱 그만큼만."
    "0123456789"
)

WEIGHTS = {"Bold": 700, "Regular": 400}

# 이름 관련 레코드만 새 이름으로 바꾼다. 0(저작권)·13(라이선스)·14(라이선스 URL)는 그대로 둔다.
# 7(상표)·9(디자이너)도 원작자 표기라 남긴다.
RENAMED_IDS = (1, 2, 3, 4, 6, 16, 17)
# 25 는 가변 폰트의 PostScript 이름 접두사("PretendardVariable")다. 정적 인스턴스에선 쓰이지 않으므로 지운다.
DROPPED_IDS = (25,)


def rename(font: TTFont, style: str) -> None:
    values = {
        1: FAMILY,
        2: style,
        3: f"{FAMILY}-{style}",
        4: f"{FAMILY} {style}",
        6: f"{FAMILY}-{style}",
        16: FAMILY,
        17: style,
    }
    name = font["name"]
    name.names = [
        r for r in name.names if r.nameID not in RENAMED_IDS + DROPPED_IDS
    ]
    for name_id, value in values.items():
        name.setName(value, name_id, 3, 1, 0x409)
        name.setName(value, name_id, 1, 0, 0)


for style, weight in WEIGHTS.items():
    font = TTFont(SOURCE)
    font = instantiateVariableFont(font, {"wght": weight})
    options = Options()
    options.layout_features = ["*"]
    # 기본값은 name ID 0–6 만 남겨 라이선스 고지가 빠진다.
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    subsetter = Subsetter(options)
    subsetter.populate(text=TEXT)
    subsetter.subset(font)
    rename(font, style)
    # 원본의 woff2 형식이 그대로 따라오므로 TTF 로 명시한다 (satori 는 woff2 를 못 읽는다).
    font.flavor = None
    path = f"{OUT_DIR}/{FAMILY}-{style}.ttf"
    font.save(path)
    print(path)
