"use client"

import { useUser as useClerkUser } from '@clerk/nextjs'

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const hasValidClerkKey = clerkKey && clerkKey.startsWith('pk_') && !clerkKey.includes('...')

export function useCurrentUser() {
  if (!hasValidClerkKey) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: 'user_demo_repomind',
        firstName: 'Demo',
        lastName: 'User',
        fullName: 'Demo User',
        imageUrl: '/favicon.ico',
        emailAddresses: [{ emailAddress: 'demo@repomind.ai' }],
      },
    }
  }

  // When valid Clerk key is configured, use Clerk's real hook
  return useClerkUser()
}

export default useCurrentUser
