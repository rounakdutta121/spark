"use client";

import { motion } from "framer-motion";
import { ArrowRight, Heart, MessageCircle, Shield, Sparkles, Zap } from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import { GlassCard } from "@/components/shared/glass-card";
import { APP_TAGLINE, ROUTES } from "@/lib/constants";

const features = [
  {
    icon: Heart,
    title: "Share Moments",
    description:
      "Post photos, stories, and updates for the people who follow you.",
  },
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    description:
      "Instant messaging with typing indicators, read receipts, and reactions.",
  },
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Block, report, and control who can message or comment on your content.",
  },
  {
    icon: Sparkles,
    title: "Discover People",
    description:
      "Explore trending posts, find creators, and grow your community.",
  },
];

const steps = [
  { step: "01", title: "Create your profile", desc: "Add photos, bio, and username" },
  { step: "02", title: "Follow & explore", desc: "See posts from people you follow" },
  { step: "03", title: "Connect", desc: "Comment, message, and share stories" },
];

export function LandingHero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 size-96 rounded-full bg-[#FF4458]/20 blur-3xl" />
        <div className="absolute right-1/4 top-40 size-80 rounded-full bg-[#FF8E53]/20 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[#FF6B35]/15 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FF4458]/30 bg-[#FF4458]/10 px-4 py-1.5 text-sm font-medium text-[#FF4458]">
            <Zap className="size-4" />
            Share moments the modern way
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
        >
          <span className="bg-gradient-to-r from-[#FF4458] via-[#FF6B35] to-[#FF8E53] bg-clip-text text-transparent">
            Ignite
          </span>{" "}
          your next connection
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          {APP_TAGLINE}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <ButtonLink
            size="lg"
            href={ROUTES.register}
            className="rounded-full bg-gradient-to-r from-[#FF4458] to-[#FF6B35] px-8 text-white hover:opacity-90"
          >
            Start for free
            <ArrowRight className="ml-2 size-4" />
          </ButtonLink>
          <ButtonLink size="lg" variant="outline" href={ROUTES.login} className="rounded-full">
            I already have an account
          </ButtonLink>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 w-full max-w-md"
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-[#FF4458] to-[#FF8E53]" />
              <div className="flex-1 text-left">
                <p className="font-semibold">Sarah, 26</p>
                <p className="text-sm text-muted-foreground">2 miles away</p>
                <div className="mt-2 flex gap-1">
                  {["Travel", "Coffee", "Music"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#FF4458]/10 px-2 py-0.5 text-xs text-[#FF4458]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#FF4458]">92%</p>
                <p className="text-xs text-muted-foreground">match</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to connect
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A social experience built for real connections
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassCard hover className="h-full p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4458]/20 to-[#FF8E53]/20">
                  <feature.icon className="size-6 text-[#FF4458]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Spark works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to your next great date
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative text-center"
            >
              <span className="text-6xl font-bold text-[#FF4458]/20">
                {item.step}
              </span>
              <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCta() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <GlassCard className="overflow-hidden">
          <div className="relative px-8 py-16 text-center sm:px-16">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF4458]/10 to-[#FF8E53]/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to find your spark?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Join thousands of singles discovering meaningful connections every day.
              </p>
              <ButtonLink
                size="lg"
                href={ROUTES.register}
                className="mt-8 rounded-full bg-gradient-to-r from-[#FF4458] to-[#FF6B35] px-8 text-white hover:opacity-90"
              >
                Create your free account
                <ArrowRight className="ml-2 size-4" />
              </ButtonLink>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
