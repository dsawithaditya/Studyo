export type AuthModalView = 'login' | 'signup' | 'forgot_password' | 'reset_password' | 'profile' | 'closed';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  userId: string;
  expiresAt: string;
  rememberMe: boolean;
}

export interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: string;
  used: boolean;
}

export interface LoginAttemptRecord {
  email: string;
  attempts: number;
  lockedUntil?: string;
}

export type FlashType = 'success' | 'error' | 'info';

export interface FlashMessage {
  id: string;
  type: FlashType;
  message: string;
  duration?: number;
}
