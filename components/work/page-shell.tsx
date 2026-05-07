import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { TONE_CLASSES, type UseCaseTone } from "./use-case-tone";

type Crumb = { label: string; href?: string };

export function WorkBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {c.href && !isLast ? (
              <Link
                href={c.href as any}
                className="hover:text-foreground transition-colors"
              >
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-foreground/80" : ""}>
                {c.label}
              </span>
            )}
            {!isLast && <ChevronRight className="size-3.5 opacity-50" />}
          </span>
        );
      })}
    </nav>
  );
}

type HeaderProps = {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  blurb?: string;
  actions?: React.ReactNode;
  tone?: UseCaseTone;
};

export function WorkPageHeader({ icon: Icon, eyebrow, title, blurb, actions, tone }: HeaderProps) {
  const t = tone ? TONE_CLASSES[tone] : null;
  const iconClasses = t
    ? `flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${t.iconBg} ${t.ring}`
    : "flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] ring-1 ring-primary/15";
  const iconFg = t ? t.iconFg : "text-primary";
  return (
    <div className="flex items-start justify-between gap-4 pb-2">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={iconClasses}>
            <Icon className={`size-5 ${iconFg}`} />
          </div>
        )}
        <div className="space-y-1">
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {blurb && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {blurb}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function WorkCard({
  title,
  description,
  children,
  footer,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {(title || description) && (
        <div className="border-b border-border px-6 py-4">
          {title && (
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-3.5">
          {footer}
        </div>
      )}
    </div>
  );
}
