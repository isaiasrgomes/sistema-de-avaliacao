import { getStatusLabel } from "@/lib/utils/status";
import { getStatusVariant, statusBadgeClassNames } from "@/lib/design/status-variants";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  label,
  className,
}: {
  status?: string | null;
  label?: string;
  className?: string;
}) {
  const variant = getStatusVariant(status);
  const text = label ?? getStatusLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusBadgeClassNames[variant],
        className
      )}
    >
      {text}
    </span>
  );
}
