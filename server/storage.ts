import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  events,
  tasks,
  type Event,
  type Task,
  type InsertEvent,
  type InsertTask,
} from "@shared/schema";

// ---- FIX: ensure DATABASE_URL is a real string ----
const rawEnv = process.env.DATABASE_URL;

if (!rawEnv) {
  throw new Error("DATABASE_URL is missing. Check your .env file.");
}

// Always convert to a proper string for pg
const connectionString = String(rawEnv);

// Create Postgres pool safely
const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool);


export interface IStorage {
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  getTasks(): Promise<Task[]>;
  getTasksByEventId(eventId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  deleteTasksByEventId(eventId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByEventId(eventId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.eventId, eventId));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async deleteTasksByEventId(eventId: string): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.eventId, eventId));
    return true;
  }
}

export const storage = new DatabaseStorage();
