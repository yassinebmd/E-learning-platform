import { Elysia } from "elysia";
import { verifyToken } from "../utils/jwt";
import { db } from "../app";

export const authMiddleware = (app: Elysia) => {
  return app.derive(async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { user: null };
      }

      const token = authHeader.slice(7);

      if (!token) {
        return { user: null };
      }

      const payload = verifyToken(token);
      if (!payload) {
        return { user: null };
      }

      const user = await db.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        return { user: null };
      }

      return {
        user: {
          userId: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      console.error("Auth middleware error:", error);
      return { user: null };
    }
  });
};
