export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  username: string;
  role: 'admin';
}

export interface TokenPayload {
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}