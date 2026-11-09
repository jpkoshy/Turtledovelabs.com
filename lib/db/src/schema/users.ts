import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const USER_ROLES = ["buyer", "seller", "admin"] as const;
export const USER_LEVELS = ["new", "level1", "level2", "top"] as const;

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    avatarUrl: text("avatar_url"),
    role: text("role", { enum: USER_ROLES }).notNull().default("buyer"),
    bio: text("bio"),
    country: text("country"),
    languages: text("languages").array().notNull().default([]),
    skills: text("skills").array().notNull().default([]),
    level: text("level", { enum: USER_LEVELS }).notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
/** User as exposed over the API: never includes the password hash. */
export type PublicUser = Omit<User, "passwordHash">;

// ---- Request validation schemas (exported so routes need no direct zod dep) ----
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "3-30 chars: lowercase letters, digits, underscore");

export const signupBodySchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(200),
  role: z.enum(["buyer", "seller"]).default("buyer"),
});

export const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1).max(200),
});

const stringList = z.array(z.string().trim().min(1).max(60)).max(30);

export const updateProfileBodySchema = z
  .object({
    displayName: z.string().trim().min(1).max(80),
    avatarUrl: z.url().max(500).nullable(),
    bio: z.string().trim().max(2000).nullable(),
    country: z.string().trim().max(80).nullable(),
    languages: stringList,
    skills: stringList,
    role: z.enum(["buyer", "seller"]),
  })
  .partial()
  .strict();
