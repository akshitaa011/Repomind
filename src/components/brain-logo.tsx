"use client"

import React from "react"
import { cn } from "~/lib/utils"

interface BrainLogoProps {
  className?: string
  size?: number
  showText?: boolean
  textClassName?: string
  glow?: boolean
}

/**
 * RepoMind Brain Logo
 * Stylized neural-circuit brain icon matching the reference design from slide 42 & 43
 */
export function BrainLogo({
  className = "",
  size = 32,
  showText = false,
  textClassName = "",
  glow = true,
}: BrainLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0", glow && "group")}>
        {glow && (
          <div
            className="absolute inset-0 rounded-full bg-blue-500/25 blur-md -z-10 group-hover:bg-blue-500/40 transition-colors"
            style={{ width: size, height: size }}
          />
        )}
        <svg
          width={size}
          height={size}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-blue-500 dark:text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        >
          {/* Outer Brain Contour - Left Hemisphere */}
          <path
            d="M 18 6 C 14.5 6 11.5 7.8 10 10.5 C 7.5 11 5.5 13.5 5.5 16.5 C 5.5 18 6.2 19.3 7.2 20.2 C 6.5 21.5 6.5 23.2 7.5 24.8 C 8.5 26.5 10.2 27.5 12 27.5 C 12.8 28.5 14 29.5 15.5 29.8 C 16.3 30 17.2 30 18 30"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Outer Brain Contour - Right Hemisphere */}
          <path
            d="M 18 6 C 21.5 6 24.5 7.8 26 10.5 C 28.5 11 30.5 13.5 30.5 16.5 C 30.5 18 29.8 19.3 28.8 20.2 C 29.5 21.5 29.5 23.2 28.5 24.8 C 27.5 26.5 25.8 27.5 24 27.5 C 23.2 28.5 22 29.5 20.5 29.8 C 19.7 30 18.8 30 18 30"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Cerebral Fissure */}
          <path
            d="M 18 7 L 18 13 M 18 16 L 18 23 M 18 26 L 18 29"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Neural Synapse Pathways - Left */}
          <path
            d="M 12 13 C 13.5 14.5 14.5 16 14.5 18 C 14.5 20 13 21.5 11 22.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 14.5 18 L 18 18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Neural Synapse Pathways - Right */}
          <path
            d="M 24 13 C 22.5 14.5 21.5 16 21.5 18 C 21.5 20 23 21.5 25 22.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 21.5 18 L 18 18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Synaptic Nodes (Glowing Data Points) */}
          <circle cx="12" cy="13" r="1.5" fill="currentColor" />
          <circle cx="24" cy="13" r="1.5" fill="currentColor" />
          <circle cx="18" cy="18" r="1.8" fill="#60A5FA" />
          <circle cx="11" cy="22.5" r="1.5" fill="currentColor" />
          <circle cx="25" cy="22.5" r="1.5" fill="currentColor" />
          <circle cx="14.5" cy="26" r="1.2" fill="currentColor" opacity="0.8" />
          <circle cx="21.5" cy="26" r="1.2" fill="currentColor" opacity="0.8" />
        </svg>
      </div>

      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300 bg-clip-text text-transparent",
            textClassName
          )}
        >
          RepoMind
        </span>
      )}
    </div>
  )
}
