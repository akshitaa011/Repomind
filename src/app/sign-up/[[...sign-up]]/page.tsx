"use client"

import React, { useState } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { ArrowRight, Sparkles, Lock, Mail, User } from 'lucide-react'

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const hasValidClerkKey = clerkKey && clerkKey.startsWith('pk_') && !clerkKey.includes('...')

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('Demo User')
  const [email, setEmail] = useState('demo@repomind.ai')
  const [password, setPassword] = useState('password123')

  // When live Clerk keys are provided, render Clerk's native SignUp widget
  if (hasValidClerkKey) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-muted/20">
        <SignUp />
      </div>
    )
  }

  // Graceful standalone frontend sign-up when Clerk keys are not configured
  const handleDemoSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <img src="/favicon.ico" alt="RepoMind" className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create your RepoMind account</CardTitle>
          <CardDescription>
            Join and start collaborating on your repositories with AI
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleDemoSignUp}>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-primary flex items-start gap-2">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>
                <strong>Frontend Demo Mode:</strong> Live Clerk authentication is not configured yet. You can sign up immediately below!
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="name">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full gap-2 font-semibold">
              Create Account & Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}