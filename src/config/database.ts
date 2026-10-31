import { Pool, QueryResult, QueryResultRow } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/triton_db";

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("[PostgreSQL Pool Error]", err);
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === "development") {
    // console.log(`[SQL Query] (${duration}ms):`, { text, params, rows: res.rowCount });
  }

  return res;
}

export async function testConnection(): Promise<boolean> {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Conexão com o PostgreSQL estabelecida com sucesso:", res.rows[0].now);
    return true;
  } catch (err: any) {
    console.warn("⚠️ Não foi possível conectar ao PostgreSQL:", err.message);
    return false;
  }
}

