# 🧠 RepoMind

<div align="center">
  <img src="public/brain-logo.svg" alt="RepoMind Brain Logo" width="90" height="90" />
  <h3>Turning Unfamiliar Repositories Into Instant Understanding</h3>
  <p>AI-Powered Code Intelligence, Semantic pgvector Indexing, Grounded RAG Q&A, and Automated Commit Summarization.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL pgvector" />
    <img src="https://img.shields.io/badge/Google_Gemini-2.0_Flash-8E75C2?style=for-the-badge&logo=googlegemini" alt="Google Gemini" />
    <img src="https://img.shields.io/badge/Better_Auth-Security-000000?style=for-the-badge" alt="Better Auth" />
    <img src="https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  </p>
</div>

---

## 📌 Project Overview

**RepoMind** is a full-stack code intelligence platform designed for developers, teams, and engineering students to understand unfamiliar repositories in minutes instead of days. 

When you connect a GitHub repository, RepoMind:
1. **Recursively ingests and filters code files** using structure-aware AST chunking.
2. **Generates 768-dimensional semantic embeddings** using Google Gemini.
3. **Indexes vector representations** inside PostgreSQL with the `pgvector` extension for sub-second cosine similarity search.
4. **Delivers grounded RAG answers** with verified file line citations and code previews.
5. **Generates automated commit summaries** from Git diffs using LLMs.
6. **Maintains a persistent team Knowledge Base** to save critical architectural findings and onboarding solutions.

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 15 App Router)"]
        UI["/qa Ask & Explore\n/dashboard\n/commit-summaries\n/knowledge-base"]
        Tree["Interactive Repository Architecture Tree"]
    end

    subgraph Server ["Backend Services (tRPC & Next.js Actions)"]
        Ingest["GitHub Loader\nRecursive Traversal"]
        Chunker["Structure-Aware Chunker\n2500 Char Semantic Slices"]
        GeminiEmbed["Gemini text-embedding-004\n(768 Dimensions)"]
        RAG["Hybrid Retrieval Engine\nVector <=> Search + Keyword Boost"]
        GeminiFlash["Gemini 2.0 Flash\nStreaming Synthesizer"]
        CommitSummarizer["Octokit Git Poller +\nDiff Summarizer"]
    end

    subgraph Storage ["PostgreSQL (Supabase) + pgvector"]
        DB_User["user / account / session"]
        DB_Files["ProjectFile (Raw AST Sources)"]
        DB_Vectors["SourceCodeEmbedding (vector(768))"]
        DB_Commits["Commit (AI Diff Summaries)"]
        DB_Questions["Question (Knowledge Base)"]
    end

    UI -->|"Submit GitHub URL"| Ingest
    Ingest --> Chunker
    Chunker --> DB_Files
    Chunker --> GeminiEmbed
    GeminiEmbed -->|"Store 768-D Vectors"| DB_Vectors

    UI -->|"Ask Question"| RAG
    RAG -->|"Cosine Similarity Query (<=>)"| DB_Vectors
    RAG --> GeminiFlash
    GeminiFlash -->|"Streamed Answer + Citations"| UI

    Ingest -->|"Poll Commits"| CommitSummarizer
    CommitSummarizer -->|"Store AI Summaries"| DB_Commits

    DB_Files -->|"Render Tree"| Tree
```

---

## ✨ Core Product Functions

### 1. 📁 Repository Ingestion & Architecture Tree
- Ingest any public or private GitHub repository URL.
- Cleans and filters non-code assets, lockfiles, and binaries.
- Automatically displays the **Repository Architecture Tree** on `/qa`, allowing developers to filter folders and inspect source files in a code viewer.

### 2. 🧠 Semantic Code Indexing (pgvector)
- Chunks source code files into semantic AST segments.
- Uses Gemini embeddings stored in 768-dimensional PostgreSQL `pgvector` columns for ultra-fast similarity matching.

### 3. 🔍 Grounded AI Q&A with Source Citations
- Natural-language technical queries (*e.g., "Where is authentication configured and how are routes protected?"*).
- Responses stream live with markdown styling, syntax-highlighted code snippets, and verified source citations (`app/layout.tsx L1-L25`).

### 4. 📝 Automated Commit Summaries (`/commit-summaries`)
- Converts complex Git commit diffs into readable, bulleted summaries.
- Shows what changed, architectural impact, and affected components with direct GitHub commit links.

### 5. 📚 Persistent Q/A Knowledge Base (`/knowledge-base`)
- Save critical answers directly from the Q&A stream to the team's shared knowledge base.
- Searchable archive of architectural explanations, onboarding notes, and troubleshooting solutions.

### 6. 💳 Usage & Billing (`/billing`)
- Transparent credit-based usage tracking.
- Test-mode payments powered by Razorpay with transaction logging.

### 7. 🔐 Authentication & Session Security
- Powered by **Better Auth** with Email/Password, GitHub OAuth, and Password Reset recovery flows.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router, Turbopack), React 18, Tailwind CSS, Lucide Icons |
| **Components** | shadcn/ui, Radix UI Primitives, Sonner Toasts |
| **API & Data** | tRPC v11, TanStack React Query, Server Actions |
| **AI / LLM** | Google Gemini 2.0 Flash (`@ai-sdk/google`), Gemini text-embedding-004 |
| **Database** | PostgreSQL with `pgvector(768)` extension, Prisma ORM 6 |
| **Authentication** | Better Auth (Local Credentials, GitHub OAuth, UUID Password Reset) |
| **Email** | Nodemailer (SMTP/Gmail) + Resend API integration + Local Dev Console |

---

## 📂 Project Directory Structure

```plaintext
Repomind/
├── public/
│   ├── brain-logo.svg             # Glowing RepoMind Neural-Brain Logo
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (auth)/                # Auth routes (/sign-in, /sign-up)
│   │   ├── (protected)/           # Authenticated application workspace
│   │   │   ├── app-sidebar.tsx    # Sidebar with Brain Logo & Navigation
│   │   │   ├── dashboard/         # Main workspace overview & health stats
│   │   │   ├── qa/                # Ask & Explore + Repository Architecture Tree
│   │   │   ├── commit-summaries/  # Automated commit diff summarization
│   │   │   ├── knowledge-base/    # Persistent Q&A repository knowledge
│   │   │   ├── billing/           # Credit management & Razorpay billing
│   │   │   └── create/            # Repository ingestion page
│   │   ├── forgot-password/       # Password reset request flow
│   │   ├── reset-password/        # Secure token password update
│   │   └── page.tsx               # Public landing page
│   ├── components/
│   │   ├── brain-logo.tsx         # Reusable stylized neural brain logo
│   │   └── ui/                    # shadcn/ui primitives
│   ├── lib/
│   │   ├── auth.ts                # Better Auth server configuration
│   │   ├── email.ts               # Resend / SMTP / Console email dispatcher
│   │   ├── gemini.ts              # Gemini AI summarization & embedding generation
│   │   └── github-loader.ts       # GitHub repository recursive ingestion & chunking
│   ├── server/
│   │   ├── api/routers/project.ts # tRPC procedures (Architecture tree, Q&A, Commits)
│   │   └── db.ts                  # Prisma Client database instance
│   └── prisma/
│       └── schema.prisma          # Database schema (pgvector, ProjectFile, Commit, etc.)
├── .env.example                   # Environment configuration template
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # TypeScript configuration
```

---

## 🚦 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v18.18 or higher (Node 20+ recommended)
- **PostgreSQL**: With `vector` extension enabled (e.g. Supabase, Neon, or local PostgreSQL)
- **Google Gemini API Key**: Free tier available from [Google AI Studio](https://aistudio.google.com/)

### 2. Clone and Install

```bash
git clone https://github.com/akshitaa011/Repomind.git
cd Repomind
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set the required environment keys in `.env`:

```env
DATABASE_URL="postgresql://postgres:password@host:5432/postgres"
BETTER_AUTH_SECRET="your-generated-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Push Database Schema & Generate Prisma Client

```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Quality Checks

Run code quality and linter checks:

```bash
npm run lint
```

---

## 👥 Contributors

- **Akshita** ([`@akshitaa011`](https://github.com/akshitaa011)) — Lead, Dashboard Architecture & Project Workspace
- **Nimisha** ([`@Nimishagoyal20`](https://github.com/Nimishagoyal20)) — Authentication Overhaul & Email Recovery
- **Rimmi** ([`@rimmijoshi22`](https://github.com/rimmijoshi22)) — Localhost Config & Developer Experience
- **Rimjhim** ([`@Rimjhim1609`](https://github.com/Rimjhim1609)) — Ingest File Persistence & Loader

---

<div align="center">
  <sub>RepoMind — Built for the Next Generation of Software Engineers.</sub>
</div>
