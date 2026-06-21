import { sql } from "drizzle-orm";
import type { AppDb } from ".";

let schemaReady: Promise<void> | undefined;

export const ensureDatabaseSchema = (db: AppDb) => {
  schemaReady ??= applySchema(db);
  return schemaReady;
};

const applySchema = async (db: AppDb) => {
  await db.execute(sql`
    create table if not exists "user" (
      "id" text primary key not null,
      "name" text not null,
      "email" text not null unique,
      "email_verified" boolean not null,
      "image" text,
      "role" text,
      "banned" boolean default false,
      "ban_reason" text,
      "ban_expires" timestamp with time zone,
      "created_at" timestamp with time zone not null,
      "updated_at" timestamp with time zone not null
    )
  `);
  await db.execute(sql`
    create table if not exists "session" (
      "id" text primary key not null,
      "expires_at" timestamp with time zone not null,
      "token" text not null unique,
      "created_at" timestamp with time zone not null,
      "updated_at" timestamp with time zone not null,
      "ip_address" text,
      "user_agent" text,
      "impersonated_by" text,
      "user_id" text not null references "user"("id") on delete cascade
    )
  `);
  await db.execute(sql`
    create table if not exists "account" (
      "id" text primary key not null,
      "account_id" text not null,
      "provider_id" text not null,
      "user_id" text not null references "user"("id") on delete cascade,
      "access_token" text,
      "refresh_token" text,
      "id_token" text,
      "access_token_expires_at" timestamp with time zone,
      "refresh_token_expires_at" timestamp with time zone,
      "scope" text,
      "password" text,
      "created_at" timestamp with time zone not null,
      "updated_at" timestamp with time zone not null
    )
  `);
  await db.execute(sql`
    create table if not exists "verification" (
      "id" text primary key not null,
      "identifier" text not null,
      "value" text not null,
      "expires_at" timestamp with time zone not null,
      "created_at" timestamp with time zone,
      "updated_at" timestamp with time zone
    )
  `);
  await db.execute(sql`
    create table if not exists "counter_increment" (
      "id" text primary key not null,
      "amount" integer not null,
      "authenticated" boolean not null,
      "counter_value" integer not null,
      "created_at" timestamp with time zone not null,
      "identity" text not null,
      "user_id" text
    )
  `);
  await db.execute(sql`
    create table if not exists "counter_state" (
      "id" text primary key not null,
      "value" integer not null,
      "updated_at" text not null
    )
  `);
  await db.execute(sql`
    insert into "counter_state" ("id", "value", "updated_at")
    values (
      'global',
      coalesce((select "counter_value" from "counter_increment" order by "created_at" desc limit 1), 0),
      coalesce((select "created_at"::text from "counter_increment" order by "created_at" desc limit 1), now()::text)
    )
    on conflict ("id") do nothing
  `);
};
