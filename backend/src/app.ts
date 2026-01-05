import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { courseRoutes } from "./routes/courses";
import { lessonRoutes } from "./routes/lessons";
import { authRoutes } from "./routes/auth.routes";
import { PrismaClient } from "@prisma/client";
import { enrollmentRoutes } from "./routes/enrollment";
import { lessonCompletionRoutes } from "./routes/lessonsCompletions";

export const db = new PrismaClient();
export const app = new Elysia()

  .use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .get("/", () => ({ message: "E-Learning API Server" }))
  .use(authRoutes)
  .use(courseRoutes)
  .use(lessonRoutes)
  .use(enrollmentRoutes)
  .use(lessonCompletionRoutes)
  .listen(5001);
