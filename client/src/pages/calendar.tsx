import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CalendarView } from "@/components/calendar-view";
import { EventModal } from "@/components/event-modal";
import { CalendarSkeleton } from "@/components/loading-skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, newDate }: { eventId: string; newDate: Date }) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      const originalStart = new Date(event.startTime);
      const duration = new Date(event.endTime).getTime() - originalStart.getTime();

      const newStartTime = new Date(newDate);
      newStartTime.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

      await apiRequest("PATCH", `/api/events/${eventId}`, {
        startTime: newStartTime.toISOString(),
        endTime: new Date(newStartTime.getTime() + duration).toISOString(),
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

  const handleEventDrop = (eventId: string, newDate: Date) => {
    updateEventMutation.mutate({ eventId, newDate });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your events on a monthly calendar
          </p>
        </div>
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" data-testid="text-calendar-title">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your events on a monthly calendar
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <CalendarView
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
