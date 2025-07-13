import GoogleProvider from 'next-auth/providers/google'
import { NextAuthOptions } from 'next-auth'
import { getDb } from '@/lib/database'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      id?: number
      username?: string
      credits?: number
      totalPacks?: number
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const db = await getDb()
          
          // Check if user already exists by email (email should be unique)
          const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [user.email]
          )
          
          const existingUser = existingUsers as any[]
          
          if (existingUser.length === 0) {
            // Create new user with default values
            // Add a timestamp or random suffix to make username unique if needed
            const timestamp = Date.now()
            const uniqueUsername = `${user.name}_${timestamp}`
            
            await db.execute(`
              INSERT INTO users (username, email, credits, last_credit_earn, total_packs_opened)
              VALUES (?, ?, 100, NOW(), 0)
            `, [uniqueUsername, user.email])
          }
          
          return true
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const db = await getDb()
          const [users] = await db.execute(
            'SELECT id, username, credits, total_packs_opened FROM users WHERE email = ?',
            [session.user.email]
          )
          
          const user = users as any[]
          if (user.length > 0) {
            session.user.id = user[0].id
            session.user.username = user[0].username
            session.user.credits = user[0].credits
            session.user.totalPacks = user[0].total_packs_opened
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.email = user.email
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}