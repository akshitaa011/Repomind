"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { api } from "~/trpc/react"
import useProject from "~/hooks/use-project"
import { BrainLogo } from "~/components/brain-logo"
import { toast } from "sonner"
import { cn } from "~/lib/utils"

import {
  GitCommit,
  GitBranch,
  Github,
  Search,
  RefreshCw,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Calendar,
  User,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

export default function CommitSummariesPage() {
  const { project, projectId } = useProject()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)

  const utils = api.useUtils()
  const syncCommits = api.project.syncProjectCommits.useMutation()

  // Fetch all commit summaries for this project
  const { data: commits, isLoading } = api.project.getAllCommitSummaries.useQuery(
    { projectId: projectId || "" },
    { enabled: !!projectId }
  )

  const repoName = project?.repoUrl
    ? project.repoUrl.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, "")
    : project?.name || "Repository"

  const handleSync = async () => {
    if (!projectId) return
    try {
      toast.info("Polling GitHub commits & generating summaries with Gemini...")
      await syncCommits.mutateAsync({ projectId })
      await utils.project.getAllCommitSummaries.invalidate({ projectId })
      await utils.project.getLatestCommitSummary.invalidate({ projectId })
      toast.success("Commits updated!")
    } catch (err: any) {
      toast.error(err?.message || "Failed to sync commits")
    }
  }

  // List unique authors for filtering
  const authors = useMemo(() => {
    if (!commits) return []
    const set = new Set<string>()
    commits.forEach((c) => {
      if (c.commitAuthorName) set.add(c.commitAuthorName)
    })
    return Array.from(set)
  }, [commits])

  // Filter commits based on search query & author
  const filteredCommits = useMemo(() => {
    if (!commits) return []
    return commits.filter((commit) => {
      const matchesSearch =
        !searchQuery.trim() ||
        commit.commitMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commit.commitHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commit.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commit.commitAuthorName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesAuthor = !selectedAuthor || commit.commitAuthorName === selectedAuthor

      return matchesSearch && matchesAuthor
    })
  }, [commits, searchQuery, selectedAuthor])

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <BrainLogo size={56} glow={true} />
        <h2 className="text-2xl font-bold tracking-tight">No Project Selected</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Please select or link a GitHub repository to explore automated commit summaries.
        </p>
        <Link href="/create">
          <Button className="gap-2">
            <span>Link Repository</span>
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="size-3.5" />
            <span>Automated Git Diff Summarization</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Commit Summaries
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Repository:</span>
            <span className="font-mono font-medium text-foreground">{repoName}</span>
            <span>•</span>
            <span className="text-primary font-semibold">{commits?.length || 0} commits analyzed</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncCommits.isPending}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={cn("size-3.5", syncCommits.isPending && "animate-spin text-primary")} />
            <span>{syncCommits.isPending ? "Polling GitHub..." : "Sync Commits"}</span>
          </Button>

          <Link href="/qa">
            <Button size="sm" className="h-9 gap-1.5 text-xs font-medium">
              <BrainLogo size={18} glow={false} />
              <span>Ask About Commits</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Search & Author Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search commits by message, author, or code changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs bg-card border-border/70"
          />
        </div>

        {/* Author filter tags */}
        {authors.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedAuthor(null)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 border",
                selectedAuthor === null
                  ? "bg-primary text-white border-primary"
                  : "bg-muted/60 text-muted-foreground border-border/60 hover:text-foreground"
              )}
            >
              All Authors ({commits?.length || 0})
            </button>
            {authors.map((author) => (
              <button
                key={author}
                type="button"
                onClick={() => setSelectedAuthor(author === selectedAuthor ? null : author)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 border",
                  selectedAuthor === author
                    ? "bg-primary text-white border-primary"
                    : "bg-muted/60 text-muted-foreground border-border/60 hover:text-foreground"
                )}
              >
                {author}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Commit List Timeline */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
            <RefreshCw className="size-6 animate-spin text-primary mb-3" />
            <p className="text-sm font-semibold">Loading commit timeline...</p>
            <p className="text-xs text-muted-foreground mt-1">Retrieving AI summaries for {repoName}</p>
          </div>
        ) : filteredCommits.length > 0 ? (
          filteredCommits.map((commit) => {
            const lines = commit.summary
              .split("\n")
              .map((l) => l.trim().replace(/^[-*•]\s*/, ""))
              .filter((l) => l.length > 0)

            const commitUrl = `${project?.repoUrl}/commit/${commit.commitHash}`

            return (
              <Card
                key={commit.id}
                className="border border-border/70 bg-card hover:border-primary/40 transition-colors shadow-xs overflow-hidden"
              >
                <div className="p-5 space-y-3.5">
                  {/* Top line: Commit Message & Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <GitCommit className="size-4 text-primary shrink-0" />
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          {commit.commitMessage}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {commit.commitAuthorAvatar ? (
                          <img
                            src={commit.commitAuthorAvatar}
                            alt={commit.commitAuthorName}
                            className="size-4 rounded-full"
                          />
                        ) : (
                          <User className="size-3.5" />
                        )}
                        <span className="font-medium text-foreground">{commit.commitAuthorName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(commit.commitDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Commit Hash Pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={commitUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border/60 text-muted-foreground"
                      >
                        <span>{commit.commitHash.slice(0, 7)}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>

                  {/* AI Generated Summary Box */}
                  <div className="rounded-xl bg-primary/5 border border-primary/15 p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="size-3.5" />
                      <span>RepoMind AI Summary</span>
                    </div>

                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                      {lines.map((line, idx) => (
                        <li key={idx} className="leading-relaxed">
                          <span className="text-foreground/90">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-3">
            <GitCommit className="size-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-base font-bold text-foreground">No Commits Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No commits matched "${searchQuery}". Try clearing your search.`
                : "Commits have not been polled yet. Click Sync Commits to fetch them from GitHub."}
            </p>
            {searchQuery ? (
              <Button size="sm" variant="outline" onClick={() => setSearchQuery("")} className="text-xs">
                Clear Filter
              </Button>
            ) : (
              <Button size="sm" onClick={handleSync} className="text-xs gap-1.5">
                <RefreshCw className="size-3.5" />
                <span>Sync Commits</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
