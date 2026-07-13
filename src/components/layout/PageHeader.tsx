import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-5 sm:pb-6 md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 md:w-auto md:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
