import { ReactionType } from '@prisma/client';

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
  };
  categories: { id: number; title: string }[];
  rating: number;
  myAction: ReactionType | null;
  comments: number;
  createdAt: Date;
}
