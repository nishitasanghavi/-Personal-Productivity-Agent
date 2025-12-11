import fs from "fs";
import { URL } from "url";
import pg from "pg";

const { Pool } = pg;

try {
  const envText = fs.readFileSync(".env", "utf8");
  const envLine = envText.split(/\r?\n/).find(l => l && l.startsWith("DATABASE_URL="));
  if (!envLine) throw new Error(".env missing DATABASE_URL line");
  const url = envLine.split("=")[1];
  console.log("DATABASE_URL from .env:", url);
  console.log("typeof DATABASE_URL:", typeof url);

  const parsed = new URL(url);
  console.log("parsed.username:", parsed.username);
  console.log("parsed.password (raw):", parsed.password);
  console.log("typeof parsed.password:", typeof parsed.password);

  const pool = new Pool({ connectionString: url });
  pool.connect()
    .then(client => {
      console.log("PG connect: SUCCESS");
      client.release();
      pool.end().then(() => process.exit(0));
    })
    .catch(err => {
      console.error("PG connect: ERROR");
      console.error(err);
      pool.end().then(() => process.exit(1));
    });
} catch (e) {
  console.error("Script error:", e);
  process.exit(1);
}
