import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { KanbanColumn } from "./kanban-column";
import { kanbanColumns, type Event, type KanbanColumn as KanbanColumnType } from "@shared/schema";
import { groupEventsByColumn } from "@/lib/event-utils";

interface KanbanBoardProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventDrop: (eventId: string, column: KanbanColumnType) => void;
}

export function KanbanBoard({ events, onEventClick, onEventDrop }: KanbanBoardProps) {
  const groupedEvents = groupEventsByColumn(events);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 h-full" data-testid="kanban-board">
        {kanbanColumns.map((column) => (
          <div key={column} className="bg-card rounded-lg border min-h-[400px] flex flex-col">
            <KanbanColumn
              column={column}
              events={groupedEvents[column]}
              onEventClick={onEventClick}
              onEventDrop={onEventDrop}
            />
          </div>
        ))}
      </div>
    </DndProvider>
  );
}
