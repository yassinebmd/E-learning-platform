import { Elysia, t } from "elysia";
import { db } from "../app";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

export const courseRoutes = new Elysia({ prefix: "/api/courses" })

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
          return { error: "Only instructors can create courses" };
        }

        const course = await db.course.create({
          data: {
            title: body.title,
            description: body.description,
            category: body.category,
            thumbnail: body.thumbnail || null,
            instructorId: decoded.userId,
          },
        });
        return course;
      } catch (error: any) {
        console.error("Create course error:", error);
        set.status = 500;
        return { error: "Failed to create course" };
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        category: t.String(),
        thumbnail: t.Optional(t.String()),
      }),
    }
  )

  .get("/", async ({ set }) => {
    try {
      const courses = await db.course.findMany({
        include: {
          instructor: { select: { name: true, email: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return courses;
    } catch (error: any) {
      console.error("Get all courses error:", error);
      set.status = 500;
      return { error: "Failed to fetch courses" };
    }
  })

  .get("/my", async ({ headers, set }) => {
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

      const courses = await db.course.findMany({
        where: { instructorId: decoded.userId },
        include: {
          _count: { select: { lessons: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return courses;
    } catch (error: any) {
      console.error("Get my courses error:", error);
      set.status = 500;
      return { error: "Failed to fetch courses" };
    }
  })

  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        if (!isValidObjectId(params.id)) {
          set.status = 400;
          return { error: "Invalid Course ID format" };
        }

        const course = await db.course.findUnique({
          where: { id: params.id },
          include: {
            instructor: { select: { id: true, name: true, email: true } },
            _count: { select: { lessons: true, enrollments: true } },
          },
        });
        if (!course) {
          set.status = 404;
          return { error: "Course not found" };
        }
        return course;
      } catch (error: any) {
        console.error("Get course by ID error:", error);
        set.status = 500;
        return { error: "Failed to fetch course" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )

  .patch(
    "/:id",
    async ({ params, body, headers, set }) => {
      try {
        if (!isValidObjectId(params.id)) {
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

        if (decoded.role !== "INSTRUCTOR") {
          set.status = 403;
          return { error: "Only instructors can update courses" };
        }

        const course = await db.course.findUnique({ where: { id: params.id } });
        if (!course) {
          set.status = 404;
          return { error: "Course not found" };
        }

        if (course.instructorId !== decoded.userId) {
          set.status = 403;
          return { error: "You can only update your own courses" };
        }

        const updatedCourse = await db.course.update({
          where: { id: params.id },
          data: body,
        });
        return updatedCourse;
      } catch (error: any) {
        console.error("Update course error:", error);
        set.status = 500;
        return { error: "Failed to update course" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String({ minLength: 1 })),
        category: t.Optional(t.String()),
        thumbnail: t.Optional(t.String()),
      }),
    }
  )

  .delete(
    "/:id",
    async ({ params, headers, set }) => {
      try {
        if (!isValidObjectId(params.id)) {
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

        if (decoded.role !== "INSTRUCTOR") {
          set.status = 403;
          return { error: "Only instructors can delete courses" };
        }

        const course = await db.course.findUnique({ where: { id: params.id } });
        if (!course) {
          set.status = 404;
          return { error: "Course not found" };
        }

        if (course.instructorId !== decoded.userId) {
          set.status = 403;
          return { error: "You can only delete your own courses" };
        }

        await db.course.delete({ where: { id: params.id } });
        return { success: true, message: "Course deleted successfully" };
      } catch (error: any) {
        console.error("Delete course error:", error);
        set.status = 500;
        return { error: "Failed to delete course" };
      }
    },
    {
      params: t.Object({ id: t.String() }),
    }
  );
