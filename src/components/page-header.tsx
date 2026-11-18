import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <div className={cn("mb-5 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-[24px] neu-dashboard-card", className)}>
      <div className="space-y-1.5 sm:space-y-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-2 sm:w-2.5 h-8 sm:h-10 bg-teal-500 rounded-full shrink-0 shadow-sm" />
          <h1 className="text-2xl min-[380px]:text-3xl sm:text-4xl font-condensed font-extrabold tracking-tight text-slate-900 dark:text-white uppercase leading-[0.95]">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium pl-4 leading-relaxed max-w-3xl border-l-2 border-teal-500/80">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          {children}
        </div>
      )}
    </div>
  );
}
