"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { ArrowLeft, Mail, Loader2, KeyRound, AlertCircle, MailCheck, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [devResetUrl, setDevResetUrl] = useState('')

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setDevResetUrl('')

    if (!email.trim()) {
      toast.error("Please enter your registered email address")
      return
    }

    setLoading(true)
    try {
      // Send request to verify email in DB & dispatch reset email
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-reset-link",
          email: email.trim().toLowerCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        const error = data.error || "No account found with this email address. Please check for typos or sign up."
        setErrorMessage(error)
        toast.error(error)
        return
      }

      if (data.resetUrl) {
        setDevResetUrl(data.resetUrl)
      }

      // Link sent successfully to user's email
      setSubmitted(true)
      toast.success("Password reset email sent! Please check your inbox.")
    } catch (err: any) {
      console.error("Verification error:", err)
      const errText = "Unable to process request. Please check your connection and try again."
      setErrorMessage(errText)
      toast.error(errText)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-xl border-border">
        {!submitted ? (
          <>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
              <CardDescription>
                Enter your registered email address. We&apos;ll verify your account and email you a secure link to reset your password.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="reset-email">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errorMessage) setErrorMessage('')
                      }}
                      className="pl-9"
                      placeholder="name@example.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2.5 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                <Button type="submit" className="w-full font-medium" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying account & sending link...</span>
                    </>
                  ) : (
                    "Send Reset Link"
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
                <span>Back to Sign In</span>
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Check Your Email</CardTitle>
              <CardDescription>
                We have sent a password reset link to <strong className="text-foreground">{email}</strong>.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-center">
              <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground leading-relaxed text-left space-y-2">
                <p>
                  Please open your email inbox, find the message from RepoMind, and click the secure reset link.
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Didn&apos;t receive it? Please check your spam folder. The link will expire in 1 hour.
                </p>
              </div>

              {devResetUrl && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3.5 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <KeyRound className="size-3.5" />
                    <span>Direct Password Reset Link:</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground break-all font-mono select-all bg-background/60 p-2 rounded border border-border/50">
                    {devResetUrl}
                  </p>
                  <Link href={devResetUrl} className="inline-block pt-1">
                    <Button size="sm" className="h-8 text-xs font-medium gap-1.5">
                      <span>Open Reset Password Page</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  </Link>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full text-xs font-medium"
                onClick={() => setSubmitted(false)}
              >
                Send to a different email address
              </Button>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-0">
              <Link
                href="/sign-in"
                className="text-xs text-center text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
