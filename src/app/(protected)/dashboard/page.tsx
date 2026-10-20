"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ExternalLink,
  Github,
  GitBranch,
  Copy,
  Check,
  Plus,
  FileCode2,
  MessageSquareCode,
  FolderGit2,
  Sparkles,
} from 'lucide-react'
import useProject from '~/hooks/use-project'
import { useSession } from '~/lib/auth-client'
import { api } from '~/trpc/react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import AskQuestionCard from './ask-question-card'
import CommitLog from './commit-log'
import DeleteButton from './delete-button'
import InviteButton from './invite-button'
import TeamMembers from './team-members'
import RepoHealthCard from './repo-health-card'
import { BrainLogo } from '~/components/brain-logo'

const DashboardPage = () => {
  const { project, projects, projectId, setProjectId, isLoading: isProjectsLoading } = useProject()
  const { data: session } = useSession()
  const [copiedClone, setCopiedClone] = useState(false)

  // Fetch live stats for selected project
  const { data: stats } = api.project.getProjectStats.useQuery(
    { projectId: project?.id || '' },
    { enabled: !!project?.id }
  )

  const handleCopyClone = () => {
    if (project?.repoUrl) {
      navigator.clipboard.writeText(`${project.repoUrl}.git`)
      setCopiedClone(true)
      toast.success("Git clone URL copied")
      setTimeout(() => setCopiedClone(false), 2000)
    }
  }

  // Loading state
  if (isProjectsLoading && (!projects || projects.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted-foreground">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium">Synchronizing workspace...</p>
      </div>
    )
  }

  const hasProjects = projects && projects.length > 0
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Developer'

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* 1. Aesthetic Welcome Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card/95 via-card/75 to-card/50 p-6 sm:p-8 shadow-xs">
        {/* Soft Ambient Background Glows */}
        <div className="absolute -right-8 -top-8 size-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-10 size-48 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 backdrop-blur-xs">
            <Sparkles className="size-3.5" />
            <span>Developer Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Welcome back, <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent capitalize">{userName}</span>!
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Connect your repositories, explore architecture, and get AI-powered answers about your code.
          </p>
        </div>
      </div>

      {/* 2. Key Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Repositories */}
        <Card className="border border-border/70 bg-card/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Repositories
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {projects?.length ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {projects?.length === 1 ? '1 active workspace' : `${projects?.length ?? 0} active workspaces`}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FolderGit2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Indexed Files */}
        <Card className="border border-border/70 bg-card/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Indexed Files
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {project ? (stats?.embeddingsCount ?? 0) : 0}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {project ? 'Vectorized code chunks' : 'No repository active'}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileCode2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Saved Answers */}
        <Card className="border border-border/70 bg-card/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Saved Answers
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {project ? (stats?.questionsCount ?? 0) : 0}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {project ? 'Knowledge base solutions' : 'No repository active'}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageSquareCode className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Repositories Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Github className="size-4 text-primary" />
            Repositories
          </h2>
          {hasProjects && (
            <Link href="/create">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border/70 hover:border-primary/50">
                <Plus className="size-3 text-primary" />
                <span>Add repository</span>
              </Button>
            </Link>
          )}
        </div>

        {hasProjects ? (
          <div className="space-y-3">
            {/* Active Repository Card */}
            <div className="p-4 rounded-xl border border-border/70 bg-card/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Github className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {project?.name}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <GitBranch className="size-2.5" />
                      <span>main</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link
                      href={project?.repoUrl ?? ""}
                      target="_blank"
                      className="font-mono hover:text-foreground hover:underline inline-flex items-center gap-1 transition-colors"
                    >
                      {project?.repoUrl}
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Active Repository Actions */}
              <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                <Link href="/qa">
                  <Button size="sm" className="h-8 text-xs gap-1.5 font-medium shadow-xs">
                    <BrainLogo size={16} glow={false} />
                    <span>Ask & Explore</span>
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyClone}
                  className="h-8 text-xs gap-1.5 font-medium border-border/70"
                  title="Copy git clone URL"
                >
                  {copiedClone ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copiedClone ? "Copied" : "Clone URL"}
                </Button>
                <TeamMembers />
                <InviteButton />
                <DeleteButton />
              </div>
            </div>

            {/* Other Connected Repositories (if more than 1) */}
            {projects.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs text-muted-foreground mr-1">Switch workspace:</span>
                {projects.map((p) => {
                  const isActive = p.id === projectId
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProjectId(p.id)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        isActive
                          ? 'bg-primary/10 border-primary text-primary font-medium'
                          : 'bg-card/50 border-border/70 text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                    >
                      {p.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* Empty Repository State - Clean & Professional */
          <div className="rounded-xl border border-dashed border-border/80 bg-card/40 p-8 text-center space-y-3">
            <div className="mx-auto size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FolderGit2 className="size-5" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-sm font-semibold text-foreground">No repositories linked yet</p>
              <p className="text-xs text-muted-foreground">
                Connect your GitHub repository to index code, explore architecture, and query with AI.
              </p>
            </div>
            <div className="pt-1">
              <Link href="/create">
                <Button size="sm" className="gap-1.5 text-xs font-medium">
                  <Plus className="size-3.5" />
                  Link Repository
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 4. Main Q&A Entry Point & Repo Health */}
      {hasProjects ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <AskQuestionCard />
          <RepoHealthCard />
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-card/60 p-6 text-center space-y-2">
          <h3 className="text-base font-semibold text-foreground">Ask your codebase</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Once a repository is linked, you can ask questions regarding architecture, workflows, API contracts, and implementation details.
          </p>
        </div>
      )}

      {/* 5. Recent Activity Stream */}
      {hasProjects && (
        <div className="pt-1">
          <CommitLog />
        </div>
      )}

      {/* 6. Footer */}
      <footer className="pt-8 pb-4 text-center text-xs text-muted-foreground border-t border-border/40">
        @repomind 2026
      </footer>
    </div>
  )
}

export default DashboardPage