import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDbClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || "",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

// Helper to generate unique IDs
function generateId(): string {
  return "cuid_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// User type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  doctorName: string | null;
  emailVerified: boolean;
  verificationToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SymptomLog {
  id: string;
  userId: string;
  date: string;
  painLevel: number;
  stoolFrequency: number;
  stoolType: number | null;
  stressLevel: number;
  triggers: string;
  notes: string | null;
  medicationTaken: string | null;
  bloodInStool: boolean;
  urgencyLevel: number;
  createdAt: Date;
}

// Initialize database operations
export const db = {
  user: {
    async findUnique({ where, select }: { where: any; select?: any }): Promise<User | null> {
      const dbClient = getDbClient();
      
      if (where.email) {
        const result = await dbClient.execute({
          sql: "SELECT * FROM User WHERE email = ?",
          args: [where.email],
        });
        if (result.rows.length === 0) return null;
        return mapRowToUser(result.rows[0]);
      }
      
      if (where.id) {
        const result = await dbClient.execute({
          sql: "SELECT * FROM User WHERE id = ?",
          args: [where.id],
        });
        if (result.rows.length === 0) return null;
        return mapRowToUser(result.rows[0]);
      }
      
      return null;
    },

    async create({ data }: { data: any }): Promise<User> {
      const dbClient = getDbClient();
      const id = data.id || generateId();
      const now = new Date();
      
      await dbClient.execute({
        sql: "INSERT INTO User (id, name, email, password, doctorName, emailVerified, verificationToken, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          id,
          data.name,
          data.email,
          data.password,
          data.doctorName || null,
          data.emailVerified || false,
          data.verificationToken || null,
          now.toISOString(),
          now.toISOString(),
        ],
      });
      
      return {
        id,
        name: data.name,
        email: data.email,
        password: data.password,
        doctorName: data.doctorName || null,
        emailVerified: data.emailVerified || false,
        verificationToken: data.verificationToken || null,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update({ where, data }: { where: any; data: any }): Promise<User> {
      const dbClient = getDbClient();
      const user = await this.findUnique({ where });
      if (!user) throw new Error("User not found");
      
      const updates: string[] = [];
      const args: any[] = [];
      
      if (data.name !== undefined) { updates.push("name = ?"); args.push(data.name); }
      if (data.email !== undefined) { updates.push("email = ?"); args.push(data.email); }
      if (data.password !== undefined) { updates.push("password = ?"); args.push(data.password); }
      if (data.doctorName !== undefined) { updates.push("doctorName = ?"); args.push(data.doctorName); }
      if (data.emailVerified !== undefined) { updates.push("emailVerified = ?"); args.push(data.emailVerified ? 1 : 0); }
      if (data.verificationToken !== undefined) { updates.push("verificationToken = ?"); args.push(data.verificationToken); }
      
      updates.push("updatedAt = ?");
      args.push(new Date().toISOString());
      args.push(where.id);
      
      await dbClient.execute({
        sql: `UPDATE User SET ${updates.join(", ")} WHERE id = ?`,
        args,
      });
      
      return await this.findUnique({ where }) as any;
    },

    async upsert({ where, create, update }: { where: any; create: any; update: any }): Promise<User> {
      const existing = await this.findUnique({ where });
      if (existing) {
        return await this.update({ where, data: update });
      }
      return await this.create({ data: create });
    },
  },

  symptomLog: {
    async findMany({ where, orderBy }: { where?: any; orderBy?: any }): Promise<SymptomLog[]> {
      const dbClient = getDbClient();
      let sql = "SELECT * FROM SymptomLog";
      const args: any[] = [];
      
      if (where?.userId) {
        sql += " WHERE userId = ?";
        args.push(where.userId);
      }
      
      if (orderBy?.date) {
        sql += ` ORDER BY date ${orderBy.date === "desc" ? "DESC" : "ASC"}`;
      }
      
      const result = await dbClient.execute({ sql, args });
      return result.rows.map(mapRowToSymptomLog);
    },

    async findUnique({ where }: { where: any }): Promise<SymptomLog | null> {
      const dbClient = getDbClient();
      const result = await dbClient.execute({
        sql: "SELECT * FROM SymptomLog WHERE id = ?",
        args: [where.id],
      });
      if (result.rows.length === 0) return null;
      return mapRowToSymptomLog(result.rows[0]);
    },

    async count({ where }: { where?: any }): Promise<number> {
      const dbClient = getDbClient();
      let sql = "SELECT COUNT(*) as count FROM SymptomLog";
      const args: any[] = [];
      
      if (where?.userId) {
        sql += " WHERE userId = ?";
        args.push(where.userId);
      }
      
      const result = await dbClient.execute({ sql, args });
      return Number(result.rows[0].count);
    },

    async create({ data }: { data: any }): Promise<SymptomLog> {
      const dbClient = getDbClient();
      const id = data.id || generateId();
      const now = new Date();
      
      await dbClient.execute({
        sql: "INSERT INTO SymptomLog (id, userId, date, painLevel, stoolFrequency, stoolType, stressLevel, triggers, notes, medicationTaken, bloodInStool, urgencyLevel, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          id,
          data.userId,
          data.date,
          data.painLevel ?? 0,
          data.stoolFrequency ?? 0,
          data.stoolType ?? null,
          data.stressLevel ?? 0,
          data.triggers,
          data.notes || null,
          data.medicationTaken || null,
          data.bloodInStool ? 1 : 0,
          data.urgencyLevel ?? 0,
          now.toISOString(),
        ],
      });
      
      return {
        id,
        userId: data.userId,
        date: data.date,
        painLevel: data.painLevel ?? 0,
        stoolFrequency: data.stoolFrequency ?? 0,
        stoolType: data.stoolType ?? null,
        stressLevel: data.stressLevel ?? 0,
        triggers: data.triggers,
        notes: data.notes || null,
        medicationTaken: data.medicationTaken || null,
        bloodInStool: data.bloodInStool ?? false,
        urgencyLevel: data.urgencyLevel ?? 0,
        createdAt: now,
      };
    },

    async createMany({ data }: { data: any[] }): Promise<{ count: number }> {
      const dbClient = getDbClient();
      for (const log of data) {
        await this.create({ data: log });
      }
      return { count: data.length };
    },

    async update({ where, data }: { where: any; data: any }): Promise<SymptomLog> {
      const dbClient = getDbClient();
      const log = await this.findUnique({ where });
      if (!log) throw new Error("SymptomLog not found");
      
      const updates: string[] = [];
      const args: any[] = [];
      
      if (data.date !== undefined) { updates.push("date = ?"); args.push(data.date); }
      if (data.painLevel !== undefined) { updates.push("painLevel = ?"); args.push(data.painLevel); }
      if (data.stoolFrequency !== undefined) { updates.push("stoolFrequency = ?"); args.push(data.stoolFrequency); }
      if (data.stoolType !== undefined) { updates.push("stoolType = ?"); args.push(data.stoolType); }
      if (data.stressLevel !== undefined) { updates.push("stressLevel = ?"); args.push(data.stressLevel); }
      if (data.triggers !== undefined) { updates.push("triggers = ?"); args.push(data.triggers); }
      if (data.notes !== undefined) { updates.push("notes = ?"); args.push(data.notes); }
      if (data.medicationTaken !== undefined) { updates.push("medicationTaken = ?"); args.push(data.medicationTaken); }
      if (data.bloodInStool !== undefined) { updates.push("bloodInStool = ?"); args.push(data.bloodInStool ? 1 : 0); }
      if (data.urgencyLevel !== undefined) { updates.push("urgencyLevel = ?"); args.push(data.urgencyLevel); }
      
      args.push(where.id);
      
      await dbClient.execute({
        sql: `UPDATE SymptomLog SET ${updates.join(", ")} WHERE id = ?`,
        args,
      });
      
      return await this.findUnique({ where }) as any;
    },

    async delete({ where }: { where: any }): Promise<void> {
      const dbClient = getDbClient();
      await dbClient.execute({
        sql: "DELETE FROM SymptomLog WHERE id = ?",
        args: [where.id],
      });
    },

    async deleteMany({ where }: { where: any }): Promise<void> {
      const dbClient = getDbClient();
      let sql = "DELETE FROM SymptomLog";
      const args: any[] = [];
      
      if (where?.userId && where?.date) {
        sql += " WHERE userId = ? AND date = ?";
        args.push(where.userId, where.date);
      } else if (where?.userId) {
        sql += " WHERE userId = ?";
        args.push(where.userId);
      }
      
      await dbClient.execute({ sql, args });
    },
  },
};

// Helper functions to map rows to objects
function mapRowToUser(row: any): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    password: row.password as string,
    doctorName: row.doctorName as string | null,
    emailVerified: Boolean(row.emailVerified) as boolean,
    verificationToken: row.verificationToken as string | null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function mapRowToSymptomLog(row: any): SymptomLog {
  return {
    id: row.id as string,
    userId: row.userId as string,
    date: row.date as string,
    painLevel: Number(row.painLevel),
    stoolFrequency: Number(row.stoolFrequency),
    stoolType: row.stoolType !== null ? Number(row.stoolType) : null,
    stressLevel: Number(row.stressLevel),
    triggers: row.triggers as string,
    notes: row.notes as string | null,
    medicationTaken: row.medicationTaken as string | null,
    bloodInStool: Boolean(row.bloodInStool),
    urgencyLevel: Number(row.urgencyLevel),
    createdAt: new Date(row.createdAt as string),
  };
}

export default db;
