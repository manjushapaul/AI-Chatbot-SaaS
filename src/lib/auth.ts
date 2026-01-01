import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

// Define types based on Prisma schema
type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR';
type Status = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  plan: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  email: string;
  name?: string;
  password?: string;
  role: UserRole;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  tenant: Tenant;
}

// Rate limiting for failed login attempts
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function isAccountLocked(email: string): boolean {
  const attempts = failedLoginAttempts.get(email);
  if (!attempts) return false;
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_DURATION) {
      return true;
    } else {
      // Reset after lockout duration
      failedLoginAttempts.delete(email);
      return false;
    }
  }
  
  return false;
}

function recordFailedLoginAttempt(email: string): void {
  const attempts = failedLoginAttempts.get(email) || { count: 0, lastAttempt: 0 };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  failedLoginAttempts.set(email, attempts);
}

function recordSuccessfulLogin(email: string): void {
  failedLoginAttempts.delete(email);
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider (only if credentials are provided)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
    // Credentials Provider (Email/Password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenant: { label: 'Tenant', type: 'text' }
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password || !credentials?.tenant) {
          return null;
        }

        const { email, password, tenant } = credentials;

        try {
          // Check if account is locked
          if (isAccountLocked(email)) {
            throw new Error('Account temporarily locked due to too many failed attempts');
          }

          // Validate input
          if (password.length < 6) {
            throw new Error('Invalid password format');
          }

          if (!email.includes('@')) {
            throw new Error('Invalid email format');
          }

          if (tenant.length < 2) {
            throw new Error('Invalid tenant subdomain');
          }

          // Get tenant by subdomain
          const tenantRecord = await prisma.tenants.findUnique({
            where: { subdomain: tenant },
            include: { users: true }
          });
          
          if (!tenantRecord) {
            recordFailedLoginAttempt(email);
            throw new Error('Tenant not found');
          }

          if (tenantRecord.status !== 'ACTIVE') {
            recordFailedLoginAttempt(email);
            throw new Error('Tenant is not active');
          }

          // Find user in the specific tenant
          const user = await prisma.users.findFirst({
            where: {
              email: email.toLowerCase(),
              tenantId: tenantRecord.id,
              status: 'ACTIVE'
            },
            include: {
              tenants: true
            }
          });

          if (!user) {
            recordFailedLoginAttempt(email);
            return null;
          }

          // Verify password
          if (!user.password) {
            recordFailedLoginAttempt(email);
            throw new Error('User account not properly configured');
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            recordFailedLoginAttempt(email);
            return null;
          }

          // Record successful login
          recordSuccessfulLogin(email);

          // Update last login (optional - you can add this field to your schema)
          try {
            await prisma.users.update({
              where: { id: user.id },
              data: { updatedAt: new Date() }
            });
          } catch (error) {
            // Log but don't fail authentication
            console.warn('Failed to update user last login:', error);
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            tenant: {
              ...user.tenants,
              customDomain: user.tenants.customDomain ?? undefined
            }
          };
        } catch (error) {
          console.error('Auth error:', error);
          // Don't expose internal errors to the client
          if (error instanceof Error && error.message.includes('locked')) {
            throw error; // Allow lockout messages to pass through
          }
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          const email = user.email?.toLowerCase();
          if (!email) return false;

          // Try to find existing user by email
          const existingUser = await prisma.users.findFirst({
            where: { email },
            include: { tenants: true },
          });

          if (existingUser && existingUser.status === 'ACTIVE') {
            // Update user info from Google
            await prisma.users.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                updatedAt: new Date(),
              },
            });
            return true;
          }

          // For new Google users, you might want to create them or redirect to signup
          // For now, we'll allow sign-in if user exists
          return !!existingUser;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }

      // Allow credentials provider
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign-in
      if (user) {
        // For Google OAuth, fetch user from database
        if (account?.provider === 'google' && user.email) {
          try {
            const dbUser = await prisma.users.findFirst({
              where: { email: user.email.toLowerCase() },
              include: { tenants: true },
            });

            if (dbUser) {
              token.role = dbUser.role;
              token.tenantId = dbUser.tenantId;
              token.tenant = {
                ...dbUser.tenants,
                customDomain: dbUser.tenants.customDomain ?? undefined
              };
              token.email = dbUser.email;
              token.name = dbUser.name;
            }
          } catch (error) {
            console.error('Error fetching user for JWT:', error);
          }
        } else {
          // Credentials provider
          token.role = user.role;
          token.tenantId = user.tenantId;
          token.tenant = user.tenant;
          token.email = user.email ?? null;
          token.name = user.name ?? null;
        }
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        if (session.user) {
          token.role = session.user.role;
          token.tenantId = session.user.tenantId;
          token.tenant = session.user.tenant;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.tenantId = token.tenantId as string;
        session.user.tenant = token.tenant as Tenant;
        session.user.email = token.email ?? '';
        session.user.name = token.name ?? null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after login
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Additional security options
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Session security
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  tenantId: string;
  tenant: Tenant;
};

declare module 'next-auth' {
  interface Session {
    user: AuthUser;
  }
  
  interface User {
    role: UserRole;
    tenantId: string;
    tenant: Tenant;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    tenantId: string;
    tenant: Tenant;
    email: string | null;
    name?: string | null;
  }
} 