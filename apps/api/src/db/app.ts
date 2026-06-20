import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const counterIncrement = pgTable("counter_increment", {
  id: text("id").primaryKey(),
  amount: integer("amount").notNull(),
  authenticated: boolean("authenticated").notNull(),
  counterValue: integer("counter_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  identity: text("identity").notNull(),
  userId: text("user_id"),
});
