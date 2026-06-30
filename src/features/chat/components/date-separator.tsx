export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
