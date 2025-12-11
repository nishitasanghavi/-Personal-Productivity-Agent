import { Event, KanbanColumn } from "@shared/schema";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, isToday, isSameWeek, isAfter, isBefore, addDays } from "date-fns";

export function getEventColumn(event: Event): KanbanColumn {
  if (event.needsAction) {
    return "needsAction";
  }

  const now = new Date();
  const eventStart = new Date(event.startTime);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const twoWeeksFromNow = addDays(now, 14);

  if (eventStart >= todayStart && eventStart <= todayEnd) {
    return "today";
  }

  if (eventStart > todayEnd && eventStart <= weekEnd) {
    return "thisWeek";
  }

  if (eventStart > weekEnd && eventStart <= twoWeeksFromNow) {
    return "upcoming";
  }

  return "backlog";
}

export function getColumnTitle(column: KanbanColumn): string {
  switch (column) {
    case "today":
      return "Today";
    case "thisWeek":
      return "This Week";
    case "upcoming":
      return "Upcoming";
    case "backlog":
      return "Backlog";
    case "needsAction":
      return "Needs Action";
  }
}

export function getColumnColor(column: KanbanColumn): string {
  switch (column) {
    case "today":
      return "bg-chart-1";
    case "thisWeek":
      return "bg-chart-2";
    case "upcoming":
      return "bg-chart-3";
    case "backlog":
      return "bg-chart-4";
    case "needsAction":
      return "bg-chart-5";
  }
}

export function formatEventTime(event: Event): string {
  const start = new Date(event.startTime);
  return start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatEventDate(event: Event): string {
  const start = new Date(event.startTime);
  return start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function groupEventsByColumn(events: Event[]): Record<KanbanColumn, Event[]> {
  const groups: Record<KanbanColumn, Event[]> = {
    today: [],
    thisWeek: [],
    upcoming: [],
    backlog: [],
    needsAction: [],
  };

  events.forEach((event) => {
    const column = getEventColumn(event);
    groups[column].push(event);
  });

  Object.keys(groups).forEach((key) => {
    groups[key as KanbanColumn].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  });

  return groups;
}
