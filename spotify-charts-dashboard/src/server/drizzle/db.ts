// The DB schema to be used for queries with Drizzle

import { drizzle as drizzlePSMySQL } from "drizzle-orm/planetscale-serverless";
import { drizzle as drizzleMySQL } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "~/env/server.mjs";

import { connect } from "@planetscale/database";

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
