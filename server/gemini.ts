import { GoogleGenAI } from "@google/genai";
import type { Event } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export async function generateTasksForEvent(event: Event): Promise<GeneratedTasks> {
  const prompt = `You are a productivity assistant. Based on this calendar event, generate 3-5 actionable tasks that would help prepare for or follow up on this event.

Event: "${event.title}"
Description: ${event.description || "No description provided"}
Location: ${event.location || "No location specified"}
Date: ${new Date(event.startTime).toLocaleDateString()}
Time: ${new Date(event.startTime).toLocaleTimeString()} - ${new Date(event.endTime).toLocaleTimeString()}

Respond with a JSON object in this exact format:
{
  "tasks": [
    { "title": "Task description", "priority": "high" },
    { "title": "Another task", "priority": "medium" }
  ]
}

Priority should be "high", "medium", or "low" based on importance and urgency.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return parsed as GeneratedTasks;
  } catch (error) {
    console.error("Failed to generate tasks:", error);
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
      summary: "You have no events scheduled this week. Consider planning some activities or using this time for deep work.",
      highlights: [],
      totalEvents: 0,
    };
  }

  const eventsList = events
    .map(
      (e) =>
        `- ${e.title} on ${new Date(e.startTime).toLocaleDateString()} at ${new Date(e.startTime).toLocaleTimeString()}`
    )
    .join("\n");

  const prompt = `You are a helpful assistant summarizing someone's weekly calendar. Analyze these events and provide a helpful summary.

Events this week:
${eventsList}

Respond with a JSON object in this exact format:
{
  "summary": "A 2-3 sentence overview of the week's activities",
  "highlights": ["Key highlight 1", "Key highlight 2", "Key highlight 3"]
}

Be concise and helpful. Focus on what's most important.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      totalEvents: events.length,
    } as WeekSummary;
  } catch (error) {
    console.error("Failed to generate week summary:", error);
    return {
      summary: `You have ${events.length} events this week. Review your calendar to prepare for upcoming commitments.`,
      highlights: events.slice(0, 3).map((e) => e.title),
      totalEvents: events.length,
    };
  }
}

export async function generateDailyPlan(events: Event[]): Promise<DailyPlan> {
  if (events.length === 0) {
    return {
      plan: "You have no events scheduled today. This is a great opportunity for focused work or personal projects.",
      tasks: [
        "Review your weekly goals",
        "Work on high-priority tasks",
        "Plan for tomorrow",
      ],
    };
  }

  const eventsList = events
    .map(
      (e) =>
        `- ${new Date(e.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}: ${e.title} (${e.description || "no description"})`
    )
    .join("\n");

  const prompt = `You are a productivity coach helping plan someone's day. Based on their calendar events, create a structured daily plan with actionable tasks.

Today's events:
${eventsList}

Respond with a JSON object in this exact format:
{
  "plan": "A brief overview of how to approach the day (2-3 sentences)",
  "tasks": ["Task 1 with specific action", "Task 2 with specific action", "Task 3", "Task 4", "Task 5"]
}

Include preparation tasks before events and follow-up tasks after. Be specific and actionable.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    return JSON.parse(text) as DailyPlan;
  } catch (error) {
    console.error("Failed to generate daily plan:", error);
    return {
      plan: `Today you have ${events.length} events. Prepare for each one and leave buffer time between meetings.`,
      tasks: events.map((e) => `Prepare for: ${e.title}`),
    };
  }
}

export async function generateEmailDraft(event: Event): Promise<string> {
  const prompt = `You are a professional assistant helping draft an email related to a calendar event.

Event: "${event.title}"
Description: ${event.description || "No description provided"}
Location: ${event.location || "No location specified"}
Date: ${new Date(event.startTime).toLocaleDateString()}
Time: ${new Date(event.startTime).toLocaleTimeString()} - ${new Date(event.endTime).toLocaleTimeString()}

Draft a professional email that could be sent to participants of this event. It could be:
- A meeting reminder
- A request for agenda items
- A follow-up after the meeting
- Or any other appropriate communication

Make it professional but friendly. Include a subject line at the top.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Unable to generate email draft.";
  } catch (error) {
    console.error("Failed to generate email:", error);
    return `Subject: ${event.title}\n\nHi,\n\nThis is a reminder about our upcoming event: ${event.title}.\n\nDate: ${new Date(event.startTime).toLocaleDateString()}\nTime: ${new Date(event.startTime).toLocaleTimeString()}\n${event.location ? `Location: ${event.location}` : ""}\n\nPlease let me know if you have any questions.\n\nBest regards`;
  }
}

export interface FreeSlot {
  start: string;
  end: string;
  duration: number;
}

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

    if (eventEnd > currentTime) {
      currentTime = eventEnd;
    }
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
