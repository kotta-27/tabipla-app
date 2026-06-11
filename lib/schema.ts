import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  date,
  time,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── NextAuth required tables ─────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── App tables ───────────────────────────────────────────────────────────────

export const trips = pgTable("trips", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  destination: text("destination"),
  coverEmoji: text("cover_emoji").notNull().default("✈️"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tripMembers = pgTable("trip_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "member"] }).notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const tripInvites = pgTable("trip_invites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  token: text("token")
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, "")),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const polls = pgTable("polls", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pollDates = pgTable("poll_dates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  label: text("label"),
  sortOrder: integer("sort_order").default(0),
});

export const pollResponses = pgTable("poll_responses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade" }),
  dateId: text("date_id")
    .notNull()
    .references(() => pollDates.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  response: text("response", { enum: ["ok", "maybe", "ng"] }).notNull(),
});

export const activities = pgTable("activities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  sortOrder: integer("sort_order").default(0),
});

export const memos = pgTable("memos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  activityId: text("activity_id").references(() => activities.id, { onDelete: "set null" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paidBy: text("paid_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenseSplits = pgTable("expense_splits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shareAmount: numeric("share_amount", { precision: 10, scale: 2 }).notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["trip_invite", "joined", "declined", "poll_answered", "poll_updated", "removed", "left", "poll_created"] }).notNull(),
  tripId: text("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  fromUserId: text("from_user_id").references(() => users.id, { onDelete: "cascade" }),
  pollId: text("poll_id").references(() => polls.id, { onDelete: "cascade" }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const tripsRelations = relations(trips, ({ many }) => ({
  members: many(tripMembers),
  polls: many(polls),
  activities: many(activities),
  memos: many(memos),
  expenses: many(expenses),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, { fields: [tripMembers.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripMembers.userId], references: [users.id] }),
}));

export const pollsRelations = relations(polls, ({ many }) => ({
  dates: many(pollDates),
}));

export const pollDatesRelations = relations(pollDates, ({ one, many }) => ({
  poll: one(polls, { fields: [pollDates.pollId], references: [polls.id] }),
  responses: many(pollResponses),
}));

export const expensesRelations = relations(expenses, ({ many }) => ({
  splits: many(expenseSplits),
}));
