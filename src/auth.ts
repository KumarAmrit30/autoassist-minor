import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { ObjectId } from "mongodb";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    "Google OAuth environment variables are missing. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google sign-in."
  );
}

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) {
        return false;
      }

      const db = await getDatabase();
      const users = db.collection(COLLECTIONS.USERS);

      const existingUser = await users.findOne({ email: user.email });

      if (existingUser) {
        user.id = existingUser._id.toString();

        await users.updateOne(
          { _id: existingUser._id },
          {
            $set: {
              name: user.name ?? profile?.name ?? existingUser.name,
              image: user.image ?? profile?.picture ?? existingUser.image,
              provider: "google",
              updatedAt: new Date(),
              lastLoginAt: new Date(),
            },
          }
        );
      } else {
        const now = new Date();
        const result = await users.insertOne({
          name: user.name ?? profile?.name ?? "",
          email: user.email,
          image: user.image ?? profile?.picture ?? null,
          provider: "google",
          favorites: [],
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
        });

        user.id = result.insertedId.toString();
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user && "id" in user && user.id) {
        token.userId = user.id;
      } else if (!token.userId && token.email) {
        const db = await getDatabase();
        const existingUser = await db
          .collection(COLLECTIONS.USERS)
          .findOne({ email: token.email });

        if (existingUser) {
          token.userId = existingUser._id.toString();
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        const db = await getDatabase();
        const userDoc = await db.collection(COLLECTIONS.USERS).findOne(
          { _id: new ObjectId(token.userId as string) },
          { projection: { favorites: 1, name: 1, email: 1, image: 1 } }
        );

        session.user.id = token.userId as string;
        session.user.name = userDoc?.name ?? session.user.name;
        session.user.email = userDoc?.email ?? session.user.email;
        session.user.image = userDoc?.image ?? session.user.image;
        session.user.favorites = userDoc?.favorites ?? [];
      }

      return session;
    },
  },
});

