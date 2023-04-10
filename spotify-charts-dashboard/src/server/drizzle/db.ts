// The DB schema to be used for queries with Drizzle

import { drizzle as drizzlePSMySQL } from "drizzle-orm/planetscale-serverless";
import { drizzle as drizzleMySQL } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "~/env/server.mjs";

import { connect } from "@planetscale/database";
import { sql } from "drizzle-orm/sql";
import { type AnyMySqlColumn } from "drizzle-orm/mysql-core";

export function createDrizzleDb() {
  if (env.DATABASE_URL.includes("pscale")) {
    return drizzlePSMySQL(
      connect({
        url: env.DATABASE_URL,
      })
    );
  }

  return drizzleMySQL(mysql.createPool(env.DATABASE_URL));
}

// query helpers
// https://github.com/drizzle-team/drizzle-orm/issues/275#issuecomment-1472576208
export const countRows = () => {
  return sql<number>`count(*)`;
};

export const countRowsColumn = (column: AnyMySqlColumn) => {
  return sql<number>`count(${column})`;
};

export const distinct = (column: AnyMySqlColumn) => {
  return sql`distinct ${column}`;
};
