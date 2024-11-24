import { ContentStatus, ReactionType } from '@prisma/client';

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
    profilePicture: string | null;
  };
  categories: { id: number; title: string }[];
  rating: number;
  myAction: ReactionType | null;
  favorite: boolean;
  status?: ContentStatus;
  comments: number;
  createdAt: Date;
}
