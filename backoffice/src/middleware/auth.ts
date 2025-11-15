// middleware/auth.ts
import { db } from "../app";
import type { Context } from "elysia";

type AuthContext = Context & {
  cookie: {
    auth: {
      value: string;
    };
  };
  jwt: {
    verify: (
      token: string
    ) => Promise<false | { userId: string; role: "STUDENT" | "INSTRUCTOR" }>;
  };
  set: {
    status: number;
  };
};

export const authGuardConfig = {
  derive: async ({ cookie, jwt, set }: AuthContext) => {
    if (!cookie?.auth?.value) {
      set.status = 401;
      throw new Error("Unauthorized: No auth cookie");
    }

    const profile = await jwt.verify(cookie.auth.value);
    if (!profile || !profile.userId) {
      set.status = 401;
      throw new Error("Unauthorized: Invalid token");
    }

    try {
      const user = await db.user.findUnique({
        where: { id: profile.userId },
      });

      if (!user) {
        set.status = 401;
        throw new Error("Unauthorized: User not found");
      }

      const { password, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    } catch (error) {
      set.status = 500;
      throw new Error("Internal server error");
    }
  },
};
