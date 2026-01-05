import { Elysia, t } from "elysia";
import { db } from "../app";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

export const enrollmentRoutes = new Elysia({ prefix: "/api/enroll" })

  .post(
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
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role !== "STUDENT") {
          set.status = 403;
          return { error: "Only students can enroll in courses" };
        }

        const userId = decoded.userId;
        const courseId = params.courseId;

        const courseCheck = await db.course.findUnique({
          where: { id: courseId },
        });
        if (!courseCheck) {
          set.status = 404;
          return { error: "Course not found" };
        }

        const existing = await db.enrollment.findUnique({
          where: {
            studentId_courseId: { studentId: userId, courseId },
          },
        });

        if (existing) {
          set.status = 409;
          return { error: "Already enrolled in this course" };
        }

        const enrollment = await db.enrollment.create({
          data: {
            studentId: userId,
            courseId: courseId,
          },
          include: {
            course: {
              include: {
                instructor: { select: { name: true } },
                _count: { select: { lessons: true } },
              },
            },
          },
        });

        return {
          success: true,
          enrollment,
          message: "Successfully enrolled in course",
        };
      } catch (error: any) {
        console.error("Enrollment error:", error);
        set.status = 500;
        return { error: "Failed to enroll in course" };
      }
    },
    {
      params: t.Object({ courseId: t.String() }),
    }
  )

  .get("/", async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "No token provided" };
      }

      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (decoded.role !== "STUDENT") {
        set.status = 403;
        return { error: "Only students can view enrollments" };
      }

      const userId = decoded.userId;

      const enrollments = await db.enrollment.findMany({
        where: { studentId: userId },
        include: {
          course: {
            include: {
              instructor: { select: { name: true } },
              lessons: true,
              _count: { select: { lessons: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const enrollmentsWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const totalLessons = enrollment.course.lessons?.length || 0;

          const completed = await db.lessonCompletion.count({
            where: {
              userId: userId,
              lesson: { courseId: enrollment.courseId },
            },
          });

          const courseData = enrollment.course;
          console.log(
            "Backend /api/enroll - Course ID returned:",
            courseData.id
          );

          return {
            id: enrollment.id,
            courseId: enrollment.courseId,
            studentId: enrollment.studentId,
            createdAt: enrollment.createdAt,
            course: {
              id: courseData.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              thumbnail: courseData.thumbnail,
              instructorId: courseData.instructorId,
              createdAt: courseData.createdAt,
              instructor: courseData.instructor,
              _count: courseData._count,
            },
            progress:
              totalLessons > 0
                ? Math.round((completed / totalLessons) * 100)
                : 0,
            completedLessons: completed,
            totalLessons: totalLessons,
          };
        })
      );

      return enrollmentsWithProgress;
    } catch (error: any) {
      console.error("Get enrollments error:", error);
      set.status = 500;
      return { error: "Failed to fetch enrollments" };
    }
  });
