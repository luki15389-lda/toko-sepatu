import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "default" | "warn" | "danger";
}) {
  const cls = cn(
    "block rounded-xl border p-5",
    tone === "default" && "border-stone-line bg-white",
    tone === "warn" && "border-amber-200 bg-amber-50",
    tone === "danger" && "border-red-200 bg-red-50",
    href && "transition hover:border-ink"
  );

  const body = (
    <>
      <p
        className={cn(
          "text-sm",
          tone === "default" && "text-neutral-500",
          tone === "warn" && "text-amber-800",
          tone === "danger" && "text-red-700"
        )}
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </>
  );

  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}