import { ReactionType } from '@prisma/client';

export interface CommentResponse {
  id: number;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  rating: number;
  myReaction: ReactionType | null;
  author: {
    id: number;
    username: string;
    profilePicture: string;
  };
}
