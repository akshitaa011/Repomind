"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { api } from "~/trpc/react"
import useProject from "~/hooks/use-project"
import { BrainLogo } from "~/components/brain-logo"
import CodeRefrence from "../dashboard/code-refrence"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { toast } from "sonner"
import { cn } from "~/lib/utils"

import {
  BookOpen,
  Search,
  Sparkles,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  MessageSquare,
  FileCode2,
  Calendar,
  User,
  ArrowRight,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

export default function KnowledgeBasePage() {
  const { project, projectId } = useProject()
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const utils = api.useUtils()
  const deleteQuestion = api.project.deleteQuestion.useMutation()

  // Fetch saved questions for this project
  const { data: questions, isLoading } = api.project.getQuestions.useQuery(
    { projectId: projectId || "" },
    { enabled: !!projectId }
  )

  const repoName = project?.repoUrl
    ? project.repoUrl.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, "")
    : project?.name || "Repository"

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Answer copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this answer from the Knowledge Base?")) {
      return
    }

    try {
      await deleteQuestion.mutateAsync({ questionId: id })
      toast.success("Removed from Knowledge Base")
      await utils.project.getQuestions.invalidate({ projectId: projectId || "" })
      await utils.project.getProjectStats.invalidate({ projectId: projectId || "" })
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete question")
    }
  }

  // Filter saved Q&As based on search
  const filteredQuestions = useMemo(() => {
    if (!questions) return []
    if (!searchQuery.trim()) return questions

    const query = searchQuery.toLowerCase()
    return questions.filter(
      (q) =>
        q.question.toLowerCase().includes(query) ||
        q.answer.toLowerCase().includes(query)
    )
  }, [questions, searchQuery])

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <BrainLogo size={56} glow={true} />
        <h2 className="text-2xl font-bold tracking-tight">No Project Selected</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Please select or link a GitHub repository to access its persistent Knowledge Base.
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
            <BookmarkCheck className="size-3.5" />
            <span>Persistent Repository Q/A Knowledge Base</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Knowledge Base
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Repository:</span>
            <span className="font-mono font-medium text-foreground">{repoName}</span>
            <span>•</span>
            <span className="text-primary font-semibold">{questions?.length || 0} curated answers saved</span>
          </p>
        </div>

        <Link href="/qa">
          <Button size="sm" className="h-9 gap-1.5 text-xs font-medium">
            <BrainLogo size={18} glow={false} />
            <span>Ask & Save New Question</span>
          </Button>
        </Link>
      </div>

      {/* 2. Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search saved repository answers, architecture notes, and code explanations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 text-xs bg-card border-border/70"
        />
      </div>

      {/* 3. Knowledge Base Items */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
            <BookOpen className="size-6 animate-spin text-primary mb-3" />
            <p className="text-sm font-semibold">Loading repository knowledge base...</p>
          </div>
        ) : filteredQuestions.length > 0 ? (
          filteredQuestions.map((item) => {
            const isExpanded = expandedIds.has(item.id)
            const refs =
              item.filesRefrences && Array.isArray(item.filesRefrences)
                ? (item.filesRefrences as any[])
                : []

            return (
              <Card
                key={item.id}
                className="border border-border/70 bg-card hover:border-primary/40 transition-colors shadow-xs overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Top Bar: Question & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="size-4 text-primary shrink-0" />
                        <h3 className="text-base font-bold text-foreground">
                          {item.question}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.user.imageUrl ? (
                          <img
                            src={item.user.imageUrl}
                            alt="Author"
                            className="size-4 rounded-full"
                          />
                        ) : (
                          <User className="size-3.5" />
                        )}
                        <span>
                          Saved by {item.user.firstName || "Team Member"} {item.user.lastName || ""}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(item.id, item.answer)}
                        className="h-7 text-xs gap-1.5"
                      >
                        {copiedId === item.id ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        <span>{copiedId === item.id ? "Copied" : "Copy"}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteQuestion.isPending}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Answer Content */}
                  <div
                    className={cn(
                      "prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed rounded-xl bg-muted/40 p-4 border border-border/50",
                      !isExpanded && "line-clamp-4 relative"
                    )}
                  >
                    <MarkdownPreview
                      source={item.answer}
                      style={{ padding: "0.25rem 0", background: "transparent" }}
                      wrapperElement={{
                        "data-color-mode": theme === "dark" ? "dark" : "light",
                      }}
                    />
                  </div>

                  {/* Expand / Collapse Button if long */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Collapse Answer" : "Expand Full Answer"}</span>
                      {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    </button>

                    {refs.length > 0 && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {refs.length} referenced files
                      </span>
                    )}
                  </div>

                  {/* Code References if expanded */}
                  {isExpanded && refs.length > 0 && (
                    <div className="pt-3 border-t border-border/60 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <FileCode2 className="size-3.5 text-primary" />
                        <span>Referenced Repository Sources ({refs.length}):</span>
                      </div>
                      <CodeRefrence filesRefrences={refs} />
                    </div>
                  )}
                </div>
              </Card>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-3">
            <BookOpen className="size-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-base font-bold text-foreground">
              {searchQuery ? "No matching answers" : "Knowledge Base is Empty"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No answers found matching "${searchQuery}".`
                : "Ask questions on the Ask & Explore page and click 'Save Answer' to build your repository knowledge base."}
            </p>
            <Link href="/qa">
              <Button size="sm" className="text-xs gap-1.5 mt-2">
                <BrainLogo size={16} glow={false} />
                <span>Go to Ask & Explore</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
