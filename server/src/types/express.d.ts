import type { publicUser } from "../lib/serializers.ts";

type PublicUser = ReturnType<typeof publicUser>;

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
