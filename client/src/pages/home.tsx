import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { KanbanBoard } from "@/components/kanban-board";
import { EventModal } from "@/components/event-modal";
import { KanbanBoardSkeleton } from "@/components/loading-skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, KanbanColumn } from "@shared/schema";
import { startOfDay, endOfDay, addDays, endOfWeek } from "date-fns";

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, column }: { eventId: string; column: KanbanColumn }) => {
      const now = new Date();
      let newStartTime: Date;
      let needsAction = false;

      switch (column) {
        case "today":
          newStartTime = new Date();
          newStartTime.setHours(9, 0, 0, 0);
          break;
        case "thisWeek":
          newStartTime = addDays(endOfDay(now), 1);
          newStartTime.setHours(9, 0, 0, 0);
          break;
        case "upcoming":
          newStartTime = addDays(endOfWeek(now, { weekStartsOn: 1 }), 1);
          newStartTime.setHours(9, 0, 0, 0);
          break;
        case "backlog":
          newStartTime = addDays(now, 30);
          newStartTime.setHours(9, 0, 0, 0);
          break;
        case "needsAction":
          needsAction = true;
          const event = events.find((e) => e.id === eventId);
          newStartTime = event ? new Date(event.startTime) : now;
          break;
        default:
          newStartTime = now;
      }

      const event = events.find((e) => e.id === eventId);
      const duration = event
        ? new Date(event.endTime).getTime() - new Date(event.startTime).getTime()
        : 3600000;

      await apiRequest("PATCH", `/api/events/${eventId}`, {
        startTime: newStartTime.toISOString(),
        endTime: new Date(newStartTime.getTime() + duration).toISOString(),
        needsAction,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleEventDrop = (eventId: string, column: KanbanColumn) => {
    updateEventMutation.mutate({ eventId, column });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Kanban Board</h1>
          <p className="text-sm text-muted-foreground">
            Organize your events by dragging them between columns
          </p>
        </div>
        <KanbanBoardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Kanban Board</h1>
        <p className="text-sm text-muted-foreground">
          Organize your events by dragging them between columns
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard
          events={events}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
        />
      </div>

      <EventModal
        event={selectedEvent}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
