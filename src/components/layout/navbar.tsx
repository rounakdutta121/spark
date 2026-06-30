"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { ButtonLink } from "@/components/shared/button-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 z-50 w-full border-b border-white/10",
        "bg-background/60 backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ButtonLink
            variant="ghost"
            size="sm"
            href={ROUTES.login}
            className="hidden sm:inline-flex"
          >
            Log in
          </ButtonLink>
          <ButtonLink
            size="sm"
            href={ROUTES.register}
            className="rounded-full bg-gradient-to-r from-[#FF4458] to-[#FF6B35] text-white hover:opacity-90"
          >
            Get Started
          </ButtonLink>
        </div>
      </div>
    </motion.header>
  );
}
