import { boolean, createBuilder, createSchema, number, string, table } from "@rocicorp/zero";

export const counterStateTable = table("counter_state")
  .columns({
    id: string(),
    updatedAt: string().from("updated_at"),
    value: number(),
  })
  .primaryKey("id");

export const userTable = table("user")
  .columns({
    id: string(),
    name: string(),
    email: string(),
    emailVerified: boolean().from("email_verified"),
    image: string().optional(),
    role: string().optional(),
  })
  .primaryKey("id");

export const schema = createSchema({
  tables: [counterStateTable, userTable],
});

export const zql = createBuilder(schema);
