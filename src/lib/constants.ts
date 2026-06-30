export const APP_NAME = "Spark";
export const APP_TAGLINE = "Share moments. Connect with people.";

export const ROUTES = {
  home: "/",
  feed: "/feed",
  explore: "/explore",
  search: "/search",
  login: "/login",
  register: "/register",
  signup: "/register",
  forgotPassword: "/forgot-password",
  chat: "/messages",
  messages: "/messages",
  conversation: (id: string) => `/conversations/${id}`,
  profile: "/profile",
  userProfile: (id: string) => `/u/${id}`,
  editProfile: "/profile/edit",
  settings: "/settings",
  saved: "/saved",
  notifications: "/notifications",
  premium: "/premium",
  help: "/help",
  privacy: "/privacy",
  terms: "/terms",
  admin: "/admin",
  offline: "/offline",
} as const;

export const API_ROUTES = {
  health: "/api/health",
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    me: "/api/auth/me",
  },
  feed: "/api/feed",
  posts: "/api/posts",
  follow: "/api/follow",
  search: "/api/search",
  stories: "/api/stories",
} as const;

export const FEED = {
  batchSize: 10,
  preloadThreshold: 3,
} as const;

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
} as const;

export const UPLOAD = {
  maxFileSize: 5 * 1024 * 1024, // 5MB profile photos
  maxChatImageSize: 10 * 1024 * 1024, // 10MB chat images
  allowedImageTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const,
  allowedVideoTypes: ["video/mp4", "video/webm", "video/quicktime"] as const,
  allowedAudioTypes: ["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4", "audio/wav"] as const,
  maxVideoSize: 50 * 1024 * 1024, // 50MB post videos
  maxStoryVideoSize: 100 * 1024 * 1024, // 100MB before trim
  maxPostMedia: 10,
  maxPhotos: 6,
  maxInterests: 10,
} as const;

export const CHAT = {
  editWindowMs: 15 * 60 * 1000,
  deleteEveryoneWindowMs: 15 * 60 * 1000,
  typingDebounceMs: 400,
  typingStopDelayMs: 2000,
  /** Long-poll hold while the chat tab is visible (ms). */
  pollActiveTimeoutMs: 2_500,
  /** Long-poll hold when the tab is in the background (ms). */
  pollBackgroundTimeoutMs: 6_000,
  /** Server-side DB check interval inside a long-poll (ms). */
  pollServerIntervalMs: 350,
  messageRateLimit: { maxAttempts: 30, windowMs: 60 * 1000 },
  reactionRateLimit: { maxAttempts: 60, windowMs: 60 * 1000 },
  placeholderGifs: [
    {
      id: "gif-1",
      url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
      previewUrl: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
      title: "Hello",
    },
    {
      id: "gif-2",
      url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
      previewUrl: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
      title: "Love",
    },
    {
      id: "gif-3",
      url: "https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif",
      previewUrl: "https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif",
      title: "Celebrate",
    },
    {
      id: "gif-4",
      url: "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif",
      previewUrl: "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif",
      title: "Thumbs up",
    },
  ],
} as const;

export const SPARK_COLORS = {
  primary: "#FF4458",
  secondary: "#FF6B35",
  accent: "#FF8E53",
  gradient: "linear-gradient(135deg, #FF4458 0%, #FF6B35 50%, #FF8E53 100%)",
} as const;
