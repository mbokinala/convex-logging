import postgres from "postgres";
import { loadConfig } from "../src/config";
import { runMigrations } from "../src/storage/postgres/migrate";

const config = loadConfig();
const sql = postgres(config.databaseUrl);

await runMigrations(sql);
console.log("Migrations complete");
await sql.end();
