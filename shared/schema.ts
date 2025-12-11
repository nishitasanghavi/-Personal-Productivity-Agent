import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  category: text("category").default("default"),
  status: text("status").default("upcoming"),
  needsAction: boolean("needs_action").default(false),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const kanbanColumns = ["today", "thisWeek", "upcoming", "backlog", "needsAction"] as const;
export type KanbanColumn = typeof kanbanColumns[number];

export const jsonEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  start: z.string(),
  end: z.string(),
  location: z.string().optional(),
  category: z.string().optional(),
});

export const jsonCalendarSchema = z.object({
  events: z.array(jsonEventSchema),
});

export type JsonEvent = z.infer<typeof jsonEventSchema>;
