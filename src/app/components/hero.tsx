import { Button } from "~/components/ui/button"
import { ArrowRight, Github, GitCommit, Code } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="w-full p-12 md:py-24 lg:py-32 xl:py-40">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary bg-primary/10 w-fit">
                Group CS077 • RepoMind
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Turning Unfamiliar Repositories Into Instant Understanding
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                RepoMind is an AI-powered platform that combines repository ingestion, semantic code indexing, source-grounded Q&amp;A, and automated commit summarization.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-in">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Explore Features</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-full w-full">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-xl dark:from-blue-900 dark:to-indigo-900 shadow-2xl">
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white/10 p-2">
                      <Github className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Repository Ingestion</h3>
                      <p className="text-sm text-white/80">Connect any GitHub repo for structure-aware parsing and code chunking.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white/10 p-2">
                      <Code className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Semantic AI Q&amp;A</h3>
                      <p className="text-sm text-white/80">Hybrid retrieval with source-grounded answers and file citations.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white/10 p-2">
                      <GitCommit className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Automated Commit Summaries</h3>
                      <p className="text-sm text-white/80">AI converts Git diffs into clear, understandable commit explanations.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
