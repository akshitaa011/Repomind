import ignore from "ignore";
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "~/server/db";

/**
 * Sanitizes GitHub Personal Access Tokens (ignoring placeholders and whitespace)
 */
export function sanitizeGithubToken(userToken?: string): string | undefined {
  if (userToken && userToken.trim() && !userToken.includes("your-github-pat") && userToken.trim() !== "undefined") {
    return userToken.trim();
  }
  const envToken = process.env.GITHUB_ACCESS_TOKEN;
  if (envToken && envToken.trim() && !envToken.includes("your-github-pat") && envToken.trim() !== "undefined") {
    return envToken.trim();
  }
  return undefined;
}

/**
 * Dynamically queries GitHub API for repository default branch (e.g. main vs master)
 */
export async function getDefaultBranch(repoUrl: string, token?: string): Promise<string> {
  try {
    const cleanUrl = repoUrl.replace(/\.git$/, "").replace(/\/$/, "");
    const parts = cleanUrl.split("/").filter(Boolean);
    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1];

    if (!owner || !repo) return "main";

    const validToken = sanitizeGithubToken(token);
    const headers: Record<string, string> = {
      "User-Agent": "RepoMind-App",
      "Accept": "application/vnd.github.v3+json",
    };
    if (validToken) {
      headers["Authorization"] = `token ${validToken}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.default_branch) {
        return data.default_branch;
      }
    }
  } catch (err) {
    console.warn("Could not determine default branch via API, will use fallback:", err);
  }
  return "main";
}

const MAX_FILE_CHARS = 200_000; // skip generated or data files larger than this

/**
 * Files that are not useful to store: dependencies, build output, lock files,
 * env files, project boilerplate docs, and binary or media files.
 * Written in .gitignore syntax.
 */
const IGNORED_PATTERNS = [
  // dependencies and build output
  "node_modules/", "dist/", "build/", "out/", ".next/", "coverage/",
  "vendor/", "target/", "__pycache__/", ".venv/", "venv/", ".git/",

  // env files
  ".env", ".env.*", "*.env",

  // lock files
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "*.lock",

  // boilerplate docs
  "README*", "LICENSE*", "CHANGELOG*", "CONTRIBUTING*", "CODE_OF_CONDUCT*",

  // misc generated or editor files
  ".gitignore", ".gitattributes", ".DS_Store", "*.log", "*.map",
  "*.min.js", "*.min.css", "*.tsbuildinfo",

  // images, fonts, archives, binaries
  "*.png", "*.jpg", "*.jpeg", "*.gif", "*.ico", "*.svg", "*.webp",
  "*.woff", "*.woff2", "*.ttf", "*.eot",
  "*.pdf", "*.zip", "*.tar", "*.gz", "*.mp3", "*.mp4",
  "*.exe", "*.dll", "*.class", "*.jar", "*.pyc",
];

const ignoreMatcher = ignore().add(IGNORED_PATTERNS);

function normalizeRepoUrl(repoUrl: string): string {
  return repoUrl.trim().replace(/\.git$/, "").replace(/\/+$/, "");
}

/**
 * Final safety filter. Applies the same rules after download, in case the loader missed any.
 */
function filterStorableFiles(docs: Document[]): Document[] {
  const kept = docs.filter((doc) => {
    const filePath = String(doc.metadata.source).replace(/^\.?\/+/, "");
    return !ignoreMatcher.ignores(filePath) && doc.pageContent.length <= MAX_FILE_CHARS;
  });
  console.log(`Kept ${kept.length} of ${docs.length} files after filtering`);
  return kept;
}

export const loadGithubRepo = async (rawRepoUrl: string, githubToken?: string) => {
  const repoUrl = normalizeRepoUrl(rawRepoUrl);
  const validToken = sanitizeGithubToken(githubToken);
  const detectedBranch = await getDefaultBranch(repoUrl, validToken);

  const baseConfig = {
    accessToken: validToken,
    branch: detectedBranch,
        ignorePaths: IGNORED_PATTERNS,
    // ignoreFiles: [
    //   "package-lock.json",
    //   "yarn.lock",
    //   "pnpm-lock.yaml",
    //   "bun.lockb",
    //   ".gitignore",
    //   ".env",
    //   ".env.example",
    //   ".env.local",
    //   "*.svg",
    //   "*.png",
    //   "*.jpg",
    //   "*.jpeg",
    //   "*.gif",
    //   "*.ico",
    //   "*.pdf",
    //   "*.zip",
    // ],
    recursive: true,
    unknown: "warn" as const,
    maxConcurrency: 3,
  };

  try {
    const loader = new GithubRepoLoader(repoUrl, baseConfig);
        return filterStorableFiles(await loader.load());
    //return await loader.load();
  } catch (err: any) {
    // If detected branch failed (e.g. was main but actual is master or vice versa), try alternate branch
    const alternateBranch = detectedBranch === "main" ? "master" : "main";
    console.warn(`Failed loading with branch '${detectedBranch}', attempting alternate '${alternateBranch}'...`);

    try {
      const fallbackLoader = new GithubRepoLoader(repoUrl, {
        ...baseConfig,
        branch: alternateBranch,
      });
            return filterStorableFiles(await fallbackLoader.load());
      //return await fallbackLoader.load();
    } catch (fallbackErr) {
      console.error(`Repository loading failed on both branches:`, err);
      throw err;
    }
  }
};

/**
 * Stores every downloaded file whole, exactly as it is in the repo.
 * Clears the project's previous files first, so re-running never creates duplicates.
 */
async function saveProjectFiles(projectId: string, docs: Document[]) {
  await db.projectFile.deleteMany({ where: { projectId } });

  await db.projectFile.createMany({
    data: docs.map((doc) => ({
      projectId,
      path: String(doc.metadata.source),
      content: doc.pageContent.replace(/\u0000/g, ""), // Postgres text cannot hold null bytes
    })),
    skipDuplicates: true,
  });
}

/**
 * Downloads a GitHub repo and stores every file whole in the database.
 */
export const storeGithubRepoFiles = async (
  projectId: string,
  repoUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(repoUrl, githubToken);

  if (docs.length === 0) {
    console.warn("No files found in repository.");
    return { fileCount: 0 };
  }

  await saveProjectFiles(projectId, docs);
  console.log(`Stored ${docs.length} complete files`);

  return { fileCount: docs.length };
};

/**
 * Smart chunking: Break large files into meaningful semantic segments
 */
function chunkDocument(doc: Document): Document[] {
  const content = doc.pageContent;
  const maxChunkSize = 2500; // characters

  if (content.length <= maxChunkSize) {
    return [doc];
  }

  const chunks: Document[] = [];
  const lines = content.split('\n');
  const semanticChunks = extractSemanticChunks(lines, maxChunkSize);

  semanticChunks.forEach((chunk, index) => {
    chunks.push(
      new Document({
        pageContent: chunk.content,
        metadata: {
          ...doc.metadata,
          chunkIndex: index,
          totalChunks: semanticChunks.length,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          chunkType: chunk.chunkType,
        },
      })
    );
  });

  return chunks.length > 0 ? chunks : [doc];
}

interface CodeChunk {
  content: string;
  startLine: number;
  endLine: number;
  chunkType: string;
}

function extractSemanticChunks(lines: string[], maxSize: number): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  let currentChunk: string[] = [];
  let startLine = 0;
  let braceCount = 0;
  let inFunction = false;

  lines.forEach((line, index) => {
    currentChunk.push(line);

    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceCount += openBraces - closeBraces;

    if (
      /^(export\s+)?(async\s+)?(function|class|const\s+\w+\s*=\s*(async\s+)?\(|interface|type)\s+\w+/.test(
        line.trim()
      )
    ) {
      inFunction = true;
    }

    const shouldEndChunk =
      currentChunk.join('\n').length > maxSize ||
      (inFunction && braceCount === 0 && currentChunk.length > 10) ||
      (line.trim() === '' && currentChunk.join('\n').length > maxSize * 0.7);

    if (shouldEndChunk) {
      const content = currentChunk.join('\n');
      if (content.trim().length > 40) {
        chunks.push({
          content,
          startLine,
          endLine: index,
          chunkType: inFunction ? 'function' : 'section',
        });
      }
      currentChunk = [];
      startLine = index + 1;
      inFunction = false;
    }
  });

  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join('\n'),
      startLine,
      endLine: lines.length - 1,
      chunkType: 'section',
    });
  }

  return chunks;
}

/**
 * Enhanced embedding generation with metadata and progress reporting
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



export const generateEmbeddings = async (docs: Document[]) => {
  console.log(`Generating embeddings for ${docs.length} documents...`);

  const allChunks: Document[] = [];
  docs.forEach((doc) => {
    const chunks = chunkDocument(doc);
    allChunks.push(...chunks);
  });

  console.log(`Created ${allChunks.length} semantic chunks from ${docs.length} documents`);

  // Process chunks sequentially or in small concurrency to avoid rate limits
  const results = [];
  for (let i = 0; i < allChunks.length; i++) {
    const doc = allChunks[i]!;
    try {
      const summary = await summariseCodeChunk(doc);
      const embedding = await generateEmbedding(summary);

      results.push({
        summary,
        embedding,
        sourceCode: doc.pageContent,
        fileName: doc.metadata.source || "unknown",
        chunkIndex: doc.metadata.chunkIndex || 0,
        chunkType: doc.metadata.chunkType || 'full',
      });

      await sleep(4000);

      if ((i + 1) % 5 === 0 || i === allChunks.length - 1) {
        console.log(`Embedded ${i + 1}/${allChunks.length} chunks`);
      }
    } catch (error) {
      console.error(`Error embedding chunk ${i} (${doc.metadata.source}):`, error);
    }
  }

  if (results.length === 0) {
  throw new Error("No embeddings were generated. Check GEMINI_API_KEY and Gemini rate limits.");
}

  return results;
};

async function summariseCodeChunk(doc: Document): Promise<string> {
  const isChunk = doc.metadata.chunkIndex !== undefined;
  const chunkInfo = isChunk
    ? `This is chunk ${doc.metadata.chunkIndex + 1} of ${doc.metadata.totalChunks} from ${doc.metadata.source}. `
    : '';

  try {
    const summary = await summariseCode(doc);
    return chunkInfo + summary;
  } catch (error) {
    return `${chunkInfo}Code section from ${doc.metadata.source}`;
  }
}

/**
 * Indexes repository source code and stores embeddings in PostgreSQL with pgvector(768)
 */
export const indexGithubRepo = async (
  projectId: string,
  repoUrl: string,
  githubToken?: string
) => {
  console.log(`Starting indexing for project ${projectId} (${repoUrl})`);

  try {
    // 1. Load files from GitHub
    const docs = await loadGithubRepo(repoUrl, githubToken);
    console.log(`Successfully fetched ${docs.length} files from repository`);

    if (docs.length === 0) {
      console.warn("No files found to index.");
      return { successCount: 0, errorCount: 0 };
    }

    // 1.1 Save raw files for repository architecture tree and file viewer
    try {
      await saveProjectFiles(projectId, docs);
      console.log(`Saved ${docs.length} files in db.projectFile for project ${projectId}`);
    } catch (saveErr) {
      console.warn("Could not save files to db.projectFile:", saveErr);
    }

    // 2. Generate embeddings
    const allEmbeddings = await generateEmbeddings(docs);
    console.log(`Successfully generated ${allEmbeddings.length} embeddings`);

    // 3. Save into PostgreSQL
    let successCount = 0;
    let errorCount = 0;

    for (const embedding of allEmbeddings) {
      if (!embedding || !embedding.embedding || embedding.embedding.length !== 768) {
        continue;
      }

      try {
        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
          data: {
            summary: embedding.summary,
            sourceCode: embedding.sourceCode,
            fileName: embedding.fileName,
            projectId,
          },
        });

        const vectorString = `[${embedding.embedding.join(",")}]`;

        await db.$executeRaw`
          UPDATE "SourceCodeEmbedding"
          SET "summaryEmbedding" = ${vectorString}::vector
          WHERE "id" = ${sourceCodeEmbedding.id}
        `;

        successCount++;
      } catch (insertError) {
        console.error(`Failed to save embedding for ${embedding.fileName}:`, insertError);
        errorCount++;
      }
    }

    console.log(`Indexing complete for project ${projectId}: ${successCount} saved, ${errorCount} errors`);
    return { successCount, errorCount };
  } catch (error) {
    console.error("Critical error in indexGithubRepo:", error);
    throw error;
  }
};

/**
 * Checks how many credits are needed to index a repository
 */
export const checkCredits = async (repoUrl: string, githubToken?: string) => {
  const docs = await loadGithubRepo(repoUrl, githubToken);

  let totalChunks = 0;
  docs.forEach((doc) => {
    const chunks = chunkDocument(doc);
    totalChunks += chunks.length;
  });

  console.log(`Repository requires approximately ${totalChunks} credits (${docs.length} files)`);
  return Math.max(1, totalChunks);
};