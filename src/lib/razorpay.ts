"use server"

import crypto from "crypto"
import { auth } from "@clerk/nextjs/server"
import { db } from "~/server/db"

/**
 * Creates an order with Razorpay
 * Uses standard REST API so no external heavy SDK is required
 */
export async function createRazorpayOrder(credits: number) {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  // 1 credit = ~₹1.60 INR (or 100 credits = ₹160 INR)
  const amountInINR = Math.round((credits / 50) * 80)
  const amountInPaise = amountInINR * 100

  // Fallback for Demo Mode when keys are not configured
  if (!keyId || !keySecret || keyId.includes("...")) {
    return {
      success: true,
      isDemo: true,
      orderId: `order_demo_${Date.now()}`,
      amount: amountInPaise,
      currency: "INR",
      keyId: "rzp_test_demo",
      credits,
    }
  }

  try {
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64")

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_repomind_${Date.now()}`,
        notes: {
          credits: credits.toString(),
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err?.error?.description || "Failed to create Razorpay order")
    }

    const order = await res.json()

    return {
      success: true,
      isDemo: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      credits,
    }
  } catch (error: any) {
    console.error("Razorpay order creation error:", error)
    return {
      success: false,
      error: error.message || "Failed to create Razorpay order",
    }
  }
}

/**
 * Verifies Razorpay signature and updates user credits
 */
export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  credits: number
) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  let userId: string | null = null
  try {
    const session = await auth()
    userId = session?.userId ?? null
  } catch {
    // Demo mode fallback
  }

  // Demo verification when keys are not configured
  if (!keySecret || keySecret.includes("...")) {
    if (userId && db?.user) {
      try {
        await db.user.update({
          where: { id: userId },
          data: { credits: { increment: credits } },
        })
        await db.stripeTransaction.create({
          data: {
            userId,
            credits,
          },
        })
      } catch {
        // Safe db fallback
      }
    }
    return { success: true, isDemo: true, credits }
  }

  // Real HMAC SHA256 Signature verification
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")

  if (expectedSignature !== signature) {
    return { success: false, error: "Invalid payment signature" }
  }

  // Add credits to user in database
  if (userId && db?.user) {
    try {
      await db.user.update({
        where: { id: userId },
        data: { credits: { increment: credits } },
      })
      await db.stripeTransaction.create({
        data: {
          userId,
          credits,
        },
      })
    } catch (e) {
      console.error("Error updating credits:", e)
    }
  }

  return { success: true, isDemo: false, credits }
}
