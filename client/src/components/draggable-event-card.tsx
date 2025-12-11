import { useDrag } from "react-dnd";
import { EventCard } from "./event-card";
import type { Event } from "@shared/schema";

interface DraggableEventCardProps {
  event: Event;
  onClick: () => void;
}

export function DraggableEventCard({ event, onClick }: DraggableEventCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "event",
    item: { id: event.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      className={isDragging ? "opacity-50" : ""}
    >
      <EventCard event={event} isDragging={isDragging} onClick={onClick} />
    </div>
  );
}
