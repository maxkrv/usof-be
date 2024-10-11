export interface PostResponse {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
  };
  categories: { id: number; title: string }[];
  likes: number;
  likedByMe: boolean;
  comments: number;
  createdAt: Date;
}
