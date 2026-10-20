import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "~/app/components/theme-provider";

export const metadata: Metadata = {
  title: "RepoMind",
  description: "AI-Powered Developer Collaboration & Repository Intelligence Platform",
  icons: [{ rel: "icon", url: "/brain-logo.svg" }, { rel: "shortcut icon", url: "/brain-logo.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
