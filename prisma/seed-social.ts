import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { extractHashtags } from "../src/services/social/hashtag.util";

const prisma = new PrismaClient();
const PASSWORD = "Demo1234!";

interface Creator {
  name: string;
  username: string;
  email: string;
  bio: string;
  city: string;
  country: string;
  occupation: string;
  avatarSeed: string;
  interests: string[];
}

const CREATORS: Creator[] = [
  {
    name: "Mia Chen",
    username: "miachen",
    email: "mia@spark.test",
    bio: "NYC photographer · coffee runs · golden hour chaser",
    city: "New York",
    country: "USA",
    occupation: "Photographer",
    avatarSeed: "mia-avatar",
    interests: ["Photography", "Coffee", "Travel"],
  },
  {
    name: "Jordan Blake",
    username: "jblake",
    email: "jordan@spark.test",
    bio: "Building apps by day, cooking pasta by night",
    city: "San Francisco",
    country: "USA",
    occupation: "Software Engineer",
    avatarSeed: "jordan-avatar",
    interests: ["Coding", "Cooking", "Startups"],
  },
  {
    name: "Ava Martinez",
    username: "avamtz",
    email: "ava@spark.test",
    bio: "Travel vlogs · street food · sunset collector",
    city: "Austin",
    country: "USA",
    occupation: "Content Creator",
    avatarSeed: "ava-avatar",
    interests: ["Travel", "Food", "Content Creation"],
  },
  {
    name: "Noah Kim",
    username: "noahkim",
    email: "noah@spark.test",
    bio: "Fitness · meal prep · weekend hikes",
    city: "Seattle",
    country: "USA",
    occupation: "Personal Trainer",
    avatarSeed: "noah-avatar",
    interests: ["Fitness", "Hiking", "Meal Prep"],
  },
  {
    name: "Lena Park",
    username: "lenapark",
    email: "lena@spark.test",
    bio: "Digital art · K-pop · cozy gaming nights",
    city: "Los Angeles",
    country: "USA",
    occupation: "Illustrator",
    avatarSeed: "lena-avatar",
    interests: ["Art", "K-Pop", "Gaming"],
  },
  {
    name: "Chris Okafor",
    username: "chrisoka",
    email: "chris@spark.test",
    bio: "Startup founder · basketball · podcast addict",
    city: "Chicago",
    country: "USA",
    occupation: "Founder",
    avatarSeed: "chris-avatar",
    interests: ["Entrepreneurship", "Basketball", "Podcasts"],
  },
  {
    name: "Sophie Turner",
    username: "sophieturner",
    email: "sophie@spark.test",
    bio: "Vintage finds · runway notes · thrift queen",
    city: "London",
    country: "UK",
    occupation: "Fashion Blogger",
    avatarSeed: "sophie-avatar",
    interests: ["Fashion", "Thrifting", "Photography"],
  },
  {
    name: "Marcus Lee",
    username: "marcuslee",
    email: "marcus@spark.test",
    bio: "Farm-to-table chef · sourdough dad · market mornings",
    city: "Toronto",
    country: "Canada",
    occupation: "Chef",
    avatarSeed: "marcus-avatar",
    interests: ["Cooking", "Baking", "Fine Dining"],
  },
  {
    name: "Priya Shah",
    username: "priyashah",
    email: "priya@spark.test",
    bio: "Yoga at sunrise · chai enthusiast · mindful living",
    city: "Mumbai",
    country: "India",
    occupation: "Yoga Instructor",
    avatarSeed: "priya-avatar",
    interests: ["Yoga", "Meditation", "Tea"],
  },
  {
    name: "Ethan Cole",
    username: "ethancole",
    email: "ethan@spark.test",
    bio: "Producing beats · vinyl digs · late studio nights",
    city: "Denver",
    country: "USA",
    occupation: "Music Producer",
    avatarSeed: "ethan-avatar",
    interests: ["Music", "Hip Hop", "Concerts"],
  },
  {
    name: "Zara Ali",
    username: "zaraali",
    email: "zara@spark.test",
    bio: "Desert roads · film camera · chasing light",
    city: "Dubai",
    country: "UAE",
    occupation: "Travel Photographer",
    avatarSeed: "zara-avatar",
    interests: ["Travel", "Photography", "Beach"],
  },
  {
    name: "Riley Brooks",
    username: "rileybrooks",
    email: "riley@spark.test",
    bio: "Pour-over obsessive · short fiction · rainy walks",
    city: "Portland",
    country: "USA",
    occupation: "Writer",
    avatarSeed: "riley-avatar",
    interests: ["Coffee", "Writing", "Reading"],
  },
];

const POSTS: {
  email: string;
  caption: string;
  location?: string;
  imageSeed: string;
  daysAgo: number;
}[] = [
  { email: "mia@spark.test", caption: "Golden hour on the bridge #photography #nyc", location: "Brooklyn Bridge", imageSeed: "mia-post-1", daysAgo: 1 },
  { email: "mia@spark.test", caption: "Morning latte art ☕ #coffee", location: "SoHo", imageSeed: "mia-post-2", daysAgo: 4 },
  { email: "jordan@spark.test", caption: "Shipped a feature before dinner #coding #buildinpublic", location: "SF", imageSeed: "jordan-post-1", daysAgo: 0 },
  { email: "jordan@spark.test", caption: "Homemade ramen night 🍜 #cooking", imageSeed: "jordan-post-2", daysAgo: 3 },
  { email: "ava@spark.test", caption: "Taco crawl complete #foodie #austin", location: "East Austin", imageSeed: "ava-post-1", daysAgo: 2 },
  { email: "ava@spark.test", caption: "Road trip views #travel #wanderlust", imageSeed: "ava-post-2", daysAgo: 6 },
  { email: "noah@spark.test", caption: "Leg day done ✅ #fitness #gym", location: "Capitol Hill Gym", imageSeed: "noah-post-1", daysAgo: 1 },
  { email: "noah@spark.test", caption: "Trail run at sunrise #hiking", imageSeed: "noah-post-2", daysAgo: 5 },
  { email: "lena@spark.test", caption: "New digital piece dropping soon #art #illustration", imageSeed: "lena-post-1", daysAgo: 2 },
  { email: "lena@spark.test", caption: "Cozy setup for stream night #gaming", imageSeed: "lena-post-2", daysAgo: 7 },
  { email: "chris@spark.test", caption: "Team offsite vibes #startup #team", location: "Chicago", imageSeed: "chris-post-1", daysAgo: 1 },
  { email: "chris@spark.test", caption: "Court session after work #basketball", imageSeed: "chris-post-2", daysAgo: 4 },
  { email: "sophie@spark.test", caption: "Found the perfect blazer at the market #fashion #thrifting", location: "Brick Lane", imageSeed: "sophie-post-1", daysAgo: 0 },
  { email: "sophie@spark.test", caption: "OOTD before the show #style #london", imageSeed: "sophie-post-2", daysAgo: 3 },
  { email: "marcus@spark.test", caption: "Sunday sourdough crackle #baking #bread", imageSeed: "marcus-post-1", daysAgo: 2 },
  { email: "marcus@spark.test", caption: "Farmers market haul #cooking #local", location: "St. Lawrence Market", imageSeed: "marcus-post-2", daysAgo: 5 },
  { email: "priya@spark.test", caption: "Sun salutations on the rooftop #yoga #mindfulness", imageSeed: "priya-post-1", daysAgo: 1 },
  { email: "priya@spark.test", caption: "Evening chai and journaling #meditation", imageSeed: "priya-post-2", daysAgo: 6 },
  { email: "ethan@spark.test", caption: "New track almost done 🎧 #music #producer", imageSeed: "ethan-post-1", daysAgo: 0 },
  { email: "ethan@spark.test", caption: "Vinyl pickup day #hiphop", location: "Denver", imageSeed: "ethan-post-2", daysAgo: 4 },
  { email: "zara@spark.test", caption: "Dunes at blue hour #travel #photography", location: "Liwa", imageSeed: "zara-post-1", daysAgo: 2 },
  { email: "zara@spark.test", caption: "Film scan came back perfect #wanderlust", imageSeed: "zara-post-2", daysAgo: 8 },
  { email: "riley@spark.test", caption: "Rainy cafe writing session #writing #coffee", location: "Portland", imageSeed: "riley-post-1", daysAgo: 1 },
  { email: "riley@spark.test", caption: "Finished a short story draft #reading", imageSeed: "riley-post-2", daysAgo: 5 },
];

const COMMENTS: { postCaptionPrefix: string; authorEmail: string; text: string }[] = [
  { postCaptionPrefix: "Golden hour", authorEmail: "ava@spark.test", text: "This lighting is unreal 😍" },
  { postCaptionPrefix: "Shipped a feature", authorEmail: "chris@spark.test", text: "Congrats on the ship!" },
  { postCaptionPrefix: "Taco crawl", authorEmail: "marcus@spark.test", text: "Need that spot list" },
  { postCaptionPrefix: "New digital piece", authorEmail: "lena@spark.test", text: "Can't wait to see it!" },
  { postCaptionPrefix: "Sunday sourdough", authorEmail: "jordan@spark.test", text: "That crust though 🔥" },
  { postCaptionPrefix: "Dunes at blue hour", authorEmail: "mia@spark.test", text: "Stunning composition" },
];

function photoUrl(seed: string, width = 800, height = 800) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(10 + (days % 8), 30, 0, 0);
  return d;
}

async function upsertCreator(creator: Creator, passwordHash: string) {
  const user = await prisma.user.upsert({
    where: { email: creator.email },
    update: {
      name: creator.name,
      isActive: true,
      profileCompleted: true,
      emailVerified: true,
      lastActiveAt: new Date(),
    },
    create: {
      name: creator.name,
      email: creator.email,
      password: passwordHash,
      profileCompleted: true,
      emailVerified: true,
      isActive: true,
    },
  });

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      username: creator.username,
      bio: creator.bio,
      city: creator.city,
      country: creator.country,
      occupation: creator.occupation,
      profileCompletion: 85,
      verified: true,
    },
    create: {
      userId: user.id,
      username: creator.username,
      bio: creator.bio,
      city: creator.city,
      country: creator.country,
      occupation: creator.occupation,
      profileCompletion: 85,
      verified: true,
    },
  });

  const avatar = photoUrl(creator.avatarSeed);
  const existingPhoto = await prisma.photo.findFirst({
    where: { profileId: profile.id, isPrimary: true },
  });
  if (!existingPhoto) {
    await prisma.photo.create({
      data: { profileId: profile.id, url: avatar, order: 0, isPrimary: true },
    });
  } else if (existingPhoto.url !== avatar) {
    await prisma.photo.update({
      where: { id: existingPhoto.id },
      data: { url: avatar },
    });
  }

  for (const interestName of creator.interests) {
    const interest = await prisma.interest.findUnique({
      where: { name: interestName },
    });
    if (!interest) continue;
    await prisma.profileInterest.upsert({
      where: {
        profileId_interestId: {
          profileId: profile.id,
          interestId: interest.id,
        },
      },
      create: { profileId: profile.id, interestId: interest.id },
      update: {},
    });
  }

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  return user;
}

async function syncHashtags(postId: string, caption: string | null) {
  await prisma.postHashtag.deleteMany({ where: { postId } });
  const tags = extractHashtags(caption);
  for (const name of tags) {
    const hashtag = await prisma.hashtag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    await prisma.postHashtag.create({
      data: { postId, hashtagId: hashtag.id },
    });
  }
}

async function main() {
  console.log("Seeding social demo data...");
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const userIds: string[] = [];
  const postIds: string[] = [];

  for (const creator of CREATORS) {
    const user = await upsertCreator(creator, passwordHash);
    userIds.push(user.id);
    console.log(`  ✓ ${creator.name} (@${creator.username})`);
  }

  for (const post of POSTS) {
    const author = await prisma.user.findUnique({ where: { email: post.email } });
    if (!author) continue;

    const existing = await prisma.post.findFirst({
      where: { authorId: author.id, caption: post.caption },
    });
    if (existing) {
      postIds.push(existing.id);
      continue;
    }

    const createdAt = daysAgoDate(post.daysAgo);
    const created = await prisma.post.create({
      data: {
        authorId: author.id,
        caption: post.caption,
        location: post.location,
        visibility: "PUBLIC",
        status: "PUBLISHED",
        createdAt,
        updatedAt: createdAt,
        media: {
          create: [{ url: photoUrl(post.imageSeed), type: "IMAGE", order: 0 }],
        },
      },
    });
    await syncHashtags(created.id, post.caption);
    postIds.push(created.id);
  }

  for (const postId of postIds) {
    const likers = userIds.slice(0, 4 + (postId.length % 5));
    for (const likerId of likers) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
      if (!post || post.authorId === likerId) continue;
      await prisma.postLike.upsert({
        where: { postId_userId: { postId, userId: likerId } },
        create: { postId, userId: likerId },
        update: {},
      });
    }
  }

  for (const comment of COMMENTS) {
    const post = await prisma.post.findFirst({
      where: { caption: { startsWith: comment.postCaptionPrefix } },
    });
    const author = await prisma.user.findUnique({
      where: { email: comment.authorEmail },
    });
    if (!post || !author || post.authorId === author.id) continue;

    const exists = await prisma.postComment.findFirst({
      where: { postId: post.id, authorId: author.id, text: comment.text },
    });
    if (exists) continue;

    await prisma.postComment.create({
      data: {
        postId: post.id,
        authorId: author.id,
        text: comment.text,
      },
    });
  }

  const allUsers = await prisma.user.findMany({ select: { id: true } });
  for (const user of allUsers) {
    for (const creatorId of userIds) {
      if (user.id === creatorId) continue;
      await prisma.follow.upsert({
        where: {
          followerId_followingId: { followerId: user.id, followingId: creatorId },
        },
        create: { followerId: user.id, followingId: creatorId, status: "ACCEPTED" },
        update: { status: "ACCEPTED" },
      });
    }
  }

  for (let i = 0; i < userIds.length; i++) {
    const a = userIds[i];
    const b = userIds[(i + 3) % userIds.length];
    if (a === b) continue;
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: a, followingId: b } },
      create: { followerId: a, followingId: b, status: "ACCEPTED" },
      update: { status: "ACCEPTED" },
    });
  }

  console.log(`\nSeeded ${CREATORS.length} profiles and ${POSTS.length} posts.`);
  console.log(`Demo password for all accounts: ${PASSWORD}`);
  console.log("Sample logins: mia@spark.test, sophie@spark.test, ethan@spark.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
