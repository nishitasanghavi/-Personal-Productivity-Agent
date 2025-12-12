import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertTaskSchema, jsonCalendarSchema } from "@shared/schema";
import {
  generateTasksForEvent,
  generateWeekSummary,
  generateDailyPlan,
  generateEmailDraft,
  findFreeSlots,
} from "./groq";
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // <-- REPLACED: GET /api/events now logs full error stack
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error: any) {
      // log full error + stack so we can debug the root cause
      console.error("Full error in GET /api/events:", error && error.stack ? error.stack : error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const parsed = insertEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const event = await storage.createEvent(parsed.data);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.post("/api/events/import", async (req, res) => {
    try {
      const { events: jsonEvents } = req.body;
      
      if (!Array.isArray(jsonEvents)) {
        return res.status(400).json({ error: "Expected an array of events" });
      }

      const createdEvents = [];
      for (const jsonEvent of jsonEvents) {
        const eventData = {
          title: jsonEvent.title || jsonEvent.summary || "Untitled Event",
          description: jsonEvent.description || jsonEvent.notes || null,
          startTime: new Date(jsonEvent.start || jsonEvent.startTime),
          endTime: new Date(jsonEvent.end || jsonEvent.endTime || jsonEvent.start),
          location: jsonEvent.location || null,
          category: jsonEvent.category || jsonEvent.type || "default",
          status: "upcoming",
          needsAction: false,
        };

        const event = await storage.createEvent(eventData);
        createdEvents.push(event);
      }

      res.status(201).json({ imported: createdEvents.length, events: createdEvents });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import events" });
    }
  });

  app.get("/api/tasks", async (req, res) => {
    try {
      const eventId = req.query.eventId as string | undefined;
      if (eventId) {
        const tasks = await storage.getTasksByEventId(eventId);
        return res.json(tasks);
      }
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:eventId", async (req, res) => {
    try {
      const tasks = await storage.getTasksByEventId(req.params.eventId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const parsed = insertTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const task = await storage.createTask(parsed.data);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  app.post("/api/ai/generate-tasks/:eventId", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      await storage.deleteTasksByEventId(event.id);

      const generated = await generateTasksForEvent(event);

      const createdTasks = [];
      for (const taskData of generated.tasks) {
        const task = await storage.createTask({
          eventId: event.id,
          title: taskData.title,
          priority: taskData.priority,
          completed: false,
        });
        createdTasks.push(task);
      }

      res.json({ tasks: createdTasks });
    } catch (error) {
      console.error("Generate tasks error:", error);
      res.status(500).json({ error: "Failed to generate tasks" });
    }
  });

  app.post("/api/ai/week-summary", async (req, res) => {
    try {
      const allEvents = await storage.getEvents();
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const weekEvents = allEvents.filter((event) => {
        const eventDate = new Date(event.startTime);
        return eventDate >= weekStart && eventDate <= weekEnd;
      });

      const summary = await generateWeekSummary(weekEvents);
      res.json(summary);
    } catch (error) {
      console.error("Week summary error:", error);
      res.status(500).json({ error: "Failed to generate week summary" });
    }
  });

  app.post("/api/ai/daily-plan", async (req, res) => {
    try {
      const allEvents = await storage.getEvents();
      const now = new Date();
      const dayStart = startOfDay(now);
      const dayEnd = endOfDay(now);

      const todayEvents = allEvents.filter((event) => {
        const eventDate = new Date(event.startTime);
        return eventDate >= dayStart && eventDate <= dayEnd;
      });

      const plan = await generateDailyPlan(todayEvents);
      res.json(plan);
    } catch (error) {
      console.error("Daily plan error:", error);
      res.status(500).json({ error: "Failed to generate daily plan" });
    }
  });

  app.post("/api/ai/draft-email/:eventId", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const email = await generateEmailDraft(event);
      res.json({ email });
    } catch (error) {
      console.error("Draft email error:", error);
      res.status(500).json({ error: "Failed to draft email" });
    }
  });

  app.get("/api/ai/free-slots", async (req, res) => {
    try {
      const allEvents = await storage.getEvents();
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      const slots = findFreeSlots(allEvents, date);
      res.json(slots);
    } catch (error) {
      console.error("Free slots error:", error);
      res.status(500).json({ error: "Failed to find free slots" });
    }
  });

  return httpServer;
}
