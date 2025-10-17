import { redirect } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import Image from 'next/image'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage() {
  const session = await getAuth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container">
      <div className="card">
        <div className="user-info">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt="Avatar"
              width={64}
              height={64}
              className="avatar"
            />
          )}
          <div className="user-details">
            <h2>{session.user?.name || 'Unknown User'}</h2>
            <p>{session.user?.email || 'No email'}</p>
          </div>
        </div>

        <div className="stats">
          <p><strong>User ID:</strong> {session.user?.id}</p>
          <p><strong>Status:</strong> Authenticated</p>
        </div>

        <SignOutButton />
      </div>
    </div>
  )
}
