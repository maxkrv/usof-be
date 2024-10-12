export interface UserResponse {
  id: number;
  username: string;
  profilePicture: string | null;
  createdAt: Date;
  rating: number;
}

export interface MeUserResponse extends UserResponse {
  email: string;
  fullName: string;
  isActive: boolean;
}
