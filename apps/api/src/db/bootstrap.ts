import type { ApiEnv } from "../env";

let schemaReady: Promise<void> | undefined;

export const ensureDatabaseSchema = (env: ApiEnv) => {
  schemaReady ??= applySchema(env.DB);
  return schemaReady;
};

const applySchema = async (db: D1Database) => {
  await db.batch([
    db.prepare(`
      create table if not exists "user" (
        "id" text primary key not null,
        "name" text not null,
        "email" text not null unique,
        "email_verified" integer not null,
        "image" text,
        "is_anonymous" integer default false,
        "created_at" integer not null,
        "updated_at" integer not null
      )
    `),
    db.prepare(`
      create table if not exists "session" (
        "id" text primary key not null,
        "expires_at" integer not null,
        "token" text not null unique,
        "created_at" integer not null,
        "updated_at" integer not null,
        "ip_address" text,
        "user_agent" text,
        "user_id" text not null references "user"("id") on delete cascade
      )
    `),
    db.prepare(`
      create table if not exists "account" (
        "id" text primary key not null,
        "account_id" text not null,
        "provider_id" text not null,
        "user_id" text not null references "user"("id") on delete cascade,
        "access_token" text,
        "refresh_token" text,
        "id_token" text,
        "access_token_expires_at" integer,
        "refresh_token_expires_at" integer,
        "scope" text,
        "password" text,
        "created_at" integer not null,
        "updated_at" integer not null
      )
    `),
    db.prepare(`
      create table if not exists "verification" (
        "id" text primary key not null,
        "identifier" text not null,
        "value" text not null,
        "expires_at" integer not null,
        "created_at" integer,
        "updated_at" integer
      )
    `),
    db.prepare(`
      create table if not exists "guest_visit" (
        "id" text primary key not null,
        "guest_id" text not null,
        "created_at" integer not null
      )
    `),
  ]);
};
