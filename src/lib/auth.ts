import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { storeTokens } from "./google-calendar";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Check if user email is in allowed list
      const allowedEmailsRaw = process.env.ALLOWED_EMAILS?.trim();

      // Only check if ALLOWED_EMAILS is actually set with values
      if (allowedEmailsRaw && allowedEmailsRaw.length > 0) {
        const allowedEmails = allowedEmailsRaw.split(",").map((e) => e.trim().toLowerCase());
        if (user.email && !allowedEmails.includes(user.email.toLowerCase())) {
          return false; // Reject sign-in
        }
      }
      // If ALLOWED_EMAILS is empty, allow all emails

      // Store Google tokens for calendar access
      if (account?.provider === "google" && account.access_token) {
        try {
          await storeTokens({
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expiry_date: account.expires_at
              ? account.expires_at * 1000
              : Date.now() + 3600 * 1000,
          });
        } catch (error) {
          console.error("Error storing tokens:", error);
        }
      }

      return true;
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      return {
        ...session,
        accessToken: token.accessToken,
      };
    },
  },
  pages: {
    signIn: "/setup",
  },
  trustHost: true,
});
