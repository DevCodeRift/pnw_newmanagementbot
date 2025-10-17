import { redirect } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import { sql } from '@/lib/db'

export default async function Home() {
  const session = await getAuth()

  if (!session) {
    redirect('/login')
  }

  // Check if user has linked their P&W API key
  if (process.env.DATABASE_URL) {
    try {
      const users = await sql`
        SELECT api_key_verified, alliance_name
        FROM users
        WHERE discord_id = ${session.user.id}
      `

      if (users.length > 0) {
        const user = users[0]

        // If not verified, send to setup
        if (!user.api_key_verified) {
          redirect('/setup')
        }

        // If verified and has alliance, send to alliance page
        if (user.alliance_name) {
          const slug = user.alliance_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          redirect(`/${slug}`)
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error)
    }
  }

  // Default: redirect to dashboard
  redirect('/dashboard')
}
