"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
  GitCommit,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Activity,
  HelpCircle,
  Info,
} from 'lucide-react'
import useProject from '~/hooks/use-project'
import { api } from '~/trpc/react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'

const RepoHealthCard = () => {
  const { project, projectId } = useProject()
  const { data: commits, isLoading } = api.project.getCommits.useQuery(
    { projectId },
    { enabled: !!projectId }
  )

  const totalCommits = commits?.length || 0
  const recentCommits =
    commits?.filter((c) => {
      const commitDate = new Date(c.commitDate)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return commitDate > weekAgo
    }).length || 0

  const lastCommitDate = commits?.[0]?.commitDate
  const daysSinceLastCommit = lastCommitDate
    ? Math.floor((Date.now() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const calculateHealthScore = () => {
    if (totalCommits === 0) return 60
    let score = 70

    if (recentCommits > 5) score += 20
    else if (recentCommits > 2) score += 10
    else if (recentCommits > 0) score += 5

    if (daysSinceLastCommit > 30) score -= 20
    else if (daysSinceLastCommit > 14) score -= 10
    else if (daysSinceLastCommit > 7) score -= 5

    return Math.max(10, Math.min(100, score))
  }

  const healthScore = calculateHealthScore()

  const getHealthStatus = () => {
    if (healthScore >= 80)
      return {
        label: 'Optimal',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20',
        strokeColor: '#10b981',
        icon: CheckCircle2,
      }
    if (healthScore >= 60)
      return {
        label: 'Healthy',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/20',
        strokeColor: '#3b82f6',
        icon: TrendingUp,
      }
    if (healthScore >= 40)
      return {
        label: 'Moderate',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/20',
        strokeColor: '#f59e0b',
        icon: AlertCircle,
      }
    return {
      label: 'Stale',
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      strokeColor: '#f43f5e',
      icon: AlertCircle,
    }
  }

  const status = getHealthStatus()
  const StatusIcon = status.icon

  if (!project) {
    return (
      <Card className='col-span-2 border border-border/70 flex flex-col items-center justify-center p-6 text-center text-muted-foreground'>
        <Activity className='size-8 text-muted-foreground/40 mb-2' />
        <p className='text-sm'>Select or link a repository to view repository vitals</p>
      </Card>
    )
  }

  return (
    <Card className='col-span-2 border border-border/80 shadow-sm bg-gradient-to-b from-card to-card/60 flex flex-col justify-between'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-1.5'>
              <CardTitle className='text-base font-semibold flex items-center gap-2'>
                <div className='size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
                  <Activity className='size-4' />
                </div>
                Repository Vitals
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type='button' className='text-muted-foreground/60 hover:text-foreground transition-colors cursor-help p-0.5' aria-label='About health score'>
                      <HelpCircle className='size-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='top' className='max-w-xs p-3 text-xs space-y-1.5 bg-card/95 backdrop-blur border border-border shadow-lg text-foreground'>
                    <p className='font-semibold flex items-center gap-1.5 text-primary'>
                      <Info className='size-3.5' />
                      Repository Health Score
                    </p>
                    <p className='text-muted-foreground leading-relaxed'>
                      Measures codebase maintenance freshness and recent commit cadence from GitHub.
                    </p>
                    <div className='pt-1 text-[11px] space-y-1 border-t border-border/50 text-muted-foreground'>
                      <p>• <strong>80–100% (Optimal)</strong>: Active weekly commits</p>
                      <p>• <strong>60–79% (Healthy)</strong>: Regular maintenance</p>
                      <p>• <strong>40–59% (Moderate)</strong>: Stable / completed code</p>
                      <p>• <strong>&lt;40% (Stale)</strong>: Inactive for months</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription className='text-xs mt-0.5'>
              {project.name} • Activity & Cadence
            </CardDescription>
          </div>
          <Badge
            variant='outline'
            className={`${status.bgColor} ${status.color} border px-2.5 py-0.5 text-xs font-medium`}
          >
            <StatusIcon className='size-3 mr-1' />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-4 pt-1'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex-1 space-y-2.5'>
            {/* Total Commits */}
            <div className='flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 border border-border/40'>
              <div className='size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0'>
                <GitCommit className='size-4 text-primary' />
              </div>
              <div>
                <p className='text-lg font-bold leading-tight'>{isLoading ? "..." : totalCommits}</p>
                <p className='text-[10px] text-muted-foreground font-medium uppercase tracking-wider'>
                  Indexed Commits
                </p>
              </div>
            </div>

            {/* Recent Commits */}
            <div className='flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 border border-border/40'>
              <div className='size-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0'>
                <TrendingUp className='size-4 text-emerald-600 dark:text-emerald-400' />
              </div>
              <div>
                <p className='text-lg font-bold leading-tight'>{isLoading ? "..." : recentCommits}</p>
                <p className='text-[10px] text-muted-foreground font-medium uppercase tracking-wider'>
                  Last 7 Days
                </p>
              </div>
            </div>
          </div>

          {/* Health Gauge */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='size-24 shrink-0 flex items-center justify-center cursor-help' title='Activity Breakdown'>
                  <CircularProgressbar
                    value={healthScore}
                    text={`${healthScore}%`}
                    styles={buildStyles({
                      textSize: '22px',
                      pathColor: status.strokeColor,
                      textColor: status.strokeColor,
                      trailColor: 'rgba(150, 150, 150, 0.15)',
                    })}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side='left' className='text-xs p-2.5 space-y-1 bg-card/95 backdrop-blur border border-border shadow-lg text-foreground max-w-[220px]'>
                <p className='font-semibold text-primary'>{status.label} Activity ({healthScore}%)</p>
                <p className='text-[11px] text-muted-foreground'>
                  {recentCommits > 0 ? `+${recentCommits * 5}% from recent commits` : '0 commits in past 7 days'}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  {daysSinceLastCommit > 30 ? '-20% dormant (>30 days)' : daysSinceLastCommit > 14 ? '-10% dormant (>14 days)' : 'Recently active'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Last Activity Footer */}
        <div className='pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground'>
          <div className='flex items-center gap-1.5'>
            <Calendar className='size-3.5 text-muted-foreground/70' />
            <span>Latest Push</span>
          </div>
          <span className='font-medium text-foreground'>
            {totalCommits === 0
              ? 'No commits yet'
              : daysSinceLastCommit === 0
              ? 'Today'
              : daysSinceLastCommit === 1
              ? 'Yesterday'
              : `${daysSinceLastCommit} days ago`}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default RepoHealthCard