import { apiClient } from '@/lib/api/client';
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
  interface JWT {
    accessToken?: string;
  }
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (
  !googleClientId ||
  !googleClientSecret ||
  !githubClientId ||
  !githubClientSecret
) {
  throw new Error(
    'Missing required environment variables for authentication providers'
  );
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    GithubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account && user) {
        try {
          // Send the OAuth token to our backend
          const response = await apiClient.post('/auth/oauth', {
            provider: account.provider,
            accessToken: account.access_token,
            email: user.email,
            name: user.name,
          });

          // Get the token from our backend
          const { token } = response.data;

          // Store the token in the session
          account.access_token = token;

          return true;
        } catch (error) {
          console.error('OAuth error:', error);
          return false;
        }
      }
      return false;
    },
    async session({ session, token }) {
      // Add the access token to the session
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth',
    // TODO: Add a custom error page
    error: '/auth/error',
  },
});

export { handler as GET, handler as POST };
