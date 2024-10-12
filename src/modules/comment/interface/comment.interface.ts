export interface CommentResponse {
  id: number;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  likes: number;
  likedByMe: boolean;
  author: {
    id: number;
    username: string;
    profilePicture: string;
  };
}
