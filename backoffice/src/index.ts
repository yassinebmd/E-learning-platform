import { t } from 'elysia';
import bcrypt from 'bcrypt';
import { app, db } from './app'; // <-- Import the core app
import { authGuardConfig } from './middleware/auth'; // <-- Import our new guard

const appWithRoutes = app
  // --- Group for auth routes ---
  .group('/auth', (app) => 
    app
      // --- REGISTER ---
      .post(
        '/register',
        async ({ body, set }) => {
          // ... (Your existing register logic)
          // 1. Check if user already exists
          const existingUser = await db.user.findUnique({
            where: { email: body.email },
          });

          if (existingUser) {
            set.status = 409; // Conflict
            return { error: 'Email already in use' };
          }

          // 2. Hash the password
          const hashedPassword = await bcrypt.hash(body.password, 10);

          // 3. Create the user
          const newUser = await db.user.create({
            data: {
              email: body.email,
              name: body.name,
              password: hashedPassword,
              role: body.role, // STUDENT or INSTRUCTOR
            },
          });

          set.status = 201; // Created
          const { password, ...userWithoutPassword } = newUser;
          return userWithoutPassword;
        },
        {
          body: t.Object({
            email: t.String(),
            password: t.String(),
            name: t.String(),
            role: t.Enum({ STUDENT: 'STUDENT', INSTRUCTOR: 'INSTRUCTOR' }),
          }),
        }
      )
      
      // --- LOGIN ---
      .post(
        '/login',
        async ({ body, set, jwt, cookie }) => {
          // ... (Your existing login logic)
          const user = await db.user.findUnique({
            where: { email: body.email },
          });

          if (!user) {
            set.status = 401;
            return { error: 'Invalid credentials' };
          }

          const isPasswordValid = await bcrypt.compare(
            body.password,
            user.password
          );

          if (!isPasswordValid) {
            set.status = 401;
            return { error: 'Invalid credentials' };
          }

          const token = await jwt.sign({
            userId: user.id,
            role: user.role,
          });

          cookie.auth.set({
            value: token,
            httpOnly: true,
            maxAge: 7 * 86400,
            path: '/',
          });

          return { message: 'Login successful' };
        },
        {
          body: t.Object({
            email: t.String(),
            password: t.String(),
          }),
        }
      )
  )
  
  // --- PROTECTED ROUTES ---
  .guard(authGuardConfig as any)

.get('/me', ({ user }) => {
    // 'user' is available in the store thanks to our guard!
    return user;
  })
  // --- START THE SERVER ---
  .listen(3007);

console.log(
  `🦊 Elysia is running at ${appWithRoutes.server?.hostname}:${appWithRoutes.server?.port}`
);