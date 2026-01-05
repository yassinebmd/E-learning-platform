import { Elysia, t } from "elysia";
import { db } from "../app";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 20;

export const authRoutes = new Elysia({ prefix: "/api/auth" })

  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const { email, password, name, role = "STUDENT" } = body;

        if (role !== "STUDENT" && role !== "INSTRUCTOR") {
          set.status = 400;
          return { error: "Invalid role. Must be STUDENT or INSTRUCTOR" };
        }

        const existingUser = await db.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          set.status = 400;
          return { error: "User already exists" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            role,
          },
        });

        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return {
          success: true,
          token,
          user: {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        console.error("Registration error:", error);
        set.status = 500;
        return { error: "Registration failed" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
        name: t.String({ minLength: 2 }),
        role: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const { email, password } = body;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          set.status = 401;
          return {
            error: "Invalid credentials",
            locked: false,
          };
        }

        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (user.lockoutUntil.getTime() - Date.now()) / (1000 * 60)
          );
          set.status = 423;
          return {
            error: `Account locked. Try again in ${minutesLeft} minutes.`,
            locked: true,
            lockoutUntil: user.lockoutUntil,
          };
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
          const newAttempts = user.loginAttempts + 1;
          let lockoutUntil = null;

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            lockoutUntil = new Date(
              Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
            );
          }

          await db.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: newAttempts,
              lockoutUntil,
              lastLoginAttempt: new Date(),
            },
          });

          const attemptsLeft = MAX_LOGIN_ATTEMPTS - newAttempts;
          let errorMessage = "Invalid credentials";

          if (attemptsLeft > 0) {
            errorMessage = `Invalid credentials. ${attemptsLeft} attempt(s) remaining.`;
          } else {
            errorMessage = `Account locked. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`;
          }

          set.status = 401;
          return {
            error: errorMessage,
            locked: newAttempts >= MAX_LOGIN_ATTEMPTS,
            attemptsLeft,
          };
        }

        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        await db.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockoutUntil: null,
            lastLoginAttempt: new Date(),
          },
        });

        return {
          success: true,
          token,
          user: {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        console.error("Login error:", error);
        set.status = 500;
        return { error: "Login failed" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )

  .get("/me", async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "No token provided" };
      }

      const token = authHeader.slice(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const user = await db.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            loginAttempts: true,
            lockoutUntil: true,
          },
        });

        if (!user) {
          set.status = 401;
          return { error: "User not found" };
        }

        return {
          success: true,
          user: {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        set.status = 401;
        return { error: "Invalid token" };
      }
    } catch (error) {
      console.error("Get me error:", error);
      set.status = 500;
      return { error: "Server error" };
    }
  })

  .post("/logout", ({ set }) => {
    set.status = 200;
    return { success: true, message: "Logged out successfully" };
  });
