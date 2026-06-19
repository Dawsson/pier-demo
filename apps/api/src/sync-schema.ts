import { boolean, createBuilder, createSchema, string, table } from "@rocicorp/zero";

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
  tables: [userTable],
});

export const zql = createBuilder(schema);
