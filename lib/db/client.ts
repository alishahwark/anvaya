import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import { createDatabaseClient } from "@/lib/db/config";

const client = createDatabaseClient();
export const db = drizzle(client, { schema });
