"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Bookmark,
  Camera,
  Compass,
  Hash,
  Heart,
  MessageCircle,
  Play,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import { GlassCard } from "@/components/shared/glass-card";
import { APP_TAGLINE, ROUTES } from "@/lib/constants";

const features = [
  {
    icon: Camera,
    title: "Posts & Reels",
    description:
      "Share photos and videos to your feed. Carousel posts, captions, hashtags, and locations included.",
  },
  {
    icon: Play,
    title: "Stories",
    description:
      "24-hour stories with reactions and comments. Share quick moments that disappear after a day.",
  },
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    description:
      "DMs with text, images, voice notes, GIFs, reactions, read receipts, and typing indicators.",
  },
  {
    icon: Compass,
    title: "Explore",
    description:
      "Discover trending posts and creators outside your follow list. Find inspiration and new voices.",
  },
  {
    icon: Users,
    title: "Follow & Connect",
    description:
      "Build your network with follows, followers, and public profiles. Private accounts supported.",
  },
  {
    icon: Shield,
    title: "Safety Tools",
    description:
      "Block, mute, and report. Control who can message you, comment, or tag you on posts.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create your profile",
    desc: "Add a username, bio, profile photo, and interests so people know who you are.",
  },
  {
    step: "02",
    title: "Post & share stories",
    desc: "Upload photos, videos, and stories. Use hashtags to reach people who care about your topics.",
  },
  {
    step: "03",
    title: "Follow & explore",
    desc: "Follow friends and creators. Browse Explore for trending content across the community.",
  },
  {
    step: "04",
    title: "Chat & engage",
    desc: "Like, comment, save posts, and message people directly — all in one place.",
  },
];

const highlights = [
  { icon: Hash, label: "Hashtags & mentions" },
  { icon: Bell, label: "Push-style notifications" },
  { icon: Bookmark, label: "Save posts for later" },
  { icon: Heart, label: "Likes & comments" },
];

const stats = [
  { value: "Posts", label: "Photos, videos & captions" },
  { value: "Stories", label: "Ephemeral 24h content" },
  { value: "Chat", label: "Private messaging" },
  { value: "Explore", label: "Discover new creators" },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 size-96 rounded-full bg-[#FF4458]/20 blur-3xl" />
        <div className="absolute right-1/4 top-40 size-80 rounded-full bg-[#FF8E53]/20 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[#FF6B35]/15 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FF4458]/30 bg-[#FF4458]/10 px-4 py-1.5 text-sm font-medium text-[#FF4458]">
              <Zap className="size-4" />
              Your social network, reimagined
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Share moments.{" "}
            <span className="bg-gradient-to-r from-[#FF4458] via-[#FF6B35] to-[#FF8E53] bg-clip-text text-transparent">
              Stay connected.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground sm:text-xl"
          >
            {APP_TAGLINE} Post to your feed, share stories, explore trending content,
            and chat with friends — all in one beautiful app.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <ButtonLink
              size="lg"
              href={ROUTES.register}
              className="rounded-full bg-gradient-to-r from-[#FF4458] to-[#FF6B35] px-8 text-white hover:opacity-90"
            >
              Create free account
              <ArrowRight className="ml-2 size-4" />
            </ButtonLink>
            <ButtonLink size="lg" variant="outline" href={ROUTES.login} className="rounded-full">
              Sign in
            </ButtonLink>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            {highlights.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
              >
                <item.icon className="size-3.5 text-[#FF4458]" />
                {item.label}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mx-auto w-full max-w-sm lg:max-w-none"
        >
          <FeedPreviewMock />
        </motion.div>
      </div>
    </section>
  );
}

function FeedPreviewMock() {
  return (
    <div className="space-y-4">
      <GlassCard className="overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="size-9 rounded-full bg-gradient-to-br from-[#FF4458] to-[#FF8E53]" />
          <div>
            <p className="text-sm font-semibold">mia.chen</p>
            <p className="text-xs text-muted-foreground">Brooklyn Bridge · 2h ago</p>
          </div>
        </div>
        <div className="aspect-square bg-gradient-to-br from-orange-200/40 to-rose-300/40 dark:from-orange-900/30 dark:to-rose-900/30" />
        <div className="space-y-2 px-4 py-3">
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Heart className="size-5 fill-[#FF4458] text-[#FF4458]" /> 248
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="size-5" /> 32
            </span>
            <Bookmark className="ml-auto size-5 text-muted-foreground" />
          </div>
          <p className="text-sm">
            <span className="font-semibold">mia.chen </span>
            Golden hour on the bridge #photography #nyc
          </p>
        </div>
      </GlassCard>

      <div className="flex gap-3">
        {stats.map((stat) => (
          <GlassCard key={stat.value} className="flex-1 p-3 text-center">
            <p className="text-sm font-bold text-[#FF4458]">{stat.value}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{stat.label}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export function LandingStats() {
  return (
    <section className="border-y border-white/10 bg-muted/30 py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
        {[
          { icon: Camera, title: "Rich media posts", desc: "Images, videos, carousels & captions" },
          { icon: Sparkles, title: "Stories & reactions", desc: "Share moments that last 24 hours" },
          { icon: MessageCircle, title: "Built-in messaging", desc: "Text, photos, audio & GIFs" },
          { icon: Compass, title: "Explore feed", desc: "Trending posts from the community" },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-4"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FF4458]/10">
              <item.icon className="size-5 text-[#FF4458]" />
            </div>
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a modern social app needs
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Spark combines the best parts of a feed, stories, explore, and messaging —
            without the clutter.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <GlassCard hover className="h-full p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4458]/20 to-[#FF8E53]/20">
                  <feature.icon className="size-6 text-[#FF4458]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
    <section id="how-it-works" className="bg-muted/20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get started in minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Four simple steps from sign-up to your first post
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative"
            >
              <GlassCard className="h-full p-6">
                <span className="text-4xl font-bold text-[#FF4458]/30">{item.step}</span>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </GlassCard>
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
          <div className="relative px-8 py-16 text-center sm:px-16 sm:py-20">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF4458]/10 to-[#FF8E53]/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to join Spark?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Create your profile, share your first post, and start building your
                community today. Free to join.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink
                  size="lg"
                  href={ROUTES.register}
                  className="rounded-full bg-gradient-to-r from-[#FF4458] to-[#FF6B35] px-8 text-white hover:opacity-90"
                >
                  Get started free
                  <ArrowRight className="ml-2 size-4" />
                </ButtonLink>
                <ButtonLink size="lg" variant="ghost" href={ROUTES.explore} className="rounded-full">
                  See explore feed
                </ButtonLink>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
