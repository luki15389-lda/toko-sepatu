import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <rect width="40" height="40" rx="10" fill={invert ? "#ffffff" : "#0a0a0a"} />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="24"
        fill={invert ? "#0a0a0a" : "#ffffff"}
      >
        S
      </text>
      <rect x="11" y="29" width="18" height="3" rx="1.5" fill="#ff5a1f" />
    </svg>
  );
}

export function Logo({
  name,
  className,
  invert = false,
}: {
  name: string;
  className?: string;
  invert?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark invert={invert} className="size-8 shrink-0" />
      <span className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
        {name}
      </span>
    </span>
  );
}