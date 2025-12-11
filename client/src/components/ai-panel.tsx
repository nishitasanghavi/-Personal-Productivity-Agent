import { useState } from "react";
import { Sparkles, Calendar, ListTodo, Clock, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface WeekSummary {
  summary: string;
  highlights: string[];
  totalEvents: number;
}

interface DailyPlan {
  plan: string;
  tasks: string[];
}

interface FreeSlot {
  start: string;
  end: string;
  duration: number;
}

export function AIPanel() {
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [freeSlots, setFreeSlots] = useState<FreeSlot[] | null>(null);

  const weekSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/week-summary");
      return response.json() as Promise<WeekSummary>;
    },
    onSuccess: (data) => {
      setWeekSummary(data);
    },
  });

  const dailyPlanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/daily-plan");
      return response.json() as Promise<DailyPlan>;
    },
    onSuccess: (data) => {
      setDailyPlan(data);
    },
  });

  const freeSlotsQuery = useQuery<FreeSlot[]>({
    queryKey: ["/api/ai/free-slots"],
    enabled: false,
  });

  const freeSlotssMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/ai/free-slots");
      return response.json() as Promise<FreeSlot[]>;
    },
    onSuccess: (data) => {
      setFreeSlots(data);
    },
  });

  return (
    <div className="space-y-6 p-6" data-testid="ai-panel">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">AI Assistant</h2>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Week Summary</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => weekSummaryMutation.mutate()}
            disabled={weekSummaryMutation.isPending}
            data-testid="button-week-summary"
          >
            {weekSummaryMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {weekSummary ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{weekSummary.summary}</p>
            {weekSummary.highlights.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Highlights:</p>
                <ul className="space-y-1">
                  {weekSummary.highlights.map((highlight, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">-</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Badge variant="secondary" className="text-xs">
              {weekSummary.totalEvents} events this week
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click refresh to generate your weekly summary
          </p>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Daily Plan</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dailyPlanMutation.mutate()}
            disabled={dailyPlanMutation.isPending}
            data-testid="button-daily-plan"
          >
            {dailyPlanMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {dailyPlan ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{dailyPlan.plan}</p>
            {dailyPlan.tasks.length > 0 && (
              <div className="space-y-2">
                {dailyPlan.tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30"
                  >
                    <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click refresh to generate your daily plan
          </p>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Free Slots</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => freeSlotssMutation.mutate()}
            disabled={freeSlotssMutation.isPending}
            data-testid="button-free-slots"
          >
            {freeSlotssMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {freeSlots ? (
          <div className="space-y-2">
            {freeSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No free slots found today</p>
            ) : (
              freeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div className="text-sm">
                    <span className="font-medium">
                      {new Date(slot.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-muted-foreground mx-2">-</span>
                    <span className="font-medium">
                      {new Date(slot.end).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {slot.duration} min
                  </Badge>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click refresh to find available time slots
          </p>
        )}
      </Card>
    </div>
  );
}
