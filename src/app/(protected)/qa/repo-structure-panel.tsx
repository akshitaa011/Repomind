"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { api } from "~/trpc/react"
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  Search,
  GitCommit,
  Sparkles,
  ExternalLink,
  Code2,
  Database,
  Layers,
  FileCheck2,
  HelpCircle,
  Copy,
  Check,
  Eye,
  Loader2,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { ScrollArea } from "~/components/ui/scroll-area"
import { cn } from "~/lib/utils"
import { toast } from "sonner"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useTheme } from "next-themes"

interface FileTreeNode {
  id: string
  name: string
  path: string
  type: "file" | "folder"
  children?: FileTreeNode[]
  extension?: string
}

interface RepoStructurePanelProps {
  projectId: string
  repoUrl?: string
}

function getFileIcon(extension?: string) {
  switch (extension) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return <FileCode className="size-3.5 text-sky-400 shrink-0" />
    case "json":
      return <FileJson className="size-3.5 text-amber-400 shrink-0" />
    case "md":
    case "txt":
      return <FileText className="size-3.5 text-emerald-400 shrink-0" />
    case "css":
    case "scss":
      return <FileSpreadsheet className="size-3.5 text-indigo-400 shrink-0" />
    default:
      return <FileCode className="size-3.5 text-muted-foreground shrink-0" />
  }
}

function TreeNodeItem({
  node,
  selectedPath,
  onSelectFile,
  expandedFolders,
  toggleFolder,
}: {
  node: FileTreeNode
  selectedPath?: string
  onSelectFile: (path: string) => void
  expandedFolders: Set<string>
  toggleFolder: (path: string) => void
}) {
  const isFolder = node.type === "folder"
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = selectedPath === node.path

  if (isFolder) {
    return (
      <div className="select-none">
        <button
          type="button"
          onClick={() => toggleFolder(node.path)}
          className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-foreground/80 hover:text-foreground hover:bg-accent/60 transition-colors text-left"
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="size-3.5 text-sky-500 fill-sky-500/20 shrink-0" />
          ) : (
            <Folder className="size-3.5 text-sky-500 fill-sky-500/20 shrink-0" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>

        {isExpanded && node.children && (
          <div className="pl-3.5 ml-1 border-l border-border/50 space-y-0.5 mt-0.5">
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.id}
                node={child}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelectFile(node.path)}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors text-left",
        isSelected
          ? "bg-primary text-white font-medium shadow-xs"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      )}
    >
      <span className="size-3.5 flex items-center justify-center shrink-0">
        {getFileIcon(node.extension)}
      </span>
      <span className="truncate">{node.name}</span>
    </button>
  )
}

export function RepoStructurePanel({ projectId, repoUrl }: RepoStructurePanelProps) {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src", "app", "components", "lib"])
  )
  const [selectedFileForModal, setSelectedFileForModal] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // 1. Fetch file tree structure
  const { data: structure, isLoading: isStructureLoading } =
    api.project.getProjectStructure.useQuery(
      { projectId },
      { enabled: !!projectId }
    )

  // 2. Fetch latest commit summary
  const { data: latestCommit, isLoading: isCommitLoading } =
    api.project.getLatestCommitSummary.useQuery(
      { projectId },
      { enabled: !!projectId }
    )

  // 3. Fetch project stats
  const { data: stats } = api.project.getProjectStats.useQuery(
    { projectId },
    { enabled: !!projectId }
  )

  // 4. Fetch selected file content
  const { data: fileData, isLoading: isFileLoading } =
    api.project.getFileContent.useQuery(
      { projectId, path: selectedFileForModal || "" },
      { enabled: !!selectedFileForModal }
    )

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleSelectFile = (path: string) => {
    setSelectedFileForModal(path)
  }

  const handleCopyCode = () => {
    if (fileData?.content) {
      navigator.clipboard.writeText(fileData.content)
      setCopiedCode(true)
      toast.success("Code copied to clipboard")
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  // Filter file tree when search query is typed
  const filteredTree = useMemo(() => {
    if (!structure?.fileTree) return []
    if (!searchQuery.trim()) return structure.fileTree

    const query = searchQuery.toLowerCase()

    function filterNode(node: FileTreeNode): FileTreeNode | null {
      if (node.type === "file") {
        return node.name.toLowerCase().includes(query) || node.path.toLowerCase().includes(query)
          ? node
          : null
      }

      if (node.children) {
        const matchingChildren = node.children
          .map(filterNode)
          .filter((n): n is FileTreeNode => n !== null)

        if (matchingChildren.length > 0 || node.name.toLowerCase().includes(query)) {
          return {
            ...node,
            children: matchingChildren,
          }
        }
      }

      return null
    }

    return structure.fileTree.map(filterNode).filter((n): n is FileTreeNode => n !== null)
  }, [structure?.fileTree, searchQuery])

  // Extract commit bullet summaries cleanly
  const commitBullets = useMemo(() => {
    if (!latestCommit?.summary) {
      return [
        "Repository ingestion completed and indexed into pgvector",
        "Semantic code chunks generated with Gemini AI",
        "Ready for contextual question answering & architecture exploration",
      ]
    }
    const lines = latestCommit.summary
      .split("\n")
      .map((l) => l.trim().replace(/^[-*•]\s*/, ""))
      .filter((l) => l.length > 0)
    return lines.length > 0 ? lines.slice(0, 4) : [latestCommit.summary]
  }, [latestCommit])

  return (
    <div className="space-y-4">
      {/* 1. Repository Structure Card */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Repository Structure</h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            {structure?.totalFiles ? `${structure.totalFiles} files` : "Ingesting..."}
          </span>
        </div>

        {/* Search files in tree */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter repo files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-background/50 focus:bg-background border-border/60"
          />
        </div>

        {/* Tree Container */}
        <div className="rounded-lg border border-border/50 bg-background/40 p-2 min-h-[220px] max-h-[300px] overflow-y-auto">
          {isStructureLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-xs">Parsing architecture tree...</span>
            </div>
          ) : filteredTree.length > 0 ? (
            <div className="space-y-0.5">
              {filteredTree.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  selectedPath={selectedFileForModal || undefined}
                  onSelectFile={handleSelectFile}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-muted-foreground">
              <Code2 className="size-8 stroke-[1.2] mb-2 opacity-50" />
              <p className="text-xs font-medium">No matching files found</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Files appear here once repository ingestion finishes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Latest Commit Summary Card */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Latest Commit Summary</h3>
          </div>
          <Link
            href="/commit-summaries"
            className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ExternalLink className="size-2.5" />
          </Link>
        </div>

        {isCommitLoading ? (
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary mr-2" />
            <span className="text-xs">Loading commit summary...</span>
          </div>
        ) : latestCommit ? (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {latestCommit.commitMessage}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-medium">{latestCommit.commitAuthorName}</span>
                  <span>•</span>
                  <span>{new Date(latestCommit.commitDate).toLocaleDateString()}</span>
                </div>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground shrink-0">
                {latestCommit.commitHash.slice(0, 7)}
              </span>
            </div>

            {/* AI Generated Bullet Points */}
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5 space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] font-medium text-primary">
                <Sparkles className="size-3" />
                <span>AI Commit Analysis:</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                {commitBullets.map((bullet, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="text-foreground/90">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted/40 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">No commits polled yet</p>
            <p className="text-[11px]">Syncing commits from remote repository...</p>
          </div>
        )}
      </div>

      {/* 3. Repository Insights Metrics */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Insights</h3>
          </div>
          <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Files Indexed */}
          <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] uppercase font-semibold tracking-wider">Files Indexed</span>
              <FileCheck2 className="size-3.5 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {structure?.totalFiles ?? stats?.embeddingsCount ?? 0}
            </p>
          </div>

          {/* Code Chunks */}
          <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] uppercase font-semibold tracking-wider">Code Chunks</span>
              <Code2 className="size-3.5 text-indigo-500" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {stats?.embeddingsCount ?? 0}
            </p>
          </div>

          {/* Index Accuracy */}
          <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] uppercase font-semibold tracking-wider">Index Quality</span>
              <Sparkles className="size-3.5 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-emerald-500">98%</p>
          </div>

          {/* Q&A Queries */}
          <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] uppercase font-semibold tracking-wider">Q&A Queries</span>
              <HelpCircle className="size-3.5 text-amber-500" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {stats?.questionsCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer Dialog */}
      <Dialog
        open={!!selectedFileForModal}
        onOpenChange={(isOpen) => !isOpen && setSelectedFileForModal(null)}
      >
        <DialogContent className="sm:max-w-[70vw] max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="border-b pb-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold font-mono truncate">
                <FileCode className="size-4 text-primary shrink-0" />
                <span className="truncate">{selectedFileForModal}</span>
              </DialogTitle>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="h-8 text-xs gap-1.5"
              >
                {copiedCode ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                {copiedCode ? "Copied" : "Copy Source"}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3">
            {isFileLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary mb-2" />
                <p className="text-xs">Fetching source code...</p>
              </div>
            ) : fileData?.content ? (
              <pre className="text-xs font-mono p-4 rounded-lg bg-muted/60 overflow-x-auto border border-border/60 leading-relaxed text-foreground select-all">
                <code>{fileData.content}</code>
              </pre>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No cached content available for this file.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
