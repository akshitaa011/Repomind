

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "~/lib/github";
import { checkCredits, indexGithubRepo } from "~/lib/github-loader";
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

            // Deduct credits immediately
            await ctx.db.user.update({
                where:{id: ctx.user.userId!}, 
                data:{credits: { decrement: fileCount}}
            });

            // Start background tasks (don't await these)
            Promise.all([
                pollCommits(project.id),
                indexGithubRepo(project.id, repoUrl, gitHubToken)
            ]).catch(error => {
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
        projectId: z.string().optional().default(""),
    }).optional()).query(async ({ctx, input}) => {
        const projectId = input?.projectId || "";
        if (!projectId) return [];

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
    projectId: z.string().optional().default(""),
}).optional()).query(async ({ctx, input}) => {
    try {
        const projectId = input?.projectId || "";
        if (!projectId) {
            return [];
        }

        // Check if project exists
        const project = await ctx.db.project.findUnique({
            where: { id: projectId },
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
            where: { projectId },
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
        projectId: z.string().optional().default(""),
    }).optional()).query(async ({ ctx, input }) => {
        const projectId = input?.projectId || "";
        if (!projectId) {
            return {
                embeddingsCount: 0,
                commitsCount: 0,
                questionsCount: 0,
            };
        }
        const [embeddingsCount, commitsCount, questionsCount] = await Promise.all([
            ctx.db.sourceCodeEmbedding.count({ where: { projectId } }),
            ctx.db.commit.count({ where: { projectId } }),
            ctx.db.question.count({ where: { projectId } }),
        ]);
        return {
            embeddingsCount,
            commitsCount,
            questionsCount,
        };
    }),

    // --- Architecture & Repository Structure ---
    getProjectStructure: protectedProcedure.input(z.object({
        projectId: z.string().optional().default(""),
    }).optional()).query(async ({ ctx, input }) => {
        const projectId = input?.projectId || "";
        if (!projectId) {
            return {
                tree: [],
                totalFiles: 0,
            };
        }
        // 1. Fetch paths from projectFile
        const files = await ctx.db.projectFile.findMany({
            where: { projectId },
            select: { path: true },
            orderBy: { path: 'asc' },
        });

        let filePaths = files.map((f: { path: string }) => f.path);

        // 2. Fallback to SourceCodeEmbedding if projectFile is not yet populated
        if (filePaths.length === 0) {
            const embeddings = await ctx.db.sourceCodeEmbedding.findMany({
                where: { projectId },
                select: { fileName: true },
                distinct: ['fileName'],
                orderBy: { fileName: 'asc' },
            });
            filePaths = embeddings.map(e => e.fileName);
        }

        // Clean paths
        filePaths = filePaths.map((p: string) => p.replace(/^\.?\/+/, ''));

        // Build hierarchical tree
        interface FileTreeNode {
            id: string;
            name: string;
            path: string;
            type: "file" | "folder";
            children?: FileTreeNode[];
            extension?: string;
        }

        const root: FileTreeNode[] = [];

        for (const rawPath of filePaths) {
            const parts = rawPath.split('/').filter(Boolean);
            let currentLevel = root;
            let accumulatedPath = '';

            parts.forEach((part: string, index: number) => {
                accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
                const isFile = index === parts.length - 1;

                let existingNode = currentLevel.find(node => node.name === part);

                if (!existingNode) {
                    const ext = isFile ? part.split('.').pop() : undefined;
                    existingNode = {
                        id: accumulatedPath,
                        name: part,
                        path: accumulatedPath,
                        type: isFile ? "file" : "folder",
                        extension: ext,
                        children: isFile ? undefined : [],
                    };
                    currentLevel.push(existingNode);
                }

                if (!isFile && existingNode.children) {
                    currentLevel = existingNode.children;
                }
            });
        }

        function sortNodes(nodes: FileTreeNode[]) {
            nodes.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === "folder" ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
            for (const node of nodes) {
                if (node.children) {
                    sortNodes(node.children);
                }
            }
        }

        sortNodes(root);

        // Calculate extensions distribution
        const extensionsMap: Record<string, number> = {};
        for (const p of filePaths) {
            const ext = p.split('.').pop()?.toLowerCase();
            if (ext && ext.length < 8) {
                extensionsMap[ext] = (extensionsMap[ext] || 0) + 1;
            }
        }

        return {
            totalFiles: filePaths.length,
            fileTree: root,
            filePaths,
            extensions: extensionsMap,
        };
    }),

    getFileContent: protectedProcedure.input(z.object({
        projectId: z.string(),
        path: z.string(),
    })).query(async ({ ctx, input }) => {
        // 1. Check projectFile
        const file = await ctx.db.projectFile.findFirst({
            where: {
                projectId: input.projectId,
                OR: [
                    { path: input.path },
                    { path: `/${input.path}` },
                    { path: `./${input.path}` },
                ],
            },
        });

        if (file) {
            return {
                path: file.path,
                content: file.content,
                source: "file",
            };
        }

        // 2. Check sourceCodeEmbedding
        const embedding = await ctx.db.sourceCodeEmbedding.findFirst({
            where: {
                projectId: input.projectId,
                OR: [
                    { fileName: input.path },
                    { fileName: `/${input.path}` },
                    { fileName: `./${input.path}` },
                ],
            },
        });

        if (embedding) {
            return {
                path: embedding.fileName,
                content: embedding.sourceCode,
                summary: embedding.summary,
                source: "embedding",
            };
        }

        return {
            path: input.path,
            content: "// File content not currently cached. Ingest repository to inspect full source.",
            source: "placeholder",
        };
    }),

    getLatestCommitSummary: protectedProcedure.input(z.object({
        projectId: z.string().optional().default(""),
    }).optional()).query(async ({ ctx, input }) => {
        const projectId = input?.projectId || "";
        if (!projectId) return null;
        const latestCommit = await ctx.db.commit.findFirst({
            where: { projectId },
            orderBy: { commitDate: 'desc' },
        });

        return latestCommit;
    }),

    getAllCommitSummaries: protectedProcedure.input(z.object({
        projectId: z.string().optional().default(""),
    }).optional()).query(async ({ ctx, input }) => {
        const projectId = input?.projectId || "";
        if (!projectId) return [];
        const commits = await ctx.db.commit.findMany({
            where: { projectId },
            orderBy: { commitDate: 'desc' },
        });

        return commits;
    }),

    syncProjectCommits: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).mutation(async ({ input }) => {
        try {
            await pollCommits(input.projectId);
            return { success: true };
        } catch (error: any) {
            console.error("Error polling commits in syncProjectCommits:", error);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error?.message || 'Failed to sync commits',
            });
        }
    }),

    deleteQuestion: protectedProcedure.input(z.object({
        questionId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        return await ctx.db.question.delete({
            where: { id: input.questionId },
        });
    }),
});
