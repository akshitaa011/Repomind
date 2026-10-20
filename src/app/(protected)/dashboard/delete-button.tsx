"use client"

import { Loader2, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import useProject from '~/hooks/use-project'
import useRefetch from '~/hooks/use-refetch'
import { api } from '~/trpc/react'

const DeleteButton = () => {
  const deleteProject = api.project.deleteProject.useMutation()
  const utils = api.useUtils()
  const { projectId, project, projects, setProjectId } = useProject()
  const refetch = useRefetch()
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    if (!projectId) return

    deleteProject.mutate(
      { projectId },
      {
        onSuccess: async () => {
          toast.success("Project deleted successfully from database")
          setOpen(false)
          
          // Switch active workspace to next remaining project, or clear if none
          const remaining = (projects || []).filter((p) => p.id !== projectId)
          setProjectId(remaining[0]?.id || '')
          
          // Invalidate project caches across tRPC and React Query
          await utils.project.getProjects.invalidate()
          await utils.project.getProjectStats.invalidate()
          await refetch()
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete project")
        },
      }
    )
  }

  if (!projectId) return null

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-destructive flex items-center gap-2'>
              <Trash2 className='size-5' />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{project?.name || "this project"}</strong>? This will permanently remove all indexed files, vector embeddings, commits, and Q&A history from the database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0 mt-2'>
            <Button variant='outline' size='sm' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              size='sm'
              disabled={deleteProject.isPending}
              onClick={handleDelete}
              className='gap-1.5'
            >
              {deleteProject.isPending ? (
                <>
                  <Loader2 className='size-3.5 animate-spin' />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        size='sm'
        variant='ghost'
        onClick={() => setOpen(true)}
        className='h-8 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10'
        title="Delete project"
      >
        <Trash2 className='size-3.5' />
      </Button>
    </>
  )
}

export default DeleteButton
