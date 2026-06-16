import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  eyebrowIcon: Icon,
  title,
  action,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`page-header ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-eyebrow flex items-center gap-1.5 mb-0.5">
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{eyebrow}</span>
            </div>
          )}
          <h1 className="font-display font-black text-2xl text-foreground leading-tight truncate">
            {title}
          </h1>
        </div>
        {action}
      </div>
    </div>
  );
}
