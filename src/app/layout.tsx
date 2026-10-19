import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "~/app/components/theme-provider";



export const metadata: Metadata = {
  title: "RepoMind",
  description: "AI-Powered Developer Collaboration & Repository Intelligence Platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidClerkKey = clerkKey && clerkKey.startsWith("pk_") && !clerkKey.includes("...");

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const content = (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster richColors/>
        </ThemeProvider>
      </body>
    </html>
  );

  if (!hasValidClerkKey) {
    return content;
  }

  return (
    <ClerkProvider publishableKey={clerkKey}>
      {content}
    </ClerkProvider>
  );
}
