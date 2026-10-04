import type { ReactNode } from "react";

type IconProps = { className?: string };

function Chevron({ d, className }: IconProps & { d: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export function ChevronDown({ className }: IconProps) {
  return <Chevron d="m4 6 4 4 4-4" className={className} />;
}

export function ChevronUp({ className }: IconProps) {
  return <Chevron d="m4 10 4-4 4 4" className={className} />;
}

export function ChevronLeft({ className }: IconProps) {
  return <Chevron d="M10 3 5 8l5 5" className={className} />;
}

/** 24 격자 선 아이콘(lucide 형태). 크기는 className 으로 준다. */
function Line({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function ArrowLeft({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </Line>
  );
}

export function LogOut({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Line>
  );
}

export function Settings({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Line>
  );
}

export function ArrowUpRight({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </Line>
  );
}

export function Plus({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </Line>
  );
}

export function Search({ className }: IconProps) {
  return (
    <Line className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Line>
  );
}

export function MapPin({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </Line>
  );
}

export function MapFold({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M14.1 5.9 9.9 3.8a2 2 0 0 0-1.8 0L3.6 6A1 1 0 0 0 3 7v12.8a1 1 0 0 0 1.4.9l3.7-1.9a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.2a1 1 0 0 0 .6-.9V5.2a1 1 0 0 0-1.4-.9l-3.7 1.9a2 2 0 0 1-1.8 0" />
      <path d="M15 5.8v15" />
      <path d="M9 3.2v15" />
    </Line>
  );
}

export function Calendar({ className }: IconProps) {
  return (
    <Line className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </Line>
  );
}

export function Cloud({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z" />
    </Line>
  );
}

export function StickyNote({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
      <path d="M15 3v4a2 2 0 0 0 2 2h4" />
    </Line>
  );
}

/** 카테고리 아이콘. 볼거리=카메라, 먹거리=포크·나이프, 놀거리=티켓, 숙소=침대. */
export function CategoryIcon({
  category,
  className,
}: IconProps & { category: string }) {
  switch (category) {
    case "sight":
      return (
        <Line className={className}>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
          <circle cx="12" cy="13" r="3" />
        </Line>
      );
    case "food":
      return (
        <Line className={className}>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </Line>
      );
    case "activity":
      return (
        <Line className={className}>
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </Line>
      );
    default:
      return (
        <Line className={className}>
          <path d="M2 4v16" />
          <path d="M2 8h18a2 2 0 0 1 2 2v10" />
          <path d="M2 17h20" />
          <path d="M6 8v9" />
        </Line>
      );
  }
}
