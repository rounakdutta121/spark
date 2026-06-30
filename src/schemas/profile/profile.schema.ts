import { z } from "zod";

function emptyToNull<T>(value: T): T | null {
  return value === "" ? null : value;
}

const genderEnum = z.enum(["MALE", "FEMALE", "NON_BINARY", "OTHER"]);
const interestedInEnum = z.enum(["MEN", "WOMEN", "EVERYONE", "NON_BINARY"]);
const relationshipGoalEnum = z.enum([
  "CASUAL",
  "LONG_TERM",
  "MARRIAGE",
  "FRIENDSHIP",
  "NOT_SURE",
]);
const lifestyleEnum = z.enum([
  "NEVER",
  "SOMETIMES",
  "REGULARLY",
  "PREFER_NOT_TO_SAY",
]);
const petsEnum = z.enum([
  "NONE",
  "DOGS",
  "CATS",
  "BOTH",
  "OTHER",
  "PREFER_NOT_TO_SAY",
]);

export const updateProfileSchema = z.object({
  bio: z.preprocess(
    emptyToNull,
    z.string().trim().max(500, "Bio must be at most 500 characters").nullable(),
  ).optional(),
  username: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
      .nullable(),
  ).optional(),
  gender: z.preprocess(
    emptyToNull,
    genderEnum.nullable(),
  ).optional(),
  interestedIn: z.preprocess(
    emptyToNull,
    interestedInEnum.nullable(),
  ).optional(),
  birthday: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthday must be YYYY-MM-DD")
      .nullable(),
  ).optional(),
  height: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = typeof val === "number" ? val : Number(val);
    return Number.isNaN(num) ? null : num;
  }, z.number().int().min(100, "Height must be at least 100cm").max(250, "Height must be at most 250cm").nullable()).optional(),
  occupation: z.preprocess(
    emptyToNull,
    z.string().trim().max(100).nullable(),
  ).optional(),
  education: z.preprocess(
    emptyToNull,
    z.string().trim().max(100).nullable(),
  ).optional(),
  city: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()).optional(),
  country: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()).optional(),
  latitude: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }, z.number().min(-90).max(90).nullable()).optional(),
  longitude: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }, z.number().min(-180).max(180).nullable()).optional(),
  relationshipGoal: z.preprocess(
    emptyToNull,
    relationshipGoalEnum.nullable(),
  ).optional(),
  smoking: z.preprocess(emptyToNull, lifestyleEnum.nullable()).optional(),
  drinking: z.preprocess(emptyToNull, lifestyleEnum.nullable()).optional(),
  pets: z.preprocess(emptyToNull, petsEnum.nullable()).optional(),
  interestIds: z
    .array(z.string())
    .max(10, "You can select up to 10 interests")
    .optional(),
  settings: z
    .object({
      profileVisible: z.boolean().optional(),
      showDistance: z.boolean().optional(),
      showAge: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      darkMode: z.boolean().optional(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const photoOrderSchema = z.object({
  photoIds: z
    .array(z.string())
    .min(1, "At least one photo ID required")
    .max(6, "Maximum 6 photos allowed"),
});

export const deletePhotoSchema = z.object({
  photoId: z.string().min(1, "Photo ID is required"),
});

export const locationSchema = z.object({
  latitude: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }, z.number().min(-90).max(90).nullable()).optional(),
  longitude: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }, z.number().min(-180).max(180).nullable()).optional(),
  city: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()).optional(),
  country: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()).optional(),
});

export type LocationInput = z.infer<typeof locationSchema>;
