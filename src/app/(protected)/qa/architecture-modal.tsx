"use client"

import React, { useState } from "react"
import {
  Layers,
  Cpu,
  Database,
  GitBranch,
  ShieldCheck,
  Code2,
  Sparkles,
  ArrowRight,
  Server,
  FileCode2,
  Workflow,
  CheckCircle2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { BrainLogo } from "~/components/brain-logo"

interface ArchitectureModalProps {
  repoName: string
  totalFiles?: number
  extensions?: Record<string, number>
}

export function ArchitectureModal({
  repoName,
  totalFiles = 0,
  extensions = {},
}: ArchitectureModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
        >
          <Workflow className="size-3.5" />
          <span>Architecture Graph</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[80vw] max-h-[88vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
              <BrainLogo size={28} glow={true} />
              <span>Repository Architecture & Pipeline: {repoName}</span>
            </DialogTitle>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
              {totalFiles} Ingested Files
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* 1. End-to-End System Pipeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>RepoMind Ingestion & Hybrid RAG Pipeline</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1 */}
              <Card className="border-border/70 bg-card/60 relative overflow-hidden">
                <div className="h-1 bg-blue-500 w-full" />
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs">
                    <GitBranch className="size-4" />
                    <span>1. Ingestion</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">GitHub Repo Loader</p>
                  <p className="text-[11px] text-muted-foreground">
                    Fetches files from repository, filters binary & lock files, and prepares AST documents.
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="border-border/70 bg-card/60 relative overflow-hidden">
                <div className="h-1 bg-indigo-500 w-full" />
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-500 font-semibold text-xs">
                    <Cpu className="size-4" />
                    <span>2. Semantic Chunking</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">Structure-Aware Chunks</p>
                  <p className="text-[11px] text-muted-foreground">
                    Splits code into semantic 2500-character segments with AST start & end line tracking.
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="border-border/70 bg-card/60 relative overflow-hidden">
                <div className="h-1 bg-sky-500 w-full" />
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-sky-500 font-semibold text-xs">
                    <Database className="size-4" />
                    <span>3. pgvector Storage</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">768-D Embeddings</p>
                  <p className="text-[11px] text-muted-foreground">
                    Gemini text-embedding-004 vectors indexed into PostgreSQL vector column for cosine similarity.
                  </p>
                </CardContent>
              </Card>

              {/* Step 4 */}
              <Card className="border-border/70 bg-card/60 relative overflow-hidden">
                <div className="h-1 bg-emerald-500 w-full" />
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs">
                    <Sparkles className="size-4" />
                    <span>4. Grounded Q&A</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">Gemini 2.0 Flash</p>
                  <p className="text-[11px] text-muted-foreground">
                    Synthesizes retrieved code with keyword boosting, returning streaming answers and source citations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 2. Layered Architecture Diagram */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              <span>Application Layered Structure</span>
            </h4>

            <div className="border border-border/70 rounded-xl p-4 bg-muted/20 space-y-3">
              {/* Presentation Layer */}
              <div className="p-3 rounded-lg border border-border/60 bg-background/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">Presentation Layer</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary">Next.js 15 App Router</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    `/dashboard`, `/qa` (Ask & Explore), `/commit-summaries`, `/knowledge-base`, `/billing`
                  </p>
                </div>
                <div className="text-right text-[11px] font-mono text-muted-foreground">
                  React 18 / Tailwind CSS
                </div>
              </div>

              {/* API & Controller Layer */}
              <div className="p-3 rounded-lg border border-border/60 bg-background/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-500">Service & API Layer</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500">tRPC & Server Actions</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    `projectRouter`, `askQuestion` RAG engine, GitHub Octokit polling, Gemini LLM summarizer
                  </p>
                </div>
                <div className="text-right text-[11px] font-mono text-muted-foreground">
                  End-to-End Type Safety
                </div>
              </div>

              {/* Data Layer */}
              <div className="p-3 rounded-lg border border-border/60 bg-background/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-500">Data Persistence Layer</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500">Prisma ORM + PostgreSQL</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    `Project`, `ProjectFile`, `SourceCodeEmbedding` (vector 768), `Commit`, `Question`, `User`
                  </p>
                </div>
                <div className="text-right text-[11px] font-mono text-muted-foreground">
                  Supabase / pgvector
                </div>
              </div>
            </div>
          </div>

          {/* 3. File Breakdown by Extension */}
          {Object.keys(extensions).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Repository File Distribution
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(extensions).map(([ext, count]) => (
                  <div
                    key={ext}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border/50 text-xs"
                  >
                    <span className="font-mono text-primary font-semibold">.{ext}</span>
                    <span className="text-muted-foreground">({count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
