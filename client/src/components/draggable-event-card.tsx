// draggable-event-card.tsx with separate drag handle
import { useDrag } from "react-dnd";
import { Clock, MapPin, GripVertical, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEventTime, formatEventDate } from "@/lib/event-utils";
import type { Event } from "@shared/schema";

interface DraggableEventCardProps {
  event: Event;
  onClick: () => void;
}

export function DraggableEventCard({ event, onClick }: DraggableEventCardProps) {
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: "event",
    item: { id: event.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [event.id]);

  return (
    <Card
      ref={dragPreview as unknown as React.RefObject<HTMLDivElement>}
      className={`p-4 transition-all duration-200 group ${
        isDragging ? "opacity-50 rotate-2 scale-105" : ""
      }`}
      onClick={onClick}
      data-testid={`card-event-${event.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Only the grip icon is draggable */}
        <div 
          ref={drag as unknown as React.RefObject<HTMLDivElement>}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm leading-tight line-clamp-2">
              {event.title}
            </h4>
            {event.needsAction && (
              <AlertCircle className="h-4 w-4 text-chart-5 flex-shrink-0" />
            )}
          </div>
          
          {event.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {formatEventTime(event)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatEventDate(event)}
            </span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {event.category && event.category !== "default" && (
            <Badge variant="outline" className="text-xs">
              {event.category}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}