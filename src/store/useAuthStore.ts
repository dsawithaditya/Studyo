import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AuthUser,
  AuthSession,
  PasswordResetToken,
  LoginAttemptRecord,
  AuthModalView,
  FlashMessage,
  FlashType,
} from '../types/auth';
import {
  hashPassword,
  verifyPassword,
  generateSecureRandomHex,
  validateEmail,
  validatePasswordStrength,
} from '../services/authCrypto';

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_EXPIRY_DAYS = 30; // 30 days if rememberMe, 24 hours otherwise

interface AuthState {
  users: AuthUser[];
  currentUser: AuthUser | null;
  session: AuthSession | null;
  resetTokens: PasswordResetToken[];
  loginAttempts: Record<string, LoginAttemptRecord>;
  authModalView: AuthModalView;
  pendingResetToken: string | null;
  redirectAfterLogin: string | null;
  flashMessage: FlashMessage | null;
  isLogoutModalOpen: boolean;

  // Actions
  setAuthModalView: (view: AuthModalView) => void;
  setPendingResetToken: (token: string | null) => void;
  setRedirectAfterLogin: (path: string | null) => void;
  setFlashMessage: (type: FlashType, message: string, duration?: number) => void;
  clearFlashMessage: () => void;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;

  // Auth Operations
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: (options?: { logoutAllDevices?: boolean; customMessage?: string } | string) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; token?: string; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getLockoutStatus: (email: string) => { isLocked: boolean; remainingMinutes: number };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      session: null,
      resetTokens: [],
      loginAttempts: {},
      authModalView: 'closed',
      pendingResetToken: null,
      redirectAfterLogin: null,
      flashMessage: null,
      isLogoutModalOpen: false,

      setAuthModalView: (view) => set({ authModalView: view }),
      setPendingResetToken: (token) => set({ pendingResetToken: token }),
      setRedirectAfterLogin: (path) => set({ redirectAfterLogin: path }),
      openLogoutModal: () => set({ isLogoutModalOpen: true }),
      closeLogoutModal: () => set({ isLogoutModalOpen: false }),

      setFlashMessage: (type, message, duration = 4000) => {
        const id = generateSecureRandomHex(8);
        set({ flashMessage: { id, type, message, duration } });
        if (duration > 0) {
          setTimeout(() => {
            const current = get().flashMessage;
            if (current && current.id === id) {
              set({ flashMessage: null });
            }
          }, duration);
        }
      },

      clearFlashMessage: () => set({ flashMessage: null }),

      getLockoutStatus: (email: string) => {
        const key = email.trim().toLowerCase();
        const record = get().loginAttempts[key];
        if (!record || !record.lockedUntil) {
          return { isLocked: false, remainingMinutes: 0 };
        }
        const lockedUntil = new Date(record.lockedUntil).getTime();
        const now = Date.now();
        if (now < lockedUntil) {
          const remainingMinutes = Math.ceil((lockedUntil - now) / (60 * 1000));
          return { isLocked: true, remainingMinutes };
        }
        return { isLocked: false, remainingMinutes: 0 };
      },

      register: async (name: string, email: string, password: string) => {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName) {
          return { success: false, error: 'Please enter your full name.' };
        }
        if (!validateEmail(cleanEmail)) {
          return { success: false, error: 'Please provide a valid email address.' };
        }

        const passwordCheck = validatePasswordStrength(password);
        if (!passwordCheck.isValid) {
          return {
            success: false,
            error: passwordCheck.feedback[0] || 'Password must be at least 8 characters with numbers and mixed casing.',
          };
        }

        const existing = get().users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (existing) {
          // Generic secure message to prevent user enumeration
          return { success: false, error: 'An account with this email already exists or is unavailable.' };
        }

        const { hash, salt } = await hashPassword(password);
        const newUser: AuthUser = {
          id: `usr_${generateSecureRandomHex(10)}`,
          name: cleanName,
          email: cleanEmail,
          passwordHash: hash,
          salt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        const sessionToken = generateSecureRandomHex(24);
        const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
        const newSession: AuthSession = {
          token: sessionToken,
          userId: newUser.id,
          expiresAt,
          rememberMe: true,
        };

        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
          session: newSession,
          authModalView: 'closed',
        }));

        get().setFlashMessage('success', `Welcome to Studyo, ${cleanName}! Your account was created successfully.`);
        return { success: true };
      },

      login: async (email: string, password: string, rememberMe = true) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !password) {
          return { success: false, error: 'Please enter both email and password.' };
        }

        // Check rate limiting / lockout
        const lockout = get().getLockoutStatus(cleanEmail);
        if (lockout.isLocked) {
          return {
            success: false,
            error: `Too many failed login attempts. Account temporarily locked. Please try again in ${lockout.remainingMinutes} minute(s).`,
          };
        }

        const user = get().users.find((u) => u.email.toLowerCase() === cleanEmail);
        let isValid = false;

        if (user) {
          isValid = await verifyPassword(password, user.passwordHash, user.salt);
        }

        if (!isValid) {
          // Record failed attempt
          const currentAttempts = (get().loginAttempts[cleanEmail]?.attempts || 0) + 1;
          const isNowLocked = currentAttempts >= MAX_LOGIN_ATTEMPTS;
          const lockedUntil = isNowLocked ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : undefined;

          set((state) => ({
            loginAttempts: {
              ...state.loginAttempts,
              [cleanEmail]: {
                email: cleanEmail,
                attempts: currentAttempts,
                lockedUntil,
              },
            },
          }));

          if (isNowLocked) {
            return {
              success: false,
              error: `Maximum login attempts exceeded. Account is locked for 15 minutes for your security.`,
            };
          }

          const remainingAttempts = MAX_LOGIN_ATTEMPTS - currentAttempts;
          return {
            success: false,
            error: `Invalid credentials. Please verify your email and password. (${remainingAttempts} attempt(s) remaining)`,
          };
        }

        // Successful authentication: Reset failed attempts for this email
        const token = generateSecureRandomHex(24);
        const days = rememberMe ? SESSION_EXPIRY_DAYS : 1;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        const updatedUser: AuthUser = {
          ...user!,
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => {
          const nextAttempts = { ...state.loginAttempts };
          delete nextAttempts[cleanEmail];
          return {
            currentUser: updatedUser,
            session: {
              token,
              userId: updatedUser.id,
              expiresAt,
              rememberMe,
            },
            users: state.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
            loginAttempts: nextAttempts,
            authModalView: 'closed',
          };
        });

        get().setFlashMessage('success', `Welcome back, ${updatedUser.name}!`);
        return { success: true };
      },

      logout: (options?: { logoutAllDevices?: boolean; customMessage?: string } | string) => {
        const customMessage = typeof options === 'string' ? options : options?.customMessage;
        set({
          currentUser: null,
          session: null,
          authModalView: 'closed',
          redirectAfterLogin: null,
          isLogoutModalOpen: false,
        });

        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.clear();
          }
        } catch {
          // ignore
        }

        const msg = customMessage || 'You have been logged out successfully.';
        get().setFlashMessage('success', msg);
      },

      requestPasswordReset: async (email: string) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!validateEmail(cleanEmail)) {
          return { success: false, error: 'Please enter a valid email address.' };
        }

        // Create secure single-use token
        const token = `rst_${generateSecureRandomHex(16)}`;
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS).toISOString();

        set((state) => ({
          resetTokens: [
            ...state.resetTokens.filter((t) => t.email !== cleanEmail), // Remove old tokens
            { token, email: cleanEmail, expiresAt, used: false },
          ],
        }));

        // Generic response to prevent email discovery, while returning token for simulation UI
        get().setFlashMessage(
          'info',
          `Password reset instructions generated. Please check your inbox or use the token code.`
        );

        return { success: true, token };
      },

      resetPassword: async (token: string, newPassword: string) => {
        const cleanToken = token.trim();
        const record = get().resetTokens.find((t) => t.token === cleanToken && !t.used);

        if (!record) {
          return { success: false, error: 'Invalid or expired password reset link. Please request a new one.' };
        }

        if (new Date(record.expiresAt).getTime() < Date.now()) {
          return { success: false, error: 'This password reset link has expired. Please request a new one.' };
        }

        const passwordCheck = validatePasswordStrength(newPassword);
        if (!passwordCheck.isValid) {
          return {
            success: false,
            error: passwordCheck.feedback[0] || 'Password does not meet minimum strength requirements.',
          };
        }

        const user = get().users.find((u) => u.email.toLowerCase() === record.email.toLowerCase());
        if (!user) {
          return { success: false, error: 'Account associated with reset token was not found.' };
        }

        const { hash, salt } = await hashPassword(newPassword);
        const updatedUser: AuthUser = {
          ...user,
          passwordHash: hash,
          salt,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          users: state.users.map((u) => (u.id === user.id ? updatedUser : u)),
          resetTokens: state.resetTokens.map((t) => (t.token === cleanToken ? { ...t, used: true } : t)),
          authModalView: 'login',
          pendingResetToken: null,
        }));

        get().setFlashMessage('success', 'Your password was successfully reset. You can now log in.');
        return { success: true };
      },

      updateProfile: async (name: string, email: string) => {
        const currentUser = get().currentUser;
        if (!currentUser) {
          return { success: false, error: 'You must be logged in to update your profile.' };
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName) {
          return { success: false, error: 'Name cannot be empty.' };
        }
        if (!validateEmail(cleanEmail)) {
          return { success: false, error: 'Please enter a valid email address.' };
        }

        // If email changed, check if taken
        if (cleanEmail !== currentUser.email.toLowerCase()) {
          const taken = get().users.some((u) => u.id !== currentUser.id && u.email.toLowerCase() === cleanEmail);
          if (taken) {
            return { success: false, error: 'This email is already in use by another account.' };
          }
        }

        const updatedUser: AuthUser = {
          ...currentUser,
          name: cleanName,
          email: cleanEmail,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          currentUser: updatedUser,
          users: state.users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        }));

        get().setFlashMessage('success', 'Account profile updated successfully.');
        return { success: true };
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const currentUser = get().currentUser;
        if (!currentUser) {
          return { success: false, error: 'You must be logged in to change your password.' };
        }

        const validCurrent = await verifyPassword(currentPassword, currentUser.passwordHash, currentUser.salt);
        if (!validCurrent) {
          return { success: false, error: 'Incorrect current password.' };
        }

        const strength = validatePasswordStrength(newPassword);
        if (!strength.isValid) {
          return { success: false, error: strength.feedback[0] || 'New password does not meet security requirements.' };
        }

        const { hash, salt } = await hashPassword(newPassword);
        const updatedUser: AuthUser = {
          ...currentUser,
          passwordHash: hash,
          salt,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          currentUser: updatedUser,
          users: state.users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        }));

        get().setFlashMessage('success', 'Password changed successfully.');
        return { success: true };
      },
    }),
    {
      name: 'studyo_auth_state_v1',
      partialize: (state) => ({
        users: state.users,
        currentUser: state.currentUser,
        session: state.session,
        resetTokens: state.resetTokens,
        loginAttempts: state.loginAttempts,
      }),
    }
  )
);
