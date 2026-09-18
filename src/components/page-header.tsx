import Image from "next/image";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export function PageHeader({
  breadcrumb,
  title,
  subtitle,
  tagline,
  icon: Icon,
  imageSrc,
  actions,
}: {
  breadcrumb: { label: string; href?: string }[];
  title: string;
  subtitle: string;
  tagline?: { linea1: string; linea2: string };
  icon?: LucideIcon;
  imageSrc?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        {breadcrumb.map((item, i) => (
          <span key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-4 sm:flex-initial">
          {tagline && (Icon || imageSrc) && (
            <div className="hidden items-center gap-3 xl:flex">
              {imageSrc ? (
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={imageSrc} alt="" fill className="object-cover" />
                </div>
              ) : (
                Icon && (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                )
              )}
              <p className="max-w-[160px] text-sm leading-snug text-muted-foreground">
                {tagline.linea1}
                <br />
                <span className="font-semibold text-foreground">{tagline.linea2}</span>
              </p>
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
