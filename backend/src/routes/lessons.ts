import { Elysia, t } from "elysia";
import { db } from "../app";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

export const lessonRoutes = new Elysia({ prefix: "/api/lessons" })

  .get(
    "/:courseId",
    async ({ params, set }) => {
      try {
        if (!isValidObjectId(params.courseId)) {
          set.status = 400;
          return { error: "Invalid Course ID format" };
        }

        const course = await db.course.findUnique({
          where: { id: params.courseId },
        });
        if (!course) {
          set.status = 404;
          return { error: "Course not found" };
        }

        const lessons = await db.lesson.findMany({
          where: { courseId: params.courseId },
          orderBy: { order: "asc" },
        });
        return lessons;
      } catch (e: any) {
        console.error("Get lessons error:", e);
        set.status = 500;
        return { error: "Failed to fetch lessons" };
      }
    },
    {
      params: t.Object({ courseId: t.String() }),
    }
  )

  .post(
    "/",
    async ({ body, headers, set }) => {
      try {
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

        if (decoded.role !== "INSTRUCTOR") {
          set.status = 403;
          return { error: "Unauthorized to add lessons to this course" };
        }

        if (!isValidObjectId(body.courseId)) {
          set.status = 400;
          return { error: "Invalid Course ID format" };
        }

        const course = await db.course.findUnique({
          where: { id: body.courseId },
        });
        if (!course || course.instructorId !== decoded.userId) {
          set.status = 403;
          return { error: "Unauthorized to add lessons to this course" };
        }

        const lastLesson = await db.lesson.findFirst({
          where: { courseId: body.courseId },
          orderBy: { order: "desc" },
        });

        const lesson = await db.lesson.create({
          data: {
            title: body.title,
            content: body.content,
            courseId: body.courseId,
            order: (lastLesson?.order || 0) + 1,
          },
        });
        return lesson;
      } catch (e: any) {
        console.error("Create lesson error:", e);
        set.status = 500;
        return { error: "Failed to create lesson" };
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        content: t.String({ minLength: 1 }),
        courseId: t.String(),
      }),
    }
  )

  .patch(
    "/:id",
    async ({ params, body, headers, set }) => {
      try {
        if (!isValidObjectId(params.id)) {
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

        if (decoded.role !== "INSTRUCTOR") {
          set.status = 403;
          return { error: "Only instructors can update lessons" };
        }

        const lesson = await db.lesson.findUnique({
          where: { id: params.id },
          include: { course: true },
        });

        if (!lesson) {
          set.status = 404;
          return { error: "Lesson not found" };
        }
        if (lesson.course.instructorId !== decoded.userId) {
          set.status = 403;
          return { error: "You can only update lessons in your own courses" };
        }

        const updatedLesson = await db.lesson.update({
          where: { id: params.id },
          data: {
            title: body.title,
            content: body.content,
            order: body.order,
          },
        });
        return updatedLesson;
      } catch (error: any) {
        console.error("Update lesson error:", error);
        set.status = 500;
        return { error: "Failed to update lesson" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        content: t.Optional(t.String({ minLength: 1 })),
        order: t.Optional(t.Number()),
      }),
    }
  )

  .delete(
    "/:id",
    async ({ params, headers, set }) => {
      try {
        if (!isValidObjectId(params.id)) {
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

        if (decoded.role !== "INSTRUCTOR") {
          set.status = 403;
          return { error: "Only instructors can delete lessons" };
        }

        const lesson = await db.lesson.findUnique({
          where: { id: params.id },
          include: { course: true },
        });

        if (!lesson) {
          set.status = 404;
          return { error: "Lesson not found" };
        }
        if (lesson.course.instructorId !== decoded.userId) {
          set.status = 403;
          return { error: "You can only delete lessons from your own courses" };
        }

        await db.lesson.delete({
          where: { id: params.id },
        });
        return { success: true, message: "Lesson deleted successfully" };
      } catch (error: any) {
        console.error("Delete lesson error:", error);
        set.status = 500;
        return { error: "Failed to delete lesson" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
    }
  );
