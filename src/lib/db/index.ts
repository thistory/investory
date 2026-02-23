import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  db: DbInstance | undefined;
};

function getDb(): DbInstance {
  if (!globalForDb.db) {
    const sql = neon(process.env.DATABASE_URL!);
    globalForDb.db = drizzle(sql, { schema });
  }
  return globalForDb.db;
}

export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
