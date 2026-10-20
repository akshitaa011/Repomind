"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { readStreamableValue } from "ai/rsc"
import { toast } from "sonner"
import MarkdownPreview from "@uiw/react-markdown-preview"
import useProject from "~/hooks/use-project"
import { api } from "~/trpc/react"
import { BrainLogo } from "~/components/brain-logo"
import { RepoStructurePanel } from "./repo-structure-panel"
import { ArchitectureModal } from "./architecture-modal"
import { askQuestion } from "../dashboard/action"
import CodeRefrence from "../dashboard/code-refrence"
import { cn } from "~/lib/utils"

import {
  Github,
  GitBranch,
  RefreshCw,
  Sparkles,
  Send,
  Loader2,
  FileCode2,
  BookmarkCheck,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Layers,
  CornerDownLeft,
  BookOpen,
  ArrowRight,
  GitCommit,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

const PROMPT_SUGGESTIONS = [
  "How does routing and page navigation work in this repository?",
  "Explain the high-level architecture and how modules connect.",
  "Where is authentication configured and how are routes protected?",
  "What database models are defined and how do their relationships link?",
]

export default function QAPage() {
  const { project, projectId } = useProject()
  const { theme } = useTheme()

  const [question, setQuestion] = useState("")
  const [activeQuestion, setActiveQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [filesReferences, setFilesReferences] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "structure">("chat")

  // API mutations & queries
  const saveAnswer = api.project.saveAnswer.useMutation()
  const syncCommits = api.project.syncProjectCommits.useMutation()
  const utils = api.useUtils()

  const { data: savedQuestions, isLoading: isSavedLoading } =
    api.project.getQuestions.useQuery(
      { projectId: projectId || "" },
      { enabled: !!projectId }
    )

  const { data: structure } = api.project.getProjectStructure.useQuery(
    { projectId: projectId || "" },
    { enabled: !!projectId }
  )

  // Clean repo owner/name
  const repoName = project?.repoUrl
    ? project.repoUrl.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, "")
    : project?.name || "Repository"

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question
    if (!project?.id) {
      toast.error("Please select a project first")
      return
    }

    if (!q.trim()) {
      toast.error("Please enter a question")
      return
    }

    setActiveQuestion(q)
    setAnswer("")
    setFilesReferences([])
    setLoading(true)

    try {
      const { output, filesReferences: refs } = await askQuestion(q, project.id)
      setFilesReferences(refs || [])

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setAnswer((ans) => ans + delta)
        }
      }

      toast.success("Answer generated successfully")
    } catch (error: any) {
      console.error("Error asking question:", error)
      toast.error(error?.message || "Failed to generate answer")
    } finally {
      setLoading(false)
      setQuestion("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleAsk()
    }
  }

  const handleSaveToKnowledgeBase = () => {
    if (!project?.id || !answer || !activeQuestion) {
      toast.error("No active question or answer to save")
      return
    }

    saveAnswer.mutate(
      {
        projectId: project.id,
        question: activeQuestion,
        answer,
        filesRefrences: filesReferences,
      },
      {
        onSuccess: () => {
          toast.success("Saved to Knowledge Base!")
          utils.project.getQuestions.invalidate({ projectId: project.id })
          utils.project.getProjectStats.invalidate({ projectId: project.id })
        },
        onError: (err) => {
          toast.error(err.message || "Failed to save to Knowledge Base")
        },
      }
    )
  }

  const handleCopyAnswer = () => {
    if (!answer) return
    navigator.clipboard.writeText(answer)
    setCopied(true)
    toast.success("Answer copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSync = async () => {
    if (!project?.id) return
    try {
      toast.info("Syncing commits and refreshing repository status...")
      await syncCommits.mutateAsync({ projectId: project.id })
      await utils.project.getLatestCommitSummary.invalidate({ projectId: project.id })
      await utils.project.getAllCommitSummaries.invalidate({ projectId: project.id })
      await utils.project.getProjectStructure.invalidate({ projectId: project.id })
      toast.success("Repository commits synchronized!")
    } catch (error: any) {
      toast.error(error?.message || "Failed to sync repository")
    }
  }

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <BrainLogo size={56} glow={true} />
        <h2 className="text-2xl font-bold tracking-tight">No Project Selected</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Please select or link a GitHub repository to explore its architecture and ask questions.
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
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* 1. Repository Top Header Bar (Matching Reference Slide 43) */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
            <Github className="size-5" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground tracking-tight truncate">
                {repoName}
              </h2>
              <Badge variant="outline" className="text-[10px] uppercase font-semibold text-sky-500 border-sky-500/30">
                Public
              </Badge>
              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded border border-border/50">
                <GitBranch className="size-3" />
                <span>main</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <span>Linked to</span>
              <a
                href={project?.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5 truncate font-mono text-[11px]"
              >
                <span>{project?.repoUrl}</span>
                <ExternalLink className="size-2.5" />
              </a>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ArchitectureModal
            repoName={repoName}
            totalFiles={structure?.totalFiles}
            extensions={structure?.extensions}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncCommits.isPending}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={cn("size-3.5", syncCommits.isPending && "animate-spin text-primary")} />
            <span>{syncCommits.isPending ? "Syncing..." : "Sync"}</span>
          </Button>

          <Link href="/commit-summaries">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground">
              <GitCommit className="size-3.5" />
              <span>Commits</span>
            </Button>
          </Link>

          <Link href="/knowledge-base">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground">
              <BookOpen className="size-3.5" />
              <span>Knowledge Base</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Matching Slide 43) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center Area: Interactive Q&A Session (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Active Q&A Dialogue Stream */}
          {activeQuestion || answer || loading ? (
            <div className="space-y-4">
              {/* User Question Bubble */}
              {activeQuestion && (
                <div className="flex items-start gap-3 justify-end">
                  <div className="rounded-2xl rounded-tr-xs bg-primary text-white p-4 max-w-xl shadow-xs space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      Your Question
                    </p>
                    <p className="text-sm font-medium leading-relaxed">{activeQuestion}</p>
                  </div>
                </div>
              )}

              {/* RepoMind AI Response Bubble */}
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <BrainLogo size={26} glow={true} />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">RepoMind Brain</h4>
                      <p className="text-[10px] text-muted-foreground">Gemini 2.0 Flash Grounded Answer</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAnswer}
                      disabled={!answer}
                      className="h-7 text-xs gap-1.5"
                    >
                      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveToKnowledgeBase}
                      disabled={saveAnswer.isPending || !answer}
                      className="h-7 text-xs gap-1.5 shadow-sm"
                    >
                      <BookmarkCheck className="size-3" />
                      <span>{saveAnswer.isPending ? "Saving..." : "Save to Knowledge Base"}</span>
                    </Button>
                  </div>
                </div>

                {/* Streamed Answer Markdown */}
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                  {answer ? (
                    <MarkdownPreview
                      source={answer}
                      style={{ padding: "0.5rem 0", background: "transparent" }}
                      wrapperElement={{
                        "data-color-mode": theme === "dark" ? "dark" : "light",
                      }}
                    />
                  ) : loading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <div className="relative">
                        <div className="size-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <Sparkles className="size-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-xs font-semibold mt-3">Analyzing repository architecture & code chunks...</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Querying pgvector 768-D vectors and generating grounded citations.
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Grounded Source Citations */}
                {filesReferences.length > 0 && (
                  <div className="pt-3 border-t border-border/50 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <FileCode2 className="size-3.5 text-primary" />
                      <span>Referenced Sources ({filesReferences.length}):</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {filesReferences.map((ref, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/70 border border-border/60 text-xs font-mono text-foreground hover:bg-accent transition-colors"
                        >
                          <FileCode2 className="size-3 text-sky-400" />
                          <span className="truncate max-w-[200px]">{ref.fileName}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2">
                      <CodeRefrence filesRefrences={filesReferences} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State / Welcome to Ask Questions */
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center space-y-4">
              <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                <BrainLogo size={36} glow={true} />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  Explore Architecture & Ask Questions
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  RepoMind has indexed your repository into structure-aware semantic chunks.
                  Ask any question about routing, data models, logic flow, or component dependencies.
                </p>
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-lg mx-auto">
                {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAsk(suggestion)}
                    className="text-xs bg-muted/60 hover:bg-primary/10 hover:text-primary transition-all px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground text-left font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Follow-Up Input Box (Sticky at bottom or below chat) */}
          <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs space-y-2">
            <div className="relative">
              <Textarea
                className="min-h-[85px] resize-none text-xs bg-background/50 focus:bg-background border-border/60 text-foreground placeholder:text-muted-foreground/60 transition-colors"
                placeholder="Ask a follow-up question or explore repository architecture..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 pointer-events-none text-[10px] text-muted-foreground/60 font-mono">
                <span>Ctrl</span>
                <span>+</span>
                <CornerDownLeft className="size-3" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                RAG queries reference pgvector 768-D embeddings with source citations.
              </span>

              <Button
                type="button"
                onClick={() => handleAsk()}
                disabled={loading || !question.trim()}
                size="sm"
                className="h-8 px-4 text-xs font-semibold gap-1.5 ml-auto shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3" />
                    <span>Ask Question</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Saved Questions Accordion List */}
          {savedQuestions && savedQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">
                    Saved Repository Q&As ({savedQuestions.length})
                  </h3>
                </div>
                <Link
                  href="/knowledge-base"
                  className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Open Knowledge Base</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {savedQuestions.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveQuestion(item.question)
                      setAnswer(item.answer)
                      setFilesReferences(
                        item.filesRefrences && Array.isArray(item.filesRefrences)
                          ? (item.filesRefrences as any[])
                          : []
                      )
                    }}
                    className="p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-accent/40 cursor-pointer transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground line-clamp-1">
                        {item.question}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Repository Architecture & Structure Panel (5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <RepoStructurePanel projectId={projectId} repoUrl={project?.repoUrl} />
        </div>
      </div>
    </div>
  )
}
