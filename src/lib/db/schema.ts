import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  provider: varchar("provider", { length: 50 }).default("google"),
  providerAccountId: text("provider_account_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }).defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .unique()
    .notNull(),
  plan: varchar("plan", { length: 50 }).default("free").notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  currentPeriodStart: timestamp("current_period_start", {
    withTimezone: true,
  }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).unique().notNull(),
  source: varchar("source", { length: 100 }), // which page they signed up from: "stocks", "stock-detail", "compare"
  locale: varchar("locale", { length: 10 }), // "ko" or "en"
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, invited, registered
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
