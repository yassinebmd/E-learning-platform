import { db } from '../app'; // Assuming db is exported from app.ts
import type { Context } from 'elysia';

// Define a type for the context after JWT plugin is added
// This gives us type-safety for 'jwt' and 'cookie'
type AuthContext = Context & {
  cookie: { auth: { value: string } }; // Get the cookie *value*
  jwt: {
    verify: (token: string) => Promise<false | { userId: string } & Record<string, any>>;
  };
};

// This is just a config object, not a 'new' class
export const authGuardConfig = {
  
  // 'derive' runs before the handler and adds data to the context
  derive: async ({ cookie, jwt, set }: AuthContext) => {
    
    // 1. Check if the 'auth' cookie exists
    if (!cookie.auth) {
      set.status = 401;
      throw new Error('Unauthorized: No auth cookie');
    }

    // 2. Verify the token from the cookie's *value*
    const profile = await jwt.verify(cookie.auth.value);

    if (!profile) {
      set.status = 401;
      throw new Error('Unauthorized: Invalid token');
    }

    // 3. Find the user in the DB
    const user = await db.user.findUnique({
      where: { id: profile.userId as string }, // Use 'as string' for Prisma
    });

    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized: User not found');
    }

    // 4. Return the user, excluding the password
    const { password, ...userWithoutPassword } = user;

    // This makes 'user' available in our protected routes
    return { user: userWithoutPassword };
  },
};