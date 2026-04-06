import { Role } from '../constants';

export interface UserPublic {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
  profile: UserProfilePublic | null;
}

export interface UserProfilePublic {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  currentRating: number;
  maxRating: number;
  solvedCount: number;
  contestCount: number;
}

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
}
