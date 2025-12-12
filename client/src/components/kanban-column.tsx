import { useDrop } from "react-dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DraggableEventCard } from "./draggable-event-card";
import { getColumnTitle, getColumnColor } from "@/lib/event-utils";
import type { Event, KanbanColumn as KanbanColumnType } from "@shared/schema";
import { Inbox } from "lucide-react";

interface KanbanColumnProps {
  column: KanbanColumnType;
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventDrop: (eventId: string, column: KanbanColumnType) => void;
}

export function KanbanColumn({ column, events, onEventClick, onEventDrop }: KanbanColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "event",
    drop: (item: { id: string }) => {
      console.log('Dropping event:', item.id, 'into column:', column);
      onEventDrop(item.id, column);
      return undefined; // Explicitly return undefined for drop result
    },
    canDrop: () => true, // Explicitly allow drops
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [column, onEventDrop]); // Add dependencies

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      className={`flex flex-col h-full rounded-lg transition-colors ${
        isActive ? "bg-accent/50 ring-2 ring-primary/20" : ""
      }`}
      data-testid={`column-${column}`}
    >
      <div className="sticky top-0 z-10 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-t-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getColumnColor(column)}`} />
            <h3 className="font-semibold text-sm">{getColumnTitle(column)}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {events.length}
          </span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 min-h-[200px]">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                {isActive ? "Drop here" : "No events"}
              </p>
            </div>
          ) : (
            events.map((event) => (
              <DraggableEventCard
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}