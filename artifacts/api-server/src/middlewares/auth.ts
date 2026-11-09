import {
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { db, usersTable, type PublicUser, type User } from "@workspace/db";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE = "tdl_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type Role = PublicUser["role"];

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by requireAuth / optionalAuth. Never contains the password hash. */
      user?: PublicUser;
    }
  }
}

// ---------- password hashing (scrypt) ----------
function scrypt(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, keylen, { N: 16384, r: 8, p: 1 }, (e, k) =>
      e ? reject(e) : resolve(k),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [alg, s, k] = stored.split("$");
  if (alg !== "scrypt" || !s || !k) return false;
  const expected = Buffer.from(k, "base64url");
  const actual = await scrypt(password, Buffer.from(s, "base64url"), expected.length);
  return timingSafeEqual(actual, expected);
}

// ---------- signed session tokens ----------
let devSecret: string | undefined;
function getSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (s && s.length >= 16) return s;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("SESSION_SECRET (min 16 chars) must be set in production");
  }
  return (devSecret ??= randomBytes(32).toString("hex"));
}

// Fail closed at startup in production.
if (process.env["NODE_ENV"] === "production") getSecret();

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.sub !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < Date.now() / 1000) return null;
    return data.sub;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function extractToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return readCookie(req, SESSION_COOKIE);
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
  });
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}

async function resolveUser(req: Request): Promise<PublicUser | null> {
  const token = extractToken(req);
  if (!token) return null;
  const id = verifySessionToken(token);
  if (!id) return null;
  const [row] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return row ? toPublicUser(row) : null;
}

/** Attaches req.user when a valid session exists; never rejects. */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const user = await resolveUser(req);
    if (user) req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/** 401 unless a valid session exists. Sets req.user. */
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/** 401 if unauthenticated, 403 if the user's role is not in `roles`. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    void requireAuth(req, res, (err?: unknown) => {
      if (err) return next(err);
      if (!req.user) return; // requireAuth already responded
      if (!roles.includes(req.user.role)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
    });
  };
}
