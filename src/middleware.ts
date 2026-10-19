import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/api/webhook/stripe(.*)',
])

const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidClerkKey = key && key.startsWith("pk_") && !key.includes("...");

export default function middleware(request: any, event: any) {
  if (!hasValidClerkKey) {
    return;
  }
  return clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect()
    }
  })(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}