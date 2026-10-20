"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Lock, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Verify the reset token upon page load
  useEffect(() => {
    if (!token) {
      setVerifying(false)
      setTokenValid(false)
      setErrorMessage("No reset token found. You can only access this page by clicking the link sent to your email.")
      return
    }

    const verifyToken = async () => {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify-token",
            token,
          }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          setTokenValid(false)
          setErrorMessage(data.error || "This password reset link is invalid or has expired. Please request a new one.")
        } else {
          setTokenValid(true)
          setUserEmail(data.email || '')
        }
      } catch (err) {
        console.error("Token verification error:", err)
        setTokenValid(false)
        setErrorMessage("Unable to verify reset link. Please check your network connection.")
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please verify your confirmation password.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          token,
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update password. Link may have expired.")
        return
      }

      setResetSuccess(true)
      toast.success("Password reset successfully! Redirecting to Sign In...")
      setTimeout(() => {
        router.push('/sign-in')
      }, 2000)
    } catch (err: any) {
      console.error("Reset password error:", err)
      toast.error("Unable to reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // 1. Loading State while verifying token
  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-md shadow-xl border-border p-8 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your secure reset link...</p>
        </Card>
      </div>
    )
  }

  // 2. Token is Missing or Invalid (Direct access without email link)
  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-md shadow-xl border-border">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Invalid Reset Link</CardTitle>
            <CardDescription className="text-destructive font-medium">
              {errorMessage}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              For your account&apos;s security, password reset is only permitted through the unique verification link sent directly to your registered email address.
            </p>

            <Link href="/forgot-password" className="block w-full">
              <Button className="w-full font-semibold">
                Request a New Reset Link
              </Button>
            </Link>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0">
            <Link
              href="/sign-in"
              className="text-xs text-center text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // 3. Password Successfully Reset
  if (resetSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-md shadow-xl border-border">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Password Reset Complete!</CardTitle>
            <CardDescription>
              Your password has been successfully updated in the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-xs text-muted-foreground">
              You will be automatically redirected to the Sign In page in a moment.
            </p>
            <Link href="/sign-in" className="block w-full">
              <Button className="w-full font-semibold">
                Sign In Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 4. Valid Token: Show Form with New Password & Confirm Password
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Set New Password</CardTitle>
          <CardDescription>
            {userEmail ? (
              <span>Resetting password for <strong className="text-foreground">{userEmail}</strong></span>
            ) : (
              <span>Choose a strong password with at least 8 characters.</span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="new-password">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="Enter new password (min. 8 characters)"
                  minLength={8}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="confirm-password">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="Confirm new password"
                  minLength={8}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 font-semibold mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password in Database...</span>
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          <Link
            href="/sign-in"
            className="text-xs text-center text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel and return to Sign In</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
          <Card className="w-full max-w-md shadow-xl border-border p-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Loading password reset form...</p>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
