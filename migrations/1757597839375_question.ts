/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from "kysely";
import { sql } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // up migration code goes here...
  // note: up migrations are mandatory. you must implement this function.
  // For more info, see: https://kysely.dev/docs/migrations

  await db.schema
    .createTable("question")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("org_id", "text", (col) => col.notNull())
    .addColumn("number", "integer", (col) => col.notNull())
    .addColumn("question_text", "text", (col) => col.notNull())
    .addColumn("correct_answer", "text", (col) => col.notNull())
    .addColumn("incorrect_answer_1", "text", (col) => col.notNull())
    .addColumn("incorrect_answer_2", "text", (col) => col.notNull())
    .addColumn("incorrect_answer_3", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  await db.schema
    .createTable("quiz_attempt")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "text", (col) =>
      col.references("user.id").onDelete("cascade").notNull()
    )
    .addColumn("question_id", "integer", (col) =>
      col.references("question.id").onDelete("cascade").notNull()
    )
    .addColumn("answer", "text", (col) => col.notNull())
    .addColumn("is_correct", "boolean", (col) => col.notNull())
    .addColumn("score", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // down migration code goes here...
  // note: down migrations are optional. you can safely delete this function.
  // For more info, see: https://kysely.dev/docs/migrations

  await db.schema.dropTable("quiz_attempt").ifExists().execute();

  await db.schema.dropTable("question").ifExists().execute();
}
