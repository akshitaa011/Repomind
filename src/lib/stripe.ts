"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Stripe from "stripe"

export async function createCheckoutSession(credits: number) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // When Stripe key is not configured, redirect back with simulated success for demo
  if (!stripeKey || stripeKey.includes("...")) {
    return redirect(`${appUrl}/billing?demo_success=true&credits=${credits}`)
  }

  let userId: string | null = null
  try {
    const session = await auth()
    userId = session?.userId ?? null
  } catch {
    // Demo fallback when auth is not active
  }

  if (!userId) {
    userId = "demo_user"
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-02-24.acacia" as any,
  })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${credits} RepoMind Credits`,
          },
          unit_amount: Math.round((credits / 50) * 100),
        },
        quantity: 1,
      },
    ],
    customer_creation: "always",
    mode: "payment",
    success_url: `${appUrl}/create`,
    cancel_url: `${appUrl}/billing`,
    client_reference_id: userId.toString(),
    metadata: {
      credits,
    },
  })

  return redirect(session.url!)
}