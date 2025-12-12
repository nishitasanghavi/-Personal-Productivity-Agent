import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
import type { Event } from "@shared/schema";

/* ---------- Initialize Client ---------- */

const API_KEY = String(process.env.GROQ_API_KEY ?? "").trim();

let groq: Groq | null = null;
const MOCK_MODE = process.env.GROQ_MOCK === "true" || !API_KEY;
const inMemoryCache = new Map<string, { text: string; expiresAt: number }>();

if (API_KEY.length > 0) {
  groq = new Groq({ apiKey: API_KEY });
  console.log("✅ Groq initialized successfully");
} else {
  console.warn("⚠️  GROQ_API_KEY not set — running in MOCK mode.");
}

// Groq models - all blazing fast!
const MODEL_NAME = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

/* ---------- Types ---------- */
export interface GeneratedTasks {
  tasks: Array<{
    title: string;
    priority: "high" | "medium" | "low";
  }>;
}

export interface WeekSummary {
  summary: string;
  highlights: string[];
  totalEvents: number;
}

export interface DailyPlan {
  plan: string;
  tasks: string[];
}

export interface FreeSlot {
  start: string;
  end: string;
  duration: number;
}

/* ---------- Helper: safeGenerate ---------- */

async function safeGenerate(prompt: string, expectJson = true): Promise<string> {
  const cacheKey = `${expectJson ? "j" : "t"}:${prompt.slice(0, 200)}`;
  const cached = inMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log("📦 Using cached response");
    return cached.text;
  }

  // MOCK MODE
  if (MOCK_MODE || !groq) {
    const mock = expectJson
      ? JSON.stringify({
          tasks: [
            { title: "Prepare slides / notes", priority: "high" },
            { title: "Review agenda", priority: "medium" },
            { title: "Send reminder", priority: "low" },
          ],
        })
      : "Mock response: AI disabled.";
    inMemoryCache.set(cacheKey, { text: mock, expiresAt: Date.now() + 60_000 });
    return mock;
  }

  // REAL API CALL
  try {
    console.log(`🚀 Calling Groq API (model: ${MODEL_NAME})...`);
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: expectJson
            ? "You are a helpful assistant that responds ONLY with valid JSON. No markdown, no explanations, just pure JSON."
            : "You are a helpful productivity assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: MODEL_NAME,
      temperature: 0.7,
      max_tokens: 1000,
      response_format: expectJson ? { type: "json_object" } : undefined,
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    console.log("✅ Groq API call successful");

    inMemoryCache.set(cacheKey, { text, expiresAt: Date.now() + 300_000 }); // 5 min cache
    return text;
  } catch (err: any) {
    console.error("=== Groq ERROR ===");
    console.error(err?.message || err);

    const fallback = expectJson
      ? JSON.stringify({
          tasks: [
            { title: "Prepare task (fallback)", priority: "medium" },
            { title: "Review agenda (fallback)", priority: "high" },
            { title: "Follow up (fallback)", priority: "low" },
          ],
        })
      : "Unable to generate content.";

    inMemoryCache.set(cacheKey, { text: fallback, expiresAt: Date.now() + 60_000 });
    return fallback;
  }
}

/* ---------- Functions ---------- */

export async function generateTasksForEvent(event: Event): Promise<GeneratedTasks> {
  const prompt = `Generate 3-5 actionable tasks for this calendar event.

Event: "${event.title}"
Description: ${event.description || "No description provided"}
Location: ${event.location || "No location specified"}
Date: ${new Date(event.startTime).toLocaleDateString()}
Time: ${new Date(event.startTime).toLocaleTimeString()} - ${new Date(event.endTime).toLocaleTimeString()}

Return JSON in this exact format:
{
  "tasks": [
    { "title": "Task description", "priority": "high" }
  ]
}`;

  const raw = await safeGenerate(prompt, true);

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tasks)) throw new Error("Bad tasks shape");
    return parsed as GeneratedTasks;
  } catch {
    return {
      tasks: [
        { title: `Prepare for: ${event.title}`, priority: "medium" },
        { title: "Review agenda and materials", priority: "high" },
        { title: "Follow up after the event", priority: "low" },
      ],
    };
  }
}

export async function generateWeekSummary(events: Event[]): Promise<WeekSummary> {
  if (events.length === 0) {
    return {
      summary: "No events this week. Great time to focus on deep work.",
      highlights: [],
      totalEvents: 0,
    };
  }

  const eventsList = events
    .slice(0, 15) // Show more events for better context
    .map(
      (e) => {
        const date = new Date(e.startTime);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return `- ${e.title} (${e.category}) - ${day} at ${time}${e.location ? ` @ ${e.location}` : ''}`;
      }
    )
    .join("\n");

  const prompt = `You are analyzing someone's weekly calendar. Provide an insightful, natural summary.

Events this week:
${eventsList}

Total events: ${events.length}

Analyze the week and provide:
1. A warm, conversational summary (2-3 sentences) highlighting the week's theme, busiest days, and work-life balance
2. Top 3 most important highlights or things to focus on

Return JSON in this exact format:
{
  "summary": "Your insightful summary here...",
  "highlights": ["Most important item", "Second priority", "Third focus area"]
}`;

  const raw = await safeGenerate(prompt, true);

  try {
    const parsed = JSON.parse(raw);
    return {
      summary: parsed.summary ?? `You have ${events.length} events scheduled this week.`,
      highlights: Array.isArray(parsed.highlights) && parsed.highlights.length > 0
        ? parsed.highlights
        : events.slice(0, 3).map((e) => e.title),
      totalEvents: events.length,
    };
  } catch {
    return {
      summary: `You have ${events.length} events scheduled this week.`,
      highlights: events.slice(0, 3).map((e) => e.title),
      totalEvents: events.length,
    };
  }
}

export async function generateDailyPlan(events: Event[]): Promise<DailyPlan> {
  if (events.length === 0) {
    return {
      plan: "No events today — perfect day for focused work.",
      tasks: ["Review goals", "Work on high-priority items", "Plan tomorrow"],
    };
  }

  // Group events by time of day for better context
  const morning = events.filter(e => new Date(e.startTime).getHours() < 12);
  const afternoon = events.filter(e => {
    const h = new Date(e.startTime).getHours();
    return h >= 12 && h < 17;
  });
  const evening = events.filter(e => new Date(e.startTime).getHours() >= 17);

  const eventsList = events
    .map(
      (e) => {
        const time = new Date(e.startTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const duration = Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000);
        return `- ${time}: ${e.title} (${duration}min, ${e.category})${e.location ? ` @ ${e.location}` : ''}`;
      }
    )
    .join("\n");

  const prompt = `You are a personal productivity assistant helping someone plan their day.

Today's Schedule:
${eventsList}

Morning events: ${morning.length}
Afternoon events: ${afternoon.length}
Evening events: ${evening.length}

Create a daily plan that:
1. Gives an encouraging overview (2-3 sentences) about the day's flow and energy management
2. Suggests 3-5 specific actionable tasks or reminders to help them succeed today

Consider:
- Prep time before important meetings
- Travel time if locations change
- Energy management (busy periods vs breathing room)
- Work-life balance

Return JSON in this exact format:
{
  "plan": "Your encouraging daily overview here...",
  "tasks": ["Actionable task 1", "Actionable task 2", "Actionable task 3"]
}`;

  const raw = await safeGenerate(prompt, true);

  try {
    const parsed = JSON.parse(raw);
    return {
      plan: parsed.plan ?? `You have ${events.length} events scheduled today.`,
      tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0
        ? parsed.tasks
        : events.slice(0, 3).map((e) => `Prepare for: ${e.title}`),
    };
  } catch {
    return {
      plan: `You have ${events.length} events scheduled today.`,
      tasks: events.map((e) => `Prepare for: ${e.title}`),
    };
  }
}

export async function generateEmailDraft(event: Event): Promise<string> {
  const prompt = `Draft a professional email for this event:

Event: "${event.title}"
Description: ${event.description}
Location: ${event.location}
Date: ${new Date(event.startTime).toLocaleDateString()}
Time: ${new Date(event.startTime).toLocaleTimeString()}

Write a clear, professional email. Return only the email text.`;

  const raw = await safeGenerate(prompt, false);
  return raw;
}

/* ---------- Free Slot Utility ---------- */
export function findFreeSlots(events: Event[], date: Date): FreeSlot[] {
  const dayStart = new Date(date);
  dayStart.setHours(9, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(18, 0, 0, 0);

  const dayEvents = events
    .filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const freeSlots: FreeSlot[] = [];
  let currentTime = dayStart;

  for (const event of dayEvents) {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    if (eventStart > currentTime) {
      const duration = Math.round((eventStart.getTime() - currentTime.getTime()) / 60000);
      if (duration >= 30) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: eventStart.toISOString(),
          duration,
        });
      }
    }

    if (eventEnd > currentTime) currentTime = eventEnd;
  }

  if (currentTime < dayEnd) {
    const duration = Math.round((dayEnd.getTime() - currentTime.getTime()) / 60000);
    if (duration >= 30) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: dayEnd.toISOString(),
        duration,
      });
    }
  }

  return freeSlots;
}