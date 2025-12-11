import { useState, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import type { Event } from "@shared/schema";

interface CalendarViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventDrop: (eventId: string, newDate: Date) => void;
}

interface DayProps {
  date: Date;
  events: Event[];
  isCurrentMonth: boolean;
  onEventClick: (event: Event) => void;
  onEventDrop: (eventId: string, newDate: Date) => void;
}

function DraggableCalendarEvent({ event, onClick }: { event: Event; onClick: () => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "calendar-event",
    item: { id: event.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      className={`text-xs px-2 py-1 rounded truncate cursor-pointer bg-primary/10 text-foreground border border-primary/20 ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      data-testid={`calendar-event-${event.id}`}
    >
      <span className="font-medium">{format(new Date(event.startTime), "HH:mm")}</span>
      <span className="ml-1">{event.title}</span>
    </div>
  );
}

function CalendarDay({ date, events, isCurrentMonth, onEventClick, onEventDrop }: DayProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "calendar-event",
    drop: (item: { id: string }) => {
      onEventDrop(item.id, date);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const dayEvents = events.filter((event) =>
    isSameDay(new Date(event.startTime), date)
  );

  const displayEvents = dayEvents.slice(0, 3);
  const moreCount = dayEvents.length - 3;

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      className={`min-h-24 p-2 border-b border-r transition-colors ${
        !isCurrentMonth ? "bg-muted/30" : ""
      } ${isOver ? "bg-accent/50" : ""} ${
        isToday(date) ? "ring-2 ring-primary ring-inset" : ""
      }`}
      data-testid={`calendar-day-${format(date, "yyyy-MM-dd")}`}
    >
      <div className={`text-xs font-medium mb-1 ${
        isToday(date) ? "text-primary" : !isCurrentMonth ? "text-muted-foreground" : ""
      }`}>
        {format(date, "d")}
      </div>
      <div className="space-y-1">
        {displayEvents.map((event) => (
          <DraggableCalendarEvent
            key={event.id}
            event={event}
            onClick={() => onEventClick(event)}
          />
        ))}
        {moreCount > 0 && (
          <div className="text-xs text-muted-foreground px-2">
            +{moreCount} more
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarGrid({ events, currentMonth, onEventClick, onEventDrop }: {
  events: Event[];
  currentMonth: Date;
  onEventClick: (event: Event) => void;
  onEventDrop: (eventId: string, newDate: Date) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map((weekDay) => (
          <div
            key={weekDay}
            className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-r last:border-r-0"
          >
            {weekDay}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((dayDate, index) => (
          <CalendarDay
            key={index}
            date={dayDate}
            events={events}
            isCurrentMonth={isSameMonth(dayDate, currentMonth)}
            onEventClick={onEventClick}
            onEventDrop={onEventDrop}
          />
        ))}
      </div>
    </div>
  );
}

export function CalendarView({ events, onEventClick, onEventDrop }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4" data-testid="calendar-view">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} data-testid="button-prev-month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} data-testid="button-next-month">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={handleToday} data-testid="button-today">
              Today
            </Button>
          </div>
          <h2 className="text-xl font-semibold" data-testid="text-current-month">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="w-32" />
        </div>
        <CalendarGrid
          events={events}
          currentMonth={currentMonth}
          onEventClick={onEventClick}
          onEventDrop={onEventDrop}
        />
      </div>
    </DndProvider>
  );
}
