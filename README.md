# Discord OAuth2 Login Site

A simple, modern authentication site built with Next.js 14, Discord OAuth2, and Neon PostgreSQL database. Deployed on Vercel with the custom domain **www.orbistech.dev**.

## Features

- Discord OAuth2 authentication
- User session management with NextAuth.js
- PostgreSQL database hosted on Neon
- Responsive design with modern UI
- Automatic user creation and login tracking
- Protected dashboard route
- TypeScript for type safety

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js with Discord Provider
- **Database**: Neon (Serverless PostgreSQL)
- **Deployment**: Vercel
- **Language**: TypeScript
- **Styling**: CSS

## Prerequisites

Before you begin, make sure you have:

1. [Node.js](https://nodejs.org/) (v18 or higher)
2. A [Discord Application](https://discord.com/developers/applications) for OAuth2
3. A [Neon](https://neon.tech) database account
4. A [Vercel](https://vercel.com) account for deployment
5. A [GitHub](https://github.com) account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd pnw_newmanagementbot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to "OAuth2" in the sidebar
4. Add redirect URLs:
   - For local development: `http://localhost:3000/api/auth/callback/discord`
   - For production: `https://www.orbistech.dev/api/auth/callback/discord`
5. Copy your **Client ID** and **Client Secret**

### 4. Set Up Neon Database

1. Go to [Neon](https://neon.tech) and create a new project
2. Copy your connection string (it looks like: `postgresql://user:password@host/database?sslmode=require`)
3. Keep this handy for the next step

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Discord OAuth2 Credentials
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000    # Use https://www.orbistech.dev in production

# Neon Database Connection
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

To generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 6. Initialize Database

Run the database initialization script to create the users table:

```bash
npm run db:init
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses a single `users` table:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  discord_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar TEXT,
  discriminator VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure environment variables in Vercel:
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to `https://www.orbistech.dev`)
   - `DATABASE_URL`
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Configure Custom Domain

1. In Vercel Dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add `www.orbistech.dev`
4. Follow Vercel's instructions to update your DNS records

## Project Structure

```
.
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts        # NextAuth API routes
│   ├── dashboard/
│   │   └── page.tsx                # Protected dashboard page
│   ├── login/
│   │   └── page.tsx                # Login page
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page (redirects)
│   └── providers.tsx               # Session provider wrapper
├── components/
│   └── SignOutButton.tsx           # Sign out button component
├── lib/
│   ├── auth.ts                     # Auth configuration
│   └── db.ts                       # Database utilities
├── scripts/
│   └── init-db.ts                  # Database initialization script
├── types/
│   └── next-auth.d.ts              # NextAuth type extensions
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore file
├── next.config.js                  # Next.js configuration
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── vercel.json                     # Vercel configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:init` - Initialize database schema

## How It Works

1. **User visits the site**: Redirects to `/login` if not authenticated
2. **User clicks "Sign in with Discord"**: Redirects to Discord OAuth
3. **Discord authenticates**: User approves the application
4. **Callback**: Discord redirects back with authorization code
5. **NextAuth processes**: Exchanges code for user information
6. **Database operation**: Creates or updates user record in Neon
7. **Session created**: User is redirected to `/dashboard`
8. **Protected routes**: Dashboard is only accessible when authenticated

## Security Notes

- Never commit `.env` file to version control
- Use strong, randomly generated secrets
- Enable SSL/TLS for production database connections
- Keep dependencies updated
- Review Discord OAuth scopes (currently using default scopes)

## Troubleshooting

### Database Connection Issues

- Ensure your Neon database is active (not paused)
- Check that `DATABASE_URL` includes `?sslmode=require`
- Verify your IP is allowed in Neon's network settings

### Discord OAuth Errors

- Verify redirect URLs match exactly in Discord Developer Portal
- Check that `NEXTAUTH_URL` matches your deployment URL
- Ensure Client ID and Secret are correct

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check that all environment variables are set
- Try deleting `.next` folder and rebuilding

## Contributing

This is a simple authentication template. Feel free to fork and customize for your needs.

## License

MIT

## Support

For issues or questions:
- Check [NextAuth.js Documentation](https://next-auth.js.org)
- Check [Neon Documentation](https://neon.tech/docs)
- Check [Discord Developer Documentation](https://discord.com/developers/docs)

---

Built with Next.js, Discord OAuth2, and Neon PostgreSQL.
Deployed on Vercel at **www.orbistech.dev**
