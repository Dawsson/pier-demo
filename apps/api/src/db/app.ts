import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const counter = pgTable("counter", {
  id: text("id").primaryKey(),
  value: integer("value").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const counterIncrement = pgTable("counter_increment", {
  id: text("id").primaryKey(),
  amount: integer("amount").notNull(),
  authenticated: boolean("authenticated").notNull(),
  counterValue: integer("counter_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  identity: text("identity").notNull(),
  userId: text("user_id"),
});
