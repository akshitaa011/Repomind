"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { ArrowLeft, Mail, Loader2, KeyRound, AlertCircle, MailCheck, ExternalLink, Copy, Check, Info } from 'lucide-react'
import { toast } from 'sonner'
import { BrainLogo } from '~/components/brain-logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [devResetUrl, setDevResetUrl] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'smtp' | 'resend' | 'console' | ''>('')
  const [copiedLink, setCopiedLink] = useState(false)

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

      if (data.method) {
        setDeliveryMethod(data.method)
      }

      setSubmitted(true)
      if (data.method === "smtp" || data.method === "resend") {
        toast.success("Password reset email sent to your inbox!")
      } else {
        toast.success("Password reset link generated!")
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      const errText = "Unable to process request. Please check your connection and try again."
      setErrorMessage(errText)
      toast.error(errText)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (devResetUrl) {
      navigator.clipboard.writeText(devResetUrl)
      setCopiedLink(true)
      toast.success("Reset link copied to clipboard!")
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const isLiveDelivery = deliveryMethod === "smtp" || deliveryMethod === "resend"

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-xl border-border">
        {!submitted ? (
          <>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                <BrainLogo size={36} glow={true} />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
              <CardDescription>
                Enter your registered email address. We&apos;ll verify your account and provide a secure link to reset your password.
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
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Verifying account...</span>
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
              <CardTitle className="text-2xl font-bold tracking-tight">
                {isLiveDelivery ? "Check Your Email" : "Reset Link Ready"}
              </CardTitle>
              <CardDescription>
                Password reset link generated for <strong className="text-foreground">{email}</strong>.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-center">
              {isLiveDelivery ? (
                <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground leading-relaxed text-left space-y-2">
                  <p>
                    A password reset email has been dispatched via SMTP. Please open your email inbox, find the message from RepoMind, and click the link.
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">
                    Didn&apos;t receive it? Please check your spam folder. The link will expire in 1 hour.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3.5 text-left space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                    <Info className="size-4 shrink-0" />
                    <span>Local Development Mode</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    No SMTP credentials (e.g. Gmail App Password) are set in <code className="bg-background/80 px-1 py-0.5 rounded font-mono text-[11px]">.env</code>, so no physical email was sent to your Gmail inbox.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your secure reset link was generated directly so you can reset your password immediately:
                  </p>
                </div>
              )}

              {devResetUrl && (
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <KeyRound className="size-3.5" />
                      <span>Direct Password Reset Link:</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="h-6 px-2 text-[11px] gap-1 text-primary hover:bg-primary/20"
                    >
                      {copiedLink ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                      <span>{copiedLink ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>

                  <p className="text-[11px] text-muted-foreground break-all font-mono select-all bg-background/80 p-2.5 rounded-lg border border-border/60">
                    {devResetUrl}
                  </p>

                  <Link href={devResetUrl} className="block w-full">
                    <Button className="w-full text-xs font-semibold gap-1.5 shadow-sm">
                      <span>Open Reset Password Page Now</span>
                      <ExternalLink className="size-3.5" />
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
