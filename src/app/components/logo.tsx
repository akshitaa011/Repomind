"use client"

import React from "react"
import { BrainLogo } from "~/components/brain-logo"

export function Logo({ size = 32 }: { size?: number }) {
  return <BrainLogo size={size} glow={true} />
}
