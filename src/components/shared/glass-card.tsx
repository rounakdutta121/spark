import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl",
        "dark:border-white/10 dark:bg-white/5",
        "shadow-xl shadow-black/5",
        hover && "transition-all duration-300 hover:bg-white/15 hover:shadow-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
