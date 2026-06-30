import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeMediaUrl } from "@/lib/upload/media-url";
import { calculateProfileCompletion } from "@/services/profile/completion.service";
import type { ProfileDto } from "@/types/profile";
import type { UpdateProfileInput } from "@/schemas/profile/profile.schema";

const profileInclude = {
  photos: { orderBy: { order: "asc" as const } },
  interests: { include: { interest: true } },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      profileCompleted: true,
    },
  },
} satisfies Prisma.ProfileInclude;

type ProfileWithRelations = Prisma.ProfileGetPayload<{
  include: typeof profileInclude;
}>;

export class ProfileServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ProfileServiceError";
  }
}

function toProfileDto(
  profile: ProfileWithRelations,
  settings: {
    profileVisible: boolean;
    showDistance: boolean;
    showAge: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    darkMode: boolean;
  },
  location: {
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    country: string | null;
    updatedAt: Date;
  } | null,
): ProfileDto {
  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user.name,
    email: profile.user.email,
    bio: profile.bio,
    username: profile.username,
    gender: profile.gender,
    interestedIn: profile.interestedIn,
    birthday: profile.birthday?.toISOString().split("T")[0] ?? null,
    height: profile.height,
    occupation: profile.occupation,
    education: profile.education,
    city: profile.city,
    country: profile.country,
    latitude: profile.latitude,
    longitude: profile.longitude,
    relationshipGoal: profile.relationshipGoal,
    smoking: profile.smoking,
    drinking: profile.drinking,
    pets: profile.pets,
    profileCompletion: profile.profileCompletion,
    verified: profile.verified,
    photos: profile.photos.map((p) => ({
      id: p.id,
      url: normalizeMediaUrl(p.url) ?? p.url,
      order: p.order,
      isPrimary: p.isPrimary,
      createdAt: p.createdAt.toISOString(),
    })),
    interests: profile.interests.map((pi) => ({
      id: pi.interest.id,
      name: pi.interest.name,
      icon: pi.interest.icon,
    })),
    settings,
    location: location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
          country: location.country,
          updatedAt: location.updatedAt.toISOString(),
        }
      : null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

async function ensureProfileData(userId: string) {
  let profile = await prisma.profile.findUnique({
    where: { userId },
    include: profileInclude,
  });

  if (!profile) {
    await prisma.$transaction([
      prisma.profile.create({ data: { userId } }),
      prisma.userSettings.create({ data: { userId } }),
      prisma.userLocation.create({ data: { userId } }),
    ]);

    profile = await prisma.profile.findUniqueOrThrow({
      where: { userId },
      include: profileInclude,
    });
  }

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const location = await prisma.userLocation.findUnique({ where: { userId } });

  if (!settings) {
    await prisma.userSettings.create({ data: { userId } });
  }
  if (!location) {
    await prisma.userLocation.create({ data: { userId } });
  }

  return {
    profile,
    settings: settings ?? (await prisma.userSettings.findUniqueOrThrow({ where: { userId } })),
    location: location ?? (await prisma.userLocation.findUnique({ where: { userId } })),
  };
}

async function syncCompletion(userId: string, profileId: string) {
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: profileId },
    include: {
      photos: { select: { id: true } },
      interests: { select: { interestId: true } },
    },
  });

  const { percentage } = calculateProfileCompletion({ profile });
  const isComplete = percentage >= 100;

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profileId },
      data: { profileCompletion: percentage },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { profileCompleted: isComplete },
    }),
  ]);

  return percentage;
}

export async function getProfile(userId: string): Promise<ProfileDto> {
  const { profile, settings, location } = await ensureProfileData(userId);
  return toProfileDto(profile, settings, location);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<ProfileDto> {
  const { profile, settings } = await ensureProfileData(userId);

  if (input.username) {
    const taken = await prisma.profile.findFirst({
      where: { username: input.username, userId: { not: userId } },
    });
    if (taken) {
      throw new ProfileServiceError("Username is already taken", 400);
    }
  }

  let updatedSettings = settings;

  if (input.settings) {
    updatedSettings = await prisma.userSettings.update({
      where: { userId },
      data: input.settings,
    });
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      username: input.username ?? profile.username,
      bio: input.bio ?? null,
      occupation: input.occupation ?? null,
      education: input.education ?? null,
      city: input.city ?? profile.city,
      country: input.country ?? profile.country,
      latitude: input.latitude ?? profile.latitude,
      longitude: input.longitude ?? profile.longitude,
    },
  });

  await syncCompletion(userId, profile.id);

  const refreshed = await prisma.profile.findUniqueOrThrow({
    where: { id: profile.id },
    include: profileInclude,
  });

  const refreshedLocation = await prisma.userLocation.findUnique({
    where: { userId },
  });

  return toProfileDto(refreshed, updatedSettings, refreshedLocation);
}

export async function getProfileByUserId(userId: string) {
  const data = await ensureProfileData(userId);
  return data.profile;
}

export async function verifyPhotoOwnership(
  userId: string,
  photoId: string,
): Promise<{ photoId: string; profileId: string; url: string }> {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new ProfileServiceError("Profile not found", 404);
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, profileId: profile.id },
  });

  if (!photo) {
    throw new ProfileServiceError("Photo not found", 404);
  }

  return { photoId: photo.id, profileId: profile.id, url: photo.url };
}

export async function addPhoto(
  userId: string,
  url: string,
  isPrimary: boolean,
): Promise<ProfileDto> {
  const { profile, settings, location } = await ensureProfileData(userId);

  const photoCount = await prisma.photo.count({
    where: { profileId: profile.id },
  });

  if (photoCount >= 6) {
    throw new ProfileServiceError("Maximum 6 photos allowed", 400);
  }

  const order = photoCount;

  if (isPrimary || photoCount === 0) {
    await prisma.photo.updateMany({
      where: { profileId: profile.id },
      data: { isPrimary: false },
    });
  }

  await prisma.photo.create({
    data: {
      profileId: profile.id,
      url,
      order,
      isPrimary: isPrimary || photoCount === 0,
    },
  });

  await syncCompletion(userId, profile.id);

  const refreshed = await prisma.profile.findUniqueOrThrow({
    where: { id: profile.id },
    include: profileInclude,
  });

  return toProfileDto(refreshed, settings, location);
}

export async function deletePhoto(
  userId: string,
  photoId: string,
): Promise<ProfileDto> {
  const { url, profileId } = await verifyPhotoOwnership(userId, photoId);

  await prisma.photo.delete({ where: { id: photoId } });

  const remaining = await prisma.photo.findMany({
    where: { profileId },
    orderBy: { order: "asc" },
  });

  const hasPrimary = remaining.some((p) => p.isPrimary);

  await prisma.$transaction(
    remaining.map((photo, index) =>
      prisma.photo.update({
        where: { id: photo.id },
        data: {
          order: index,
          isPrimary: !hasPrimary && index === 0 ? true : photo.isPrimary,
        },
      }),
    ),
  );

  await syncCompletion(userId, profileId);

  const { deleteUploadedImage } = await import("@/lib/upload/storage");
  await deleteUploadedImage(url);

  return getProfile(userId);
}

export async function reorderPhotos(
  userId: string,
  photoIds: string[],
): Promise<ProfileDto> {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new ProfileServiceError("Profile not found", 404);
  }

  const photos = await prisma.photo.findMany({
    where: { profileId: profile.id },
  });

  if (photoIds.length !== photos.length) {
    throw new ProfileServiceError("Invalid photo order", 400);
  }

  const photoIdSet = new Set(photos.map((p) => p.id));
  for (const id of photoIds) {
    if (!photoIdSet.has(id)) {
      throw new ProfileServiceError("Invalid photo ID", 400);
    }
  }

  await prisma.$transaction(
    photoIds.map((id, index) =>
      prisma.photo.update({
        where: { id },
        data: {
          order: index,
          isPrimary: index === 0,
        },
      }),
    ),
  );

  return getProfile(userId);
}

export async function updateLocation(
  userId: string,
  data: {
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    country?: string | null;
  },
): Promise<ProfileDto> {
  const { profile } = await ensureProfileData(userId);

  let city = data.city ?? profile.city;
  let country = data.country ?? profile.country;

  if (data.latitude != null && data.longitude != null && !city && !country) {
    const { reverseGeocode } = await import(
      "@/services/location/geocoding.service"
    );
    const result = await reverseGeocode(data.latitude, data.longitude);
    city = result.city;
    country = result.country;
  }

  await prisma.$transaction([
    prisma.userLocation.upsert({
      where: { userId },
      create: {
        userId,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        city,
        country,
      },
      update: {
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        city,
        country,
      },
    }),
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        latitude: data.latitude ?? profile.latitude,
        longitude: data.longitude ?? profile.longitude,
        city,
        country,
      },
    }),
  ]);

  await syncCompletion(userId, profile.id);
  return getProfile(userId);
}

export async function getAllInterests() {
  return prisma.interest.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, icon: true },
  });
}

export { calculateProfileCompletion };
