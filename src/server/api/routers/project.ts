

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "~/lib/github";
import { checkCredits, storeGithubRepoFiles } from "~/lib/github-loader";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({

    createProject: protectedProcedure.input(z.object({
        name: z.string(),
        repoUrl: z.string(),
        gitHubToken: z.string().optional(),
    })).mutation(async ({ctx, input}) => {

        try {
            const {name, repoUrl, gitHubToken}= input;

            // Check if user exists
            const user = await ctx.db.user.findUnique({
                where:{
                    id: ctx.user.userId!
                },
                select:{
                    credits: true
                }
            });

            if(!user){
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User not found'
                });
            }

            const currentCredit = user.credits || 0;
            
            // Check credits needed
            let fileCount = 1;
            try {
                fileCount = await checkCredits(repoUrl, gitHubToken);
            } catch (err: any) {
                console.warn("Could not calculate exact file count, using fallback 1:", err?.message);
            }
            
            if (fileCount > currentCredit) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Insufficient credits. Need ${fileCount} credits but you have ${currentCredit}.`
                });
            }

            // Create project
            const project = await ctx.db.project.create({
                data: {
                    name,
                    repoUrl,
                    gitHubToken: gitHubToken?.trim() || null,
                    userToProjects:{
                        create:{
                            userId: ctx.user.userId!,
                        }
                    }
                },
            });

            // Store the repo's filtered files whole. If this fails, remove the empty project.
            try {
                await storeGithubRepoFiles(project.id, repoUrl, gitHubToken);
            } catch (storeError) {
                await ctx.db.project.delete({ where: { id: project.id } });
                throw storeError;
            }

            // Deduct credits only after the files are stored
            await ctx.db.user.update({
                where:{id: ctx.user.userId!}, 
                data:{credits: { decrement: fileCount}}
            });

            // Start background task (don't await): commit history
            pollCommits(project.id).catch(error => {
                console.error('Background processing error:', error);
            });

            return project;
        } catch (error: any) {
            console.error('Error in createProject:', error);
            
            if (error instanceof TRPCError) {
                throw error;
            }
            
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error?.message || 'Failed to create project'
            });
        }
    }),

    getProjects: protectedProcedure.query(async ({ctx}) => {
        return await ctx.db.project.findMany({
            where: {
                userToProjects: {some: {userId: ctx.user.userId!}},
                deletedAt: null,
            },
        });
    }),
    getCommits: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).query(async ({ctx, input}) => {
        const {projectId} = input;

        console.log(`polling commits for project ${projectId}`);

        pollCommits(projectId)
            .then(() => {
                console.log(`Successfully polled commits for project ${projectId}`);
            })
            .catch((error) => {
                console.error(`Error polling commits for project ${projectId}`, error);
            });

        return await ctx.db.commit.findMany({
            where: {projectId},
        });
    }),

    saveAnswer: protectedProcedure.input(z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        filesRefrences:z.any()
    })).mutation(async ({ctx, input}) => {
        return await ctx.db.question.create({
            data:{
                answer: input.answer,
                filesRefrences:input.filesRefrences,
                projectId: input.projectId,
                question: input.question,
                userId: ctx.user.userId!,
            }
        })
    }),
    
// Add this to your existing project router
// File: src/server/api/routers/project.ts

// Replace the getQuestions procedure with this improved version:

getQuestions: protectedProcedure.input(z.object({
    projectId: z.string(),
})).query(async ({ctx, input}) => {
    try {
        // Validate projectId
        if (!input.projectId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Project ID is required'
            });
        }

        // Check if project exists
        const project = await ctx.db.project.findUnique({
            where: { id: input.projectId },
            select: { id: true }
        });

        if (!project) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Project not found'
            });
        }

        // Fetch questions
        const questions = await ctx.db.question.findMany({
            where: { projectId: input.projectId },
            include: {
                user: {
                    select: {
                        id: true,
                        imageUrl: true,
                        firstName: true,
                        lastName: true,
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return questions;
    } catch (error) {
        console.error('Error fetching questions:', error);
        
        // Re-throw TRPC errors
        if (error instanceof TRPCError) {
            throw error;
        }
        
        // Wrap other errors
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch questions',
            cause: error
        });
    }
}),

    uploadMeeting: protectedProcedure.input(z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string(),
    })).mutation(async ({ctx, input}) => {
        const meeting = await ctx.db.meeting.create({
            data:{
                meetingUrl: input.meetingUrl,
                name: input.name,
                projectId: input.projectId,
                status: 'PROCESSING',
            }
        })
        return meeting
    }),

    getMeetings: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).query(async ({ctx, input}) => {
        return await ctx.db.meeting.findMany({
            where: {projectId: input.projectId},
            include:{
                issues: true,
            }
        });
    }),
    
    deleteMeeting: protectedProcedure.input(z.object({
        meetingId: z.string(),
    })).mutation(async ({ctx, input}) => {
        return await ctx.db.meeting.delete({
            where: {id: input.meetingId},
        });
    }),

    getMeetingById: protectedProcedure.input(z.object({
        meetingId: z.string(),
    })).query(async ({ctx, input}) => {
        return await ctx.db.meeting.findUnique({
            where: {id: input.meetingId},
            include:{
                issues: true,
            }
        });
    }),

    deleteProject: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).mutation(async ({ctx, input}) => {
        return await ctx.db.project.delete({
            where: {id: input.projectId},
        });
    }),

    getTeamMembers: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).query(async ({ctx, input}) => {
        return await ctx.db.userToProject.findMany({
            where:{
                projectId: input.projectId
            },
            include:{
                user: true
            }
        })
    }),

    getMyCredits: protectedProcedure.query(async ({ctx}) => {
        return await ctx.db.user.findUnique({
            where: {
                id: ctx.user.userId!,
            },
            select:{
                credits: true
            }
        });
    }),

    checkCredits: protectedProcedure
      .input(
        z.object({
          githubUrl: z.string(),
          githubToken: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        let fileCount = 1;
        try {
          fileCount = await checkCredits(input.githubUrl, input.githubToken);
        } catch (err: any) {
          console.error("Error fetching repo files:", err?.message || err);

          if (err?.message?.includes("401") || err?.response?.status === 401) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid GitHub token. Please check credentials or leave blank for public repositories.",
            });
          }
          if (err?.message?.includes("404") || err?.response?.status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Repository not found. Please double-check the GitHub URL.",
            });
          }
          if (err?.response?.status === 403 || err?.message?.includes("rate limit")) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "GitHub API rate limit exceeded. Provide a personal access token for higher limits.",
            });
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: err?.message || "Unable to fetch repository files.",
          });
        }

        const userCredits = await ctx.db.user.findUnique({
          where: { id: ctx.user.userId! },
          select: { credits: true },
        });

        return {
          fileCount,
          credits: userCredits?.credits ?? 500,
        };
      }),


    getPurchaseHistory: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.stripeTransaction.findMany({
            where: { userId: ctx.user.userId! },
            orderBy: { createdAt: 'desc' },
        });
    }),

    getProjectStats: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).query(async ({ ctx, input }) => {
        const [embeddingsCount, commitsCount, questionsCount] = await Promise.all([
            ctx.db.sourceCodeEmbedding.count({ where: { projectId: input.projectId } }),
            ctx.db.commit.count({ where: { projectId: input.projectId } }),
            ctx.db.question.count({ where: { projectId: input.projectId } }),
        ]);
        return {
            embeddingsCount,
            commitsCount,
            questionsCount,
        };
    }),

});
