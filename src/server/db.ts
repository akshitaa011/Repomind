import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

let prismaInstance: any;

try {
  const createPrismaClient = () =>
    new PrismaClient({
      log:
        env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

  const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
  };

  prismaInstance = globalForPrisma.prisma ?? createPrismaClient();
  if (env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
} catch {
  // Graceful fallback for frontend-only mode when Prisma is not connected
  prismaInstance = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === '$queryRaw') return async () => [];
      return new Proxy({}, {
        get: () => async () => null
      });
    }
  });
}

export const db = prismaInstance;
