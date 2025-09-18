export class UserResponseDto {
  id: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class RefreshResponseDto {
  accessToken: string;
}