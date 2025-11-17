import { t } from "elysia";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { app, db } from "./app";
import { authGuardConfig } from "./middleware/auth";

const userSocketMap = new Map<string, WebSocket>();
const socketUsers = new Map<
  string,
  { userId: string; name: string; role: string;  }
>();

const allSockets = new Set<WebSocket>();

const JWT_SECRET = process.env.JWT_SECRET!;

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      name: string;
      role: string;
    };
  } catch {
    return null;
  }
}

//HTTP routes
const appWithRoutes = app
  .group("/auth", (app) =>
    app
      .post(
        "/register",
        async ({ body, set }) => {
          const exists = await db.user.findUnique({
            where: { email: body.email },
          });

          if (exists) {
            set.status = 409;
            return { error: "Email already in use" };
          }

          const user = await db.user.create({
            data: {
              email: body.email,
              name: body.name,
              password: await bcrypt.hash(body.password, 10),
              role: body.role,
            },
          });

          set.status = 201;
          const { password, ...safe } = user;
          return safe;
        },
        {
          body: t.Object({
            email: t.String(),
            password: t.String(),
            name: t.String(),
            role: t.Enum({
              STUDENT: "STUDENT",
              INSTRUCTOR: "INSTRUCTOR",
            }),
          }),
        }
      )

      .post(
        "/login",
        async ({ body, set, cookie }) => {
          const MAX_ATTEMPTS = 5;
          const LOCKOUT_DURATION_MS = 20 * 60 * 1000; 
          const user = await db.user.findUnique({
            where: { email: body.email },
          });

          if (!user) {
            set.status = 401;
            return { error: "Invalid credentials" };
          }

          if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            set.status = 429; 
            return {
              error: `Account locked. Try again after ${user.lockoutUntil.toLocaleTimeString()}`,
            };
          }

          const isPasswordValid = await bcrypt.compare(
            body.password,
            user.password
          );
          if (!isPasswordValid) {
            const newAttempts = user.loginAttempts + 1;
            let updateData: any = { loginAttempts: newAttempts };

            if (newAttempts >= MAX_ATTEMPTS) {
              updateData.lockoutUntil = new Date(
                Date.now() + LOCKOUT_DURATION_MS
              );
            }

            await db.user.update({
              where: { id: user.id },
              data: updateData,
            });

            set.status = 401;
            return { error: "Invalid credentials" };
          }
          if (user.loginAttempts > 0 || user.lockoutUntil) {
            await db.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: 0,
                lockoutUntil: null, 
              },
            });
          }

          const token = jwt.sign(
            {
              userId: user.id,
              role: user.role,
              name: user.name,
            },
            JWT_SECRET
          );

          cookie.auth.set({
            value: token,
            httpOnly: true,
            maxAge: 7 * 86400,
            path: "/",
          });

          return { message: "Login successful", token };
        },
        {
          body: t.Object({
            email: t.String(),
            password: t.String(),
          }),
        }
      )
  )

  // Authenticated routes
  .guard(authGuardConfig as any)


  .get("/me", ( { user } ) => {
  if (!user) {
    return { error: "Not authenticated" };
  }
  return user;
})

 .post("/logout", async ({ cookie, set, request }) => {
  cookie.auth.set({
    value: '',
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });
  set.status = 204;
  return;
})

  //  WebSocket route
  .ws("/ws", {
    open(ws) {
      console.log(`🔗 WebSocket connected: ${ws.id}`);
      allSockets.add(ws as any);
    },

    message(ws, raw) {
      let data: any;

      try {
        data =
          typeof raw === "string"
            ? JSON.parse(raw)
            : raw instanceof ArrayBuffer
            ? JSON.parse(new TextDecoder().decode(raw))
            : raw;
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
        return;
      }

      if (data.type === "auth") {
        const payload = verifyToken(data.token);

        if (!payload) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
          ws.close();
          return;
        }

        socketUsers.set(ws.id, {
          userId: payload.userId,
          name: payload.name,
          role: payload.role,
        });

        userSocketMap.set(payload.userId, ws as any);

        console.log(`✅ User ${payload.name} authenticated on socket ${ws.id}`);

        ws.send(
          JSON.stringify({
            type: "welcome_user",
            message: `Welcome, ${payload.name}!`,
          })
        );

        return;
      }

      // All other messages require user info
      const userInfo = socketUsers.get(ws.id);

      if (!userInfo) {
        ws.send(
          JSON.stringify({ type: "error", message: "Not authenticated" })
        );
        return;
      }

      switch (data.type) {
        case "shout": {
          console.log(`📢 Shout from ${userInfo.name}:`, data.message);

          const packet = JSON.stringify({
            type: "global_message",
            sender: userInfo.name,
            message: data.message,
            timestamp: new Date().toISOString(),
          });

          allSockets.forEach((c) => c.readyState === 1 && c.send(packet));
          break;
        }

        case "sendMessage": {
          console.log(`💬 Message from ${userInfo.name}:`, data.message);

          const packet = JSON.stringify({
            type: "receiveMessage",
            sender: userInfo.name,
            message: data.message,
            timestamp: new Date().toISOString(),
          });

          allSockets.forEach((c) => c.readyState === 1 && c.send(packet));
          break;
        }

        case "privateMessage": {
          const receiverWs = userSocketMap.get(data.receiverId);

          if (receiverWs?.readyState === 1) {
            receiverWs.send(
              JSON.stringify({
                type: "privateMessage",
                sender: userInfo.name,
                message: data.message,
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;
        }
      }
    },
    
    close(ws) {
      const info = socketUsers.get(ws.id);

      if (info) userSocketMap.delete(info.userId);

      socketUsers.delete(ws.id);
      allSockets.delete(ws as any);

      console.log(`❌ WebSocket closed: ${ws.id}`);
    },
  })

  .listen(5001, (srv) => {
    console.log(
      `🦊 Elysia server running at http://${srv.hostname}:${srv.port}`
    );
    console.log(
      `✅ WebSocket available at ws://${srv.hostname}:${srv.port}/ws`
    );
  });

export default appWithRoutes;
