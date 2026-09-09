import fs from "fs";
import path from "path";
import { Pool } from "@neondatabase/serverless";
import { CheckInLog, SystemSettings, User } from "../types";

const DEFAULT_USERS: User[] = [
  { id: "wang-rui-hong", name: "王睿宏", passwordHash: "" },
  { id: "lin-qin-zhen", name: "林沁臻", passwordHash: "" },
];

const DEFAULT_SETTINGS: SystemSettings = {
  weeklyTargetHours: 16,
  ipRestricted: false,
  allowedIps: [],
  adminPasswordHash: "",
  updatedAt: new Date().toISOString(),
};

interface DbSchema {
  users: User[];
  logs: CheckInLog[];
  settings: SystemSettings;
}

function resolvePostgresUrl(): string | undefined {
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;

  // Auto-detect any environment variable that contains a postgresql connection string
  for (const [, val] of Object.entries(process.env)) {
    if (val && typeof val === "string" && (val.startsWith("postgres://") || val.startsWith("postgresql://"))) {
      return val;
    }
  }
  return undefined;
}

// PostgreSQL connection pool (if available)
const postgresUrl = resolvePostgresUrl();
let pgPool: Pool | null = null;
let isPgInitialized = false;

if (postgresUrl) {
  try {
    pgPool = new Pool({
      connectionString: postgresUrl,
    });
  } catch (err) {
    console.error("Failed to initialize PostgreSQL pool:", err);
  }
}

// Fallback file storage path
const dataDir = path.join(process.cwd(), "data");
const dbFilePath = path.join(dataDir, "db.json");

function ensureFileStorage(): DbSchema {
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // In serverless, fallback to /tmp
    }
  }

  const targetPath = fs.existsSync(dataDir) ? dbFilePath : path.join("/tmp", "checkin_db.json");

  if (!fs.existsSync(targetPath)) {
    const initialData: DbSchema = {
      users: DEFAULT_USERS,
      logs: [],
      settings: DEFAULT_SETTINGS,
    };
    try {
      fs.writeFileSync(targetPath, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    } catch (err) {
      console.warn("Writing fallback DB failed:", err);
      return initialData;
    }
  }

  try {
    const content = fs.readFileSync(targetPath, "utf-8");
    const parsed = JSON.parse(content) as DbSchema;
    // ensure users exist
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = DEFAULT_USERS;
    }
    if (!parsed.settings) {
      parsed.settings = DEFAULT_SETTINGS;
    }
    return parsed;
  } catch {
    return {
      users: DEFAULT_USERS,
      logs: [],
      settings: DEFAULT_SETTINGS,
    };
  }
}

function saveFileStorage(data: DbSchema): void {
  const targetPath = fs.existsSync(dataDir) ? dbFilePath : path.join("/tmp", "checkin_db.json");
  try {
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save to local DB file:", err);
  }
}

async function initPostgresTables(pool: Pool) {
  if (isPgInitialized) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        password_hash TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS check_in_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(128) NOT NULL,
        type VARCHAR(32) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        accuracy DOUBLE PRECISION,
        address TEXT NOT NULL,
        ip VARCHAR(128) NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY DEFAULT 1,
        weekly_target_hours INT NOT NULL DEFAULT 16,
        ip_restricted BOOLEAN NOT NULL DEFAULT FALSE,
        allowed_ips TEXT NOT NULL DEFAULT '[]',
        admin_password_hash TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Seed default users if table is empty
    const userRes = await client.query(`SELECT COUNT(*) FROM users;`);
    if (parseInt(userRes.rows[0].count, 10) === 0) {
      for (const u of DEFAULT_USERS) {
        await client.query(
          `INSERT INTO users (id, name, password_hash) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING;`,
          [u.id, u.name, u.passwordHash]
        );
      }
    }

    // Seed settings if empty
    const settingsRes = await client.query(`SELECT COUNT(*) FROM system_settings WHERE id = 1;`);
    if (parseInt(settingsRes.rows[0].count, 10) === 0) {
      await client.query(
        `INSERT INTO system_settings (id, weekly_target_hours, ip_restricted, allowed_ips, admin_password_hash, updated_at)
         VALUES (1, $1, $2, $3, $4, NOW());`,
        [
          DEFAULT_SETTINGS.weeklyTargetHours,
          DEFAULT_SETTINGS.ipRestricted,
          JSON.stringify(DEFAULT_SETTINGS.allowedIps),
          DEFAULT_SETTINGS.adminPasswordHash,
        ]
      );
    }

    isPgInitialized = true;
  } catch (err) {
    console.error("Error initializing Postgres schema:", err);
  } finally {
    client.release();
  }
}

// Unified Database API
export const db = {
  isPostgresConnected(): boolean {
    return Boolean(pgPool && postgresUrl);
  },

  async getUsers(): Promise<User[]> {
    if (pgPool) {
      try {
        await initPostgresTables(pgPool);
        const res = await pgPool.query(`SELECT id, name, password_hash as "passwordHash" FROM users ORDER BY id;`);
        return res.rows;
      } catch (err) {
        console.error("Postgres error getUsers, falling back to file:", err);
      }
    }
    const store = ensureFileStorage();
    return store.users;
  },

  async getUser(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    if (pgPool) {
      try {
        await initPostgresTables(pgPool);
        await pgPool.query(`UPDATE users SET password_hash = $1 WHERE id = $2;`, [passwordHash, id]);
        return true;
      } catch (err) {
        console.error("Postgres error updateUserPassword, falling back to file:", err);
      }
    }
    const store = ensureFileStorage();
    const user = store.users.find((u) => u.id === id);
    if (!user) return false;
    user.passwordHash = passwordHash;
    saveFileStorage(store);
    return true;
  },

  async getSettings(): Promise<SystemSettings> {
    if (pgPool) {
      try {
        await initPostgresTables(pgPool);
        const res = await pgPool.query(
          `SELECT weekly_target_hours as "weeklyTargetHours", ip_restricted as "ipRestricted",
                  allowed_ips as "allowedIpsRaw", admin_password_hash as "adminPasswordHash",
                  updated_at as "updatedAt"
           FROM system_settings WHERE id = 1;`
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          let allowedIps: string[] = [];
          try {
            allowedIps = JSON.parse(row.allowedIpsRaw || "[]");
          } catch {
            allowedIps = [];
          }
          return {
            weeklyTargetHours: Number(row.weeklyTargetHours) || 16,
            ipRestricted: Boolean(row.ipRestricted),
            allowedIps,
            adminPasswordHash: row.adminPasswordHash || "",
            updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
          };
        }
      } catch (err) {
        console.error("Postgres error getSettings, falling back to file:", err);
      }
    }
    const store = ensureFileStorage();
    return store.settings;
  },

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.getSettings();
    const next: SystemSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (pgPool) {
      try {
        await initPostgresTables(pgPool);
        await pgPool.query(
          `UPDATE system_settings
           SET weekly_target_hours = $1,
               ip_restricted = $2,
               allowed_ips = $3,
               admin_password_hash = $4,
               updated_at = NOW()
           WHERE id = 1;`,
          [
            next.weeklyTargetHours,
            next.ipRestricted,
            JSON.stringify(next.allowedIps),
            next.adminPasswordHash,
          ]
        );
        return next;
      } catch (err) {
        console.error("Postgres error updateSettings, falling back to file:", err);
      }
    }

    const store = ensureFileStorage();
    store.settings = next;
    saveFileStorage(store);
    return next;
  },

  async getLogs(filter?: { userId?: string; limit?: number }): Promise<CheckInLog[]> {
    if (pgPool) {
      try {
        await initPostgresTables(pgPool);
        let query = `
          SELECT id, user_id as "userId", user_name as "userName", type,
                 timestamp, latitude, longitude, accuracy, address, ip, note,
                 created_at as "createdAt"
          FROM check_in_logs
        `;
        const params: unknown[] = [];
        if (filter?.userId) {
          params.push(filter.userId);
          query += ` WHERE user_id = $1`;
        }
        query += ` ORDER BY timestamp DESC`;
        if (filter?.limit) {
          params.push(filter.limit);
          query += ` LIMIT $${params.length}`;
        }

        const res = await pgPool.query(query, params);
        return res.rows.map((r) => ({
          ...r,
          timestamp: new Date(r.timestamp).toISOString(),
          createdAt: new Date(r.createdAt).toISOString(),
          latitude: r.latitude !== null ? Number(r.latitude) : null,
          longitude: r.longitude !== null ? Number(r.longitude) : null,
          accuracy: r.accuracy !== null ? Number(r.accuracy) : null,
        }));
      } catch (err) {
        console.error("Postgres error getLogs, falling back to file:", err);
      }
    }

    const store = ensureFileStorage();
    let logs = [...store.logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (filter?.userId) {
      logs = logs.filter((l) => l.userId === filter.userId);
    }
    if (filter?.limit) {
      logs = logs.slice(0, filter.limit);
    }
    return logs;
  },

  async addLog(logData: Omit<CheckInLog, "id" | "createdAt">): Promise<CheckInLog> {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const createdAt = new Date().toISOString();
    const newLog: CheckInLog = {
      id,
      ...logData,
      createdAt,
    };

    if (pgPool) {
      try {
        await initPostgresTables(pgPool);
        await pgPool.query(
          `INSERT INTO check_in_logs (id, user_id, user_name, type, timestamp, latitude, longitude, accuracy, address, ip, note, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
          [
            newLog.id,
            newLog.userId,
            newLog.userName,
            newLog.type,
            newLog.timestamp,
            newLog.latitude,
            newLog.longitude,
            newLog.accuracy || null,
            newLog.address,
            newLog.ip,
            newLog.note || "",
            newLog.createdAt,
          ]
        );
        return newLog;
      } catch (err) {
        console.error("Postgres error addLog, falling back to file:", err);
      }
    }

    const store = ensureFileStorage();
    store.logs.unshift(newLog);
    saveFileStorage(store);
    return newLog;
  },

  async deleteLog(id: string): Promise<boolean> {
    if (pgPool) {
      try {
        await initPostgresTables(pgPool);
        const res = await pgPool.query(`DELETE FROM check_in_logs WHERE id = $1;`, [id]);
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.error("Postgres error deleteLog, falling back to file:", err);
      }
    }

    const store = ensureFileStorage();
    const initialLen = store.logs.length;
    store.logs = store.logs.filter((l) => l.id !== id);
    if (store.logs.length !== initialLen) {
      saveFileStorage(store);
      return true;
    }
    return false;
  },
};
