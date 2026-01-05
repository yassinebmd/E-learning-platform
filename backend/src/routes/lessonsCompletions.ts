import { Elysia, t } from "elysia";
import { db } from "../app";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

export const lessonCompletionRoutes = new Elysia({
  prefix: "/api/lesson-completion",
})

  .post(
    "/:lessonId",
    async ({ params, headers, set }) => {
      try {
        if (!isValidObjectId(params.lessonId)) {
          set.status = 400;
          return { error: "Invalid Lesson ID format" };
        }

        const authHeader = headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "No token provided" };
        }
        const token = authHeader.slice(7);
        let decoded: any;
        try {
          decoded = jwt.verify(token, JWT_SECRET);
        } catch {
          set.status = 401;
          return { error: "Invalid token" };
        }

        if (decoded.role !== "STUDENT") {
          set.status = 403;
          return { error: "Only students can mark lessons as complete" };
        }

        const userId = decoded.userId;
        const lessonId = params.lessonId;

        const lesson = await db.lesson.findUnique({
          where: { id: lessonId },
          select: { courseId: true },
        });

        if (!lesson) {
          set.status = 404;
          return { error: "Lesson not found" };
        }

        const enrollment = await db.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: userId,
              courseId: lesson.courseId,
            },
          },
        });

        if (!enrollment) {
          set.status = 403;
          return { error: "Not enrolled in this course" };
        }

        const existingCompletion = await db.lessonCompletion.findUnique({
          where: {
            userId_lessonId_enrollmentId: {
              userId: userId,
              lessonId: lessonId,
              enrollmentId: enrollment.id,
            },
          },
        });

        if (existingCompletion) {
          return existingCompletion;
        }

        const lessonCompletion = await db.lessonCompletion.create({
          data: {
            userId: userId,
            lessonId: lessonId,
            enrollmentId: enrollment.id,
          },
        });

        return lessonCompletion;
      } catch (error: any) {
        console.error("Mark lesson complete error:", error);
        set.status = 500;
        return { error: "Failed to mark lesson as complete" };
      }
    },
    {
      params: t.Object({ lessonId: t.String() }),
    }
  )

  .get(
    "/:courseId",
    async ({ params, headers, set }) => {
      try {
        if (!isValidObjectId(params.courseId)) {
          set.status = 400;
          return { error: "Invalid Course ID format" };
        }

        const authHeader = headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "No token provided" };
        }
        const token = authHeader.slice(7);
        let decoded: any;
        try {
          decoded = jwt.verify(token, JWT_SECRET);
        } catch {
          set.status = 401;
          return { error: "Invalid token" };
        }

        if (decoded.role !== "STUDENT") {
          set.status = 403;
          return { error: "Only students can view lesson completions" };
        }

        const userId = decoded.userId;
        const courseId = params.courseId;

        const completedLessons = await db.lessonCompletion.findMany({
          where: {
            userId: userId,
            lesson: {
              courseId: courseId,
            },
          },
          select: {
            lessonId: true,
          },
        });

        return completedLessons.map((lc) => lc.lessonId);
      } catch (error: any) {
        console.error("Get completed lessons error:", error);
        set.status = 500;
        return { error: "Failed to fetch completed lessons" };
      }
    },
    {
      params: t.Object({ courseId: t.String() }),
    }
  );
