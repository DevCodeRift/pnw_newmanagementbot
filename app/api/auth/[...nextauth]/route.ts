import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { neon } from '@neondatabase/serverless'

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'discord') {
        try {
          const sql = neon(process.env.DATABASE_URL!)

          // Check if user exists
          const existingUser = await sql`
            SELECT * FROM users WHERE discord_id = ${user.id}
          `

          if (existingUser.length === 0) {
            // Create new user
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
            // Update existing user
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
          console.error('Database error:', error)
          return false
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
})

export { handler as GET, handler as POST }
