import type {
  FollowStatus,
  MediaType,
  PostStatus,
  PostVisibility,
} from "@prisma/client";

export interface SocialUserPreview {
  id: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  verified: boolean;
}

export interface PostMediaView {
  id: string;
  url: string;
  type: MediaType;
  order: number;
  altText: string | null;
}

export interface PostView {
  id: string;
  caption: string | null;
  location: string | null;
  visibility: PostVisibility;
  status: PostStatus;
  createdAt: string;
  author: SocialUserPreview;
  media: PostMediaView[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  hashtags: string[];
}

export interface FeedResponse {
  posts: PostView[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ExploreMeta {
  popularHashtags: { name: string; count: number }[];
  suggestedAccounts: SocialUserPreview[];
}

export interface ExploreResponse extends FeedResponse {
  meta?: ExploreMeta;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

export interface FollowActionResult {
  status: "ACCEPTED" | "PENDING" | null;
  isFollowing: boolean;
  target: FollowCounts;
  viewer: FollowCounts;
}

export interface FollowStatusView {
  status: FollowStatus | null;
  isFollowing: boolean;
  isFollowedBy: boolean;
  mutualCount: number;
}

export interface FollowUserView extends SocialUserPreview {
  isFollowing: boolean;
}

export interface FollowListResponse {
  users: FollowUserView[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface StoryView {
  id: string;
  mediaUrl: string;
  mediaType: MediaType;
  createdAt: string;
  expiresAt: string;
  author: SocialUserPreview;
  seenByMe: boolean;
  viewCount: number;
  commentCount: number;
}

export interface StoryCommentView {
  id: string;
  text: string;
  createdAt: string;
  author: SocialUserPreview;
}

export interface CommentView {
  id: string;
  text: string;
  createdAt: string;
  author: SocialUserPreview;
  likeCount: number;
  likedByMe: boolean;
  parentId: string | null;
  replies?: CommentView[];
}

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string | null;
  summary: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
  actor: SocialUserPreview | null;
}
