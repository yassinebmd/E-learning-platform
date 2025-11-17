import jwt from "jsonwebtoken";
import { db } from "../app";
import type { Context } from "elysia";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

type AuthContext = Context & {
  cookie: {
    auth?: {
      value: string;
    };
  };
  set: {
    status: number;
  };
};

export const authGuardConfig = {
  derive: async ({ cookie, set }: AuthContext) => {
    const token = cookie?.auth?.value;

    if (!token) {
      set.status = 401;
      throw new Error("Unauthorized: No auth cookie");
    }

    let payload: { userId: string; role: "STUDENT" | "INSTRUCTOR" };

    try {
      payload = jwt.verify(token, JWT_SECRET) as typeof payload;
    } catch {
      set.status = 401;
      throw new Error("Unauthorized: Invalid token");
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized: User not found");
    }

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  },
};