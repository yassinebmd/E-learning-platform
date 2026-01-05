import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: {
  userId: string;
  name: string;
  role: string;
}) {
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string) {
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
