import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

import type { DefaultSession, DefaultUser } from "next-auth";

// --- Type extensions ---
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email?: string;
      roles: string[]; // ⬅️ multiple roles
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username: string;
    email?: string;
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    email?: string;
    roles: string[];
  }
}

// --- Auth config ---
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { username: credentials?.username },
          include: {
            roles: true, // ⬅️ get multiple roles
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials!.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id.toString(),
          name: user.fullName,
          username: user.username,
          email: user.email ?? undefined,
          roles: user.roles.map((r) => r.name), // ⬅️ return array of role names
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.roles = user.roles ?? []; // ✅ fallback to empty array
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.email = token.email ?? undefined;
      session.user.roles = token.roles ?? []; // ✅ fallback to empty array
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// --- Route handler ---
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
