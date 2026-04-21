import { type DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'student' | 'college' | 'admin'
    } & DefaultSession['user']
  }

  interface User {
    role: 'student' | 'college' | 'admin'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'student' | 'college' | 'admin'
  }
}
