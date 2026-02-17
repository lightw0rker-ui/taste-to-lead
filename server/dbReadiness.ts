import { pool } from "./db";

const REQUIRED_TABLES = [
  "organizations",
  "agents",
  "properties",
  "leads",
  "notifications",
] as const;

let ready = false;
let lastError: string | null = "DB readiness not checked yet";
let monitorStarted = false;
let monitorTimer: NodeJS.Timeout | null = null;

function setNotReady(reason: string) {
  if (ready || lastError !== reason) {
    console.error(`[DB] DB not ready: ${reason}`);
  }
  ready = false;
  lastError = reason;
}

export function isDbReady() {
  return ready;
}

export function getDbReadinessState() {
  return {
    ready,
    error: lastError,
  };
}

export async function checkDbReadiness(): Promise<boolean> {
  try {
    await pool.query("select 1");
    const result = await pool.query<{ table_name: string }>(
      `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
      `,
      [REQUIRED_TABLES],
    );

    const found = new Set(result.rows.map((row) => row.table_name));
    const missing = REQUIRED_TABLES.filter((tableName) => !found.has(tableName));

    if (missing.length > 0) {
      setNotReady(`missing tables: ${missing.join(", ")}`);
      return false;
    }

    if (!ready) {
      console.log("[DB] Database is ready.");
    }
    ready = true;
    lastError = null;
    return true;
  } catch (error: any) {
    setNotReady(error?.message ?? String(error));
    return false;
  }
}

export function startDbReadinessMonitor(intervalMs = 15000) {
  if (monitorStarted) {
    return;
  }
  monitorStarted = true;

  const runCheck = () => {
    checkDbReadiness().catch((error) => {
      setNotReady(error?.message ?? String(error));
    });
  };

  runCheck();
  monitorTimer = setInterval(runCheck, intervalMs);

  const shutdown = () => {
    if (monitorTimer) {
      clearInterval(monitorTimer);
      monitorTimer = null;
    }
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
