import {
  ANYONE_CAN,
  boolean,
  createBuilder,
  createSchema,
  definePermissions,
  number,
  string,
  table,
  type PermissionRule,
} from "@rocicorp/zero";

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
    isAnonymous: boolean().from("is_anonymous").optional(),
    image: string().optional(),
    role: string().optional(),
  })
  .primaryKey("id");

export const schema = createSchema({
  tables: [counterStateTable, userTable],
});

export const zql = createBuilder(schema);

type SyncAuthData = {
  readonly sub: string;
};

export const permissions = definePermissions<SyncAuthData, typeof schema>(schema, () => ({
  counter_state: {
    row: {
      select: ANYONE_CAN,
    },
  },
  user: {
    row: {
      select: [
        ((authData, { cmp }) => cmp("id", "=", authData.sub)) as PermissionRule<
          SyncAuthData,
          typeof schema,
          "user"
        >,
      ],
    },
  },
}));
