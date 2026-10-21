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
  generateSecureRandomHex,
  validateEmail,
  validatePasswordStrength,
} from '../services/authCrypto';
import { 
  getSupabaseClient, 
  dbUpdateProfile 
} from '../services/supabaseClient';
import { useStudyStore } from './useStudyStore';

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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

        const sb = getSupabaseClient();
        if (!sb) {
          return { success: false, error: 'Supabase client is not configured.' };
        }

        try {
          const { data, error } = await sb.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: { name: cleanName },
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Upsert profile in public.profiles table
            try {
              await sb.from('profiles').upsert({
                id: data.user.id,
                name: cleanName,
                email: cleanEmail,
                daily_target_minutes: 360,
                updated_at: new Date().toISOString(),
              });
            } catch (err) {
              console.warn('Profile upsert warning:', err);
            }

            const authUser: AuthUser = {
              id: data.user.id,
              name: cleanName,
              email: cleanEmail,
              createdAt: data.user.created_at,
              updatedAt: data.user.updated_at || data.user.created_at,
              lastLoginAt: new Date().toISOString(),
            };

            if (data.session) {
              set({
                currentUser: authUser,
                session: {
                  token: data.session.access_token,
                  refreshToken: data.session.refresh_token,
                  userId: data.user.id,
                  expiresAt: new Date(Date.now() + (data.session.expires_in || 3600 * 24 * 30) * 1000).toISOString(),
                  rememberMe: true,
                },
                authModalView: 'closed',
              });

              // Load user's data from Supabase into study store
              await useStudyStore.getState().loadUserData(data.user.id);
            } else {
              set({ authModalView: 'closed' });
              get().setFlashMessage(
                'info',
                `Account registered! If confirmation is enabled, please verify your email (${cleanEmail}).`
              );
            }

            return { success: true };
          }

          return { success: false, error: 'Failed to create user account.' };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Registration failed unexpectedly.' };
        }
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

        const sb = getSupabaseClient();
        if (!sb) {
          return { success: false, error: 'Supabase client is not configured.' };
        }

        try {
          const { data, error } = await sb.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (error) {
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
              error: `${error.message} (${remainingAttempts} attempt(s) remaining)`,
            };
          }

          if (data.user && data.session) {
            // Reset failed login attempts
            const nextAttempts = { ...get().loginAttempts };
            delete nextAttempts[cleanEmail];

            // Fetch student profile name
            let studentName = data.user.user_metadata?.name || cleanEmail.split('@')[0];
            try {
              const { data: profile } = await sb
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();

              if (profile?.name) {
                studentName = profile.name;
              }
            } catch (pErr) {
              console.warn('Profile fetch warning:', pErr);
            }

            const authUser: AuthUser = {
              id: data.user.id,
              name: studentName,
              email: cleanEmail,
              createdAt: data.user.created_at,
              updatedAt: data.user.updated_at || data.user.created_at,
              lastLoginAt: new Date().toISOString(),
            };

            set({
              currentUser: authUser,
              session: {
                token: data.session.access_token,
                refreshToken: data.session.refresh_token,
                userId: data.user.id,
                expiresAt: new Date(Date.now() + (data.session.expires_in || 3600 * 24 * 30) * 1000).toISOString(),
                rememberMe,
              },
              loginAttempts: nextAttempts,
              authModalView: 'closed',
            });

            // Load real user data from Supabase
            await useStudyStore.getState().loadUserData(data.user.id);
            return { success: true };
          }

          return { success: false, error: 'Authentication failed.' };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Login failed unexpectedly.' };
        }
      },

      logout: async (options?: { logoutAllDevices?: boolean; customMessage?: string } | string) => {
        const customMessage = typeof options === 'string' ? options : options?.customMessage;
        const sb = getSupabaseClient();
        if (sb) {
          try {
            await sb.auth.signOut();
          } catch (e) {
            console.warn('Supabase signOut warning:', e);
          }
        }

        set({
          currentUser: null,
          session: null,
          authModalView: 'closed',
          redirectAfterLogin: null,
          isLogoutModalOpen: false,
        });

        // Clear study store data
        useStudyStore.getState().clearUserData();

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

        const sb = getSupabaseClient();
        if (!sb) {
          return { success: false, error: 'Supabase client is not configured.' };
        }

        try {
          const { error } = await sb.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: window.location.origin,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          get().setFlashMessage(
            'info',
            `Password reset instructions sent to ${cleanEmail}. Please check your inbox.`
          );

          return { success: true };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Failed to request password reset.' };
        }
      },

      resetPassword: async (_token: string, newPassword: string) => {
        const passwordCheck = validatePasswordStrength(newPassword);
        if (!passwordCheck.isValid) {
          return {
            success: false,
            error: passwordCheck.feedback[0] || 'Password does not meet minimum strength requirements.',
          };
        }

        const sb = getSupabaseClient();
        if (!sb) {
          return { success: false, error: 'Supabase client is not configured.' };
        }

        try {
          const { error } = await sb.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          set({
            authModalView: 'login',
            pendingResetToken: null,
          });

          get().setFlashMessage('success', 'Your password was successfully reset. You can now log in.');
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Password reset failed.' };
        }
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

        const sb = getSupabaseClient();
        if (sb) {
          try {
            await sb.auth.updateUser({
              email: cleanEmail,
              data: { name: cleanName },
            });
            await dbUpdateProfile(currentUser.id, { name: cleanName, email: cleanEmail });
          } catch (err) {
            console.warn('Supabase profile update warning:', err);
          }
        }

        const updatedUser: AuthUser = {
          ...currentUser,
          name: cleanName,
          email: cleanEmail,
          updatedAt: new Date().toISOString(),
        };

        set({ currentUser: updatedUser });
        get().setFlashMessage('success', 'Account profile updated successfully.');
        return { success: true };
      },

      changePassword: async (_currentPassword: string, newPassword: string) => {
        const currentUser = get().currentUser;
        if (!currentUser) {
          return { success: false, error: 'You must be logged in to change your password.' };
        }

        const strength = validatePasswordStrength(newPassword);
        if (!strength.isValid) {
          return { success: false, error: strength.feedback[0] || 'New password does not meet security requirements.' };
        }

        const sb = getSupabaseClient();
        if (!sb) {
          return { success: false, error: 'Supabase client is not configured.' };
        }

        try {
          const { error } = await sb.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          get().setFlashMessage('success', 'Password changed successfully in Supabase.');
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Failed to update password.' };
        }
      },
    }),
    {
      name: 'studyo_auth_state_v1',
      partialize: (state) => ({
        currentUser: state.currentUser,
        session: state.session,
        loginAttempts: state.loginAttempts,
      }),
    }
  )
);

// ==========================================================
// SUPABASE REALTIME AUTH LISTENER & SESSION RESTORATION
// ==========================================================
if (typeof window !== 'undefined') {
  const sb = getSupabaseClient();
  if (sb) {
    // Check initial active session or restore from local store
    sb.auth.getSession().then(async ({ data: { session } }) => {
      let activeSession = session;
      if (!activeSession?.user) {
        // Try restoring session from useAuthStore stored refreshToken
        const storedSession = useAuthStore.getState().session;
        if (storedSession?.token && storedSession?.refreshToken) {
          try {
            const { data: restored, error: restoreErr } = await sb.auth.setSession({
              access_token: storedSession.token,
              refresh_token: storedSession.refreshToken,
            });
            if (restored?.session?.user) {
              activeSession = restored.session;
            }
          } catch {
            // ignore
          }
        }
      }

      if (activeSession?.user) {
        const u = activeSession.user;
        let studentName = u.user_metadata?.name || u.email?.split('@')[0] || 'Student';
        try {
          const { data: profile } = await sb.from('profiles').select('*').eq('id', u.id).maybeSingle();
          if (profile?.name) studentName = profile.name;
        } catch {
          // ignore
        }

        const authUser: AuthUser = {
          id: u.id,
          name: studentName,
          email: u.email || '',
          createdAt: u.created_at,
          updatedAt: u.updated_at || u.created_at,
          lastLoginAt: new Date().toISOString(),
        };

        useAuthStore.setState({
          currentUser: authUser,
          session: {
            token: activeSession.access_token,
            refreshToken: activeSession.refresh_token,
            userId: u.id,
            expiresAt: new Date(Date.now() + (activeSession.expires_in || 3600 * 24 * 30) * 1000).toISOString(),
            rememberMe: true,
          },
        });

        // Trigger two-way merge and sync
        useStudyStore.getState().syncUserData(u.id);
      }
    });

    let lastSyncedUserId: string | null = null;

    // Listen to Auth State Changes (including INITIAL_SESSION on page reload).
    // IMPORTANT: this callback must stay synchronous. Awaiting other Supabase calls
    // inside it deadlocks the auth lock (getSession() then hangs forever), which
    // silently breaks every cloud fetch/save. Heavy work is deferred via setTimeout.
    sb.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') &&
        session?.user
      ) {
        const u = session.user;

        // Synchronous store update (no network)
        const prev = useAuthStore.getState().currentUser;
        const authUser: AuthUser = {
          id: u.id,
          name: prev?.id === u.id && prev.name ? prev.name : (u.user_metadata?.name || u.email?.split('@')[0] || 'Student'),
          email: u.email || '',
          createdAt: u.created_at,
          updatedAt: u.updated_at || u.created_at,
          lastLoginAt: new Date().toISOString(),
        };

        useAuthStore.setState({
          currentUser: authUser,
          session: {
            token: session.access_token,
            refreshToken: session.refresh_token,
            userId: u.id,
            expiresAt: new Date(Date.now() + (session.expires_in || 3600 * 24 * 30) * 1000).toISOString(),
            rememberMe: true,
          },
        });

        // Defer network work until the auth lock is released
        if (event !== 'TOKEN_REFRESHED' && lastSyncedUserId !== u.id) {
          lastSyncedUserId = u.id;
          setTimeout(() => {
            useStudyStore.getState().syncUserData(u.id, true);
          }, 0);
        }
      } else if (event === 'SIGNED_OUT') {
        lastSyncedUserId = null;
        useAuthStore.setState({
          currentUser: null,
          session: null,
        });
        useStudyStore.getState().clearUserData();
      }
    });
  }
}
