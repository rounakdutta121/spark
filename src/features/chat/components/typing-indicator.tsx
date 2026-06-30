import { motion } from "framer-motion";

export function TypingIndicator({ name }: { name?: string }) {
  return (
    <div className="flex items-end gap-2 px-1 py-2">
      <div className="rounded-2xl rounded-bl-md border border-white/10 bg-muted/40 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-muted-foreground/70"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
        {name && (
          <p className="mt-1 text-[10px] text-muted-foreground">{name} is typing…</p>
        )}
      </div>
    </div>
  );
}
