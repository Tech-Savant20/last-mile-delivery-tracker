import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { JWTPayload, Role } from "./types";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-delivery-tracker-key-change-in-prod";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthSession(req?: NextRequest): Promise<JWTPayload | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("auth_token")?.value;
    } catch {
      // In non-server-action context or direct call
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(req?: NextRequest, allowedRoles?: Role[]): Promise<{ user: JWTPayload; dbUser: any } | null> {
  const session = await getAuthSession(req);
  if (!session) return null;

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { currentZone: true },
  });

  if (!dbUser) return null;

  return { user: session, dbUser };
}
