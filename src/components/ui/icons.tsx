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
