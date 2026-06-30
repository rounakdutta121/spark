import { z } from "zod";

export const reportUserSchema = z.object({
  reason: z.enum([
    "SPAM",
    "FAKE_PROFILE",
    "HARASSMENT",
    "INAPPROPRIATE_CONTENT",
    "UNDERAGE",
    "OTHER",
  ]),
  details: z.string().max(1000).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const notificationSettingsSchema = z.object({
  pushNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  profileVisible: z.boolean().optional(),
  showDistance: z.boolean().optional(),
  showAge: z.boolean().optional(),
  isPrivateAccount: z.boolean().optional(),
  messagePermission: z.enum(["EVERYONE", "FOLLOWERS", "NONE"]).optional(),
  mentionPermission: z.enum(["EVERYONE", "FOLLOWERS", "NONE"]).optional(),
  tagPermission: z.enum(["EVERYONE", "FOLLOWERS", "NONE"]).optional(),
  commentPermission: z.enum(["EVERYONE", "FOLLOWERS", "NONE"]).optional(),
});

export const adminReportStatusSchema = z.object({
  status: z.enum(["REVIEWED", "DISMISSED"]),
});

export const adminBanSchema = z.object({
  isActive: z.boolean(),
});
