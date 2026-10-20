"use client"

import React, { useState } from "react"
import useProject from "~/hooks/use-project"
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { readStreamableValue } from "ai/rsc"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useTheme } from "next-themes"
import { api } from "~/trpc/react"
import { toast } from "sonner"
import useRefetch from "~/hooks/use-refetch"
import { askQuestion } from "./action"
import CodeRefrence from "./code-refrence"
import { BrainLogo } from "~/components/brain-logo"
import {
  Sparkles,
  BookmarkCheck,
  Copy,
  Check,
  Send,
  Loader2,
  FileCode2,
  CornerDownLeft,
} from "lucide-react"

const PROMPT_SUGGESTIONS = [
  {
    label: "🏗️ System Architecture",
    prompt: "Explain the high-level architecture and how the core modules interact.",
  },
  {
    label: "🔐 Auth & Permissions",
    prompt: "Where is authentication configured and how are protected routes guarded?",
  },
  {
    label: "🗄️ Database & Schema",
    prompt: "What database models are defined and how do their relationships connect?",
  },
  {
    label: "⚡ Key Workflows",
    prompt: "Walk through the end-to-end flow when repository indexing or analysis runs.",
  },
]

const AskQuestionCard = () => {
  const { project } = useProject()
  const { theme } = useTheme()
  const [question, setQuestion] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [filesReferences, setFilesReferences] = useState<
    {
      fileName: string
      sourceCode: string
      summary: string
    }[]
  >([])
  const [answer, setAnswer] = useState("")
  const saveAnswer = api.project.saveAnswer.useMutation()
  const refetch = useRefetch()

  const handleAsk = async () => {
    if (!project?.id) {
      toast.error("Please select a project first")
      return
    }

    if (!question.trim()) {
      toast.error("Please enter a question")
      return
    }

    setAnswer("")
    setFilesReferences([])
    setLoading(true)

    try {
      const { output, filesReferences: refs } = await askQuestion(question, project.id)

      setFilesReferences(refs || [])
      setOpen(true)

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
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    handleAsk()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleAsk()
    }
  }

  const handleSaveAnswer = () => {
    if (!project?.id) {
      toast.error("Project ID is missing")
      return
    }

    if (!answer || !question) {
      toast.error("No question or answer to save")
      return
    }

    saveAnswer.mutate(
      {
        projectId: project.id,
        question,
        answer,
        filesRefrences: filesReferences,
      },
      {
        onSuccess: () => {
          toast.success("Saved to Knowledge Base!")
          refetch()
        },
        onError: (err) => {
          toast.error(err.message || "Failed to save answer")
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

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[76vw] max-h-[92vh] overflow-hidden flex flex-col p-6">
          <DialogHeader className="border-b pb-4 shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <DialogTitle className="flex items-center gap-2.5">
                <BrainLogo size={28} glow={true} />
                <span className="text-xl font-bold tracking-tight">RepoMind Intelligence</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                  Gemini 2.0 Flash RAG
                </span>
              </DialogTitle>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAnswer}
                  disabled={!answer}
                  className="rounded-lg h-8 text-xs gap-1.5"
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  disabled={saveAnswer.isPending || !answer}
                  onClick={handleSaveAnswer}
                  className="rounded-lg h-8 text-xs gap-1.5 shadow-sm"
                >
                  <BookmarkCheck className="size-3.5" />
                  {saveAnswer.isPending ? "Saving..." : "Save Answer"}
                </Button>
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="font-medium text-foreground">Query:</span>
              <span className="italic truncate">{question}</span>
            </div>
          </DialogHeader>

          {/* Answer Display */}
          <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
            {answer ? (
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                <MarkdownPreview
                  source={answer}
                  style={{ padding: "0.5rem 0", background: "transparent" }}
                  wrapperElement={{
                    "data-color-mode": theme === "dark" ? "dark" : "light",
                  }}
                />
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="relative">
                  <div className="size-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <Sparkles className="size-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h4 className="font-semibold text-base mt-4">Retrieving Code Semantics...</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  Analyzing pgvector 768-dimensional embeddings and generating grounded architecture answer...
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No answer generated yet</p>
            )}

            {/* Code References */}
            {filesReferences.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <FileCode2 className="size-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Grounded Source Files ({filesReferences.length})
                  </h3>
                </div>
                <CodeRefrence filesRefrences={filesReferences} />
              </div>
            )}
          </div>

          <div className="border-t pt-3 flex justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="relative col-span-3 border border-border/70 shadow-xs bg-card/70">
        <CardHeader className="pb-2.5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="size-3.5" />
              </div>
              Ask your codebase
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                className="min-h-[105px] resize-none text-sm bg-background/50 focus:bg-background border-border/70 focus-visible:ring-1 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground/60 transition-colors"
                placeholder="How does authentication work in this project?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <div className="absolute bottom-2 right-2.5 flex items-center gap-1 pointer-events-none text-[10px] text-muted-foreground/60 font-mono">
                <span>Ctrl</span>
                <span>+</span>
                <CornerDownLeft className="size-3" />
              </div>
            </div>

            {/* Prompt Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">Suggestions:</span>
              {PROMPT_SUGGESTIONS.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setQuestion(item.prompt)}
                  className="text-[11px] bg-muted/70 hover:bg-primary/10 hover:text-primary transition-all px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Indexed repository context is automatically referenced.
              </p>

              <Button
                type="submit"
                disabled={loading || !question.trim() || !project?.id}
                size="sm"
                className="gap-1.5 font-medium shadow-sm h-9 px-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Querying RepoMind...
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    Ask RepoMind
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default AskQuestionCard
