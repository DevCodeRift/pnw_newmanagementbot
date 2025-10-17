import { getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { neon } from '@neondatabase/serverless'

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'discord') {
        // If DATABASE_URL is not set, still allow sign in (but without persistence)
        if (!process.env.DATABASE_URL) {
          console.warn('DATABASE_URL not set. User data will not be persisted.')
          return true
        }

        try {
          const sql = neon(process.env.DATABASE_URL)

          // Try to create table if it doesn't exist
          await sql`
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              discord_id VARCHAR(255) UNIQUE NOT NULL,
              username VARCHAR(255) NOT NULL,
              email VARCHAR(255),
              avatar TEXT,
              discriminator VARCHAR(10),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `

          const existingUser = await sql`
            SELECT * FROM users WHERE discord_id = ${user.id}
          `

          if (existingUser.length === 0) {
            await sql`
              INSERT INTO users (discord_id, username, email, avatar, discriminator)
              VALUES (
                ${user.id},
                ${(profile as any)?.username || user.name},
                ${user.email},
                ${user.image},
                ${(profile as any)?.discriminator || '0'}
              )
            `
          } else {
            await sql`
              UPDATE users
              SET
                username = ${(profile as any)?.username || user.name},
                email = ${user.email},
                avatar = ${user.image},
                discriminator = ${(profile as any)?.discriminator || '0'},
                last_login = NOW()
              WHERE discord_id = ${user.id}
            `
          }

          return true
        } catch (error) {
          console.error('Database error during sign in:', error)
          // Still allow sign in even if database operations fail
          // This prevents the "Access Denied" error
          return true
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const getAuth = () => getServerSession(authOptions)
