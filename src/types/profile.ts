import type {
  Gender,
  InterestedIn,
  LifestyleHabit,
  PetsPreference,
  RelationshipGoal,
} from "@prisma/client";

export interface ProfilePhoto {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProfileInterest {
  id: string;
  name: string;
  icon: string;
}

export interface UserSettingsDto {
  profileVisible: boolean;
  showDistance: boolean;
  showAge: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
}

export interface UserLocationDto {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  updatedAt: string;
}

export interface ProfileDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  bio: string | null;
  username: string | null;
  gender: Gender | null;
  interestedIn: InterestedIn | null;
  birthday: string | null;
  height: number | null;
  occupation: string | null;
  education: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  relationshipGoal: RelationshipGoal | null;
  smoking: LifestyleHabit | null;
  drinking: LifestyleHabit | null;
  pets: PetsPreference | null;
  profileCompletion: number;
  verified: boolean;
  photos: ProfilePhoto[];
  interests: ProfileInterest[];
  settings: UserSettingsDto;
  location: UserLocationDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterestOption {
  id: string;
  name: string;
  icon: string;
}

export interface ProfileCompletionBreakdown {
  percentage: number;
  items: {
    key: string;
    label: string;
    completed: boolean;
    weight: number;
  }[];
}
