// src/app/(protected)/create/page.tsx
"use client"

import React, { Suspense, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { api } from '~/trpc/react'
import useRefetch from '~/hooks/use-refetch'
import { Info } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

type FormInput = {
  repoUrl: string
  projectName: string
  gitHubToken?: string
}

const CreateForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const repoParam = searchParams.get('repo')

  const { register, handleSubmit, reset } = useForm<FormInput>()
  const createProject = api.project.createProject.useMutation()
  const checkCredits = api.project.checkCredits.useMutation()
  const refetch = useRefetch()

  useEffect(() => {
    if (repoParam) {
      const parts = repoParam.split('/').filter(Boolean)
      const inferredName = parts[parts.length - 1] || 'My Repository'
      reset({
        repoUrl: repoParam,
        projectName: inferredName,
      })
    }
  }, [repoParam, reset])

  async function onSubmit(data: FormInput) {
    const { projectName, repoUrl, gitHubToken } = data

    if (checkCredits.data) {
      try {
        const newProject = await createProject.mutateAsync({
          name: projectName,
          repoUrl,
          gitHubToken,
        })

        if (newProject?.id && typeof window !== 'undefined') {
          window.localStorage.setItem('repomind-project-id', JSON.stringify(newProject.id))
        }

        toast.success("Repository linked! Code indexing in progress...")

        await new Promise((resolve) => setTimeout(resolve, 300))
        await refetch()
        router.push('/qa')
      } catch (error: any) {
        console.error("Error creating project:", error)
        toast.error(error?.message || "Failed to create project")
      }
    } else {
      try {
        await checkCredits.mutateAsync({
          githubUrl: repoUrl,
          githubToken: gitHubToken,
        })
      } catch (error: any) {
        console.error("Error checking credits:", error)
        toast.error(error?.message || "Failed to check credits")
      }
    }

    return true
  }

  const hasEnoughCredits = checkCredits?.data?.credits
    ? checkCredits.data.fileCount <= checkCredits.data.credits
    : true

  return (
    <div className='flex flex-col md:flex-row items-center justify-center h-full gap-10 py-6'>
      <img
        src={'https://cdni.iconscout.com/illustration/premium/thumb/coder-illustration-download-in-svg-png-gif-file-formats--programmer-developer-developing-programming-businex-colorful-pack-business-illustrations-2895977.png'}
        className='w-auto h-72 md:-ml-20'
        alt='Developer coding'
      />
      <div className='flex flex-col gap-4 max-w-md w-full'>
        <div>
          <h1 className='font-bold text-2xl tracking-tight'>
            Link your GitHub Repository
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Enter repository details to link your code and track commits.
          </p>
        </div>

        <div>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
            <Input
              {...register('projectName', { required: true })}
              placeholder='Project Name (e.g. repo-mind)'
              required
            />
            <Input
              {...register('repoUrl', { required: true })}
              type='url'
              placeholder='GitHub Repository URL (e.g. https://github.com/...)'
              required
            />

            {checkCredits.data && (
              <div className='bg-amber-500/10 px-4 py-3 rounded-lg border border-amber-500/30 text-amber-900 dark:text-amber-200'>
                <div className='flex items-center gap-2'>
                  <Info className='size-4 text-amber-600 shrink-0' />
                  <p className='text-xs'>
                    Estimated charge: <strong>{checkCredits.data?.fileCount}</strong> credits.
                  </p>
                </div>
                <p className='text-xs text-primary font-medium mt-1 ml-6'>
                  You have <strong>{checkCredits.data?.credits}</strong> credits available.
                </p>
              </div>
            )}

            <Input
              {...register('gitHubToken')}
              placeholder='GitHub personal access token (optional for private repos)'
            />

            <Button
              type='submit'
              className='w-full mt-2'
              disabled={createProject.isPending || checkCredits.isPending || !hasEnoughCredits}
            >
              {createProject.isPending
                ? "Indexing & Creating Project..."
                : checkCredits.data
                ? "Create Project"
                : "Check Repository Credits"}
            </Button>

            {!hasEnoughCredits && (
              <p className='text-xs text-destructive mt-1 font-medium'>
                Insufficient credits. Please top up your balance from the Billing page.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

const Create = () => {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center min-h-[50vh] text-sm text-muted-foreground'>
          Loading repository creator...
        </div>
      }
    >
      <CreateForm />
    </Suspense>
  )
}

export default Create