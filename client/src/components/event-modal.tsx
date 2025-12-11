import { useState } from "react";
import { X, Clock, MapPin, Calendar, Sparkles, CheckSquare, Mail, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Event, Task } from "@shared/schema";

interface EventModalProps {
  event: Event | null;
  open: boolean;
  onClose: () => void;
}

export function EventModal({ event, open, onClose }: EventModalProps) {
  const [emailDraft, setEmailDraft] = useState<string>("");

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${event?.id}`],
    enabled: !!event?.id,
  });

  const generateTasksMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/ai/generate-tasks/${event?.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${event?.id}`] });
    },
  });

  const generateEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/ai/draft-email/${event?.id}`);
      return response.json();
    },
    onSuccess: (data) => {
      setEmailDraft(data.email);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      await apiRequest("PATCH", `/api/tasks/${taskId}`, {
        completed: !task?.completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${event?.id}`] });
    },
  });

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden" data-testid="event-modal">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-semibold pr-8">
              {event.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1">
          <TabsList className="w-full justify-start px-6 border-b rounded-none bg-transparent h-auto py-0">
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              data-testid="tab-details"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              data-testid="tab-tasks"
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              AI Tasks
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              data-testid="tab-email"
            >
              <Mail className="h-4 w-4 mr-1" />
              Draft Email
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 max-h-[60vh]">
            <TabsContent value="details" className="p-6 m-0 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(event.startTime), "EEEE, MMMM d, yyyy")}</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(event.startTime), "h:mm a")} -{" "}
                  {format(new Date(event.endTime), "h:mm a")}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}

              {event.category && event.category !== "default" && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{event.category}</Badge>
                  {event.needsAction && (
                    <Badge variant="destructive">Needs Action</Badge>
                  )}
                </div>
              )}

              {event.description && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="p-6 m-0 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">AI-Generated Tasks</h4>
                <Button
                  size="sm"
                  onClick={() => generateTasksMutation.mutate()}
                  disabled={generateTasksMutation.isPending}
                  data-testid="button-generate-tasks"
                >
                  {generateTasksMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Tasks
                </Button>
              </div>

              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks yet. Click "Generate Tasks" to create AI-powered action items.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <Checkbox
                        checked={task.completed || false}
                        onCheckedChange={() => toggleTaskMutation.mutate(task.id)}
                        data-testid={`checkbox-task-${task.id}`}
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                        {task.priority && (
                          <Badge
                            variant="outline"
                            className={`text-xs mt-1 ${
                              task.priority === "high"
                                ? "border-chart-5 text-chart-5"
                                : task.priority === "medium"
                                ? "border-chart-4 text-chart-4"
                                : ""
                            }`}
                          >
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="email" className="p-6 m-0 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">AI Email Draft</h4>
                <Button
                  size="sm"
                  onClick={() => generateEmailMutation.mutate()}
                  disabled={generateEmailMutation.isPending}
                  data-testid="button-generate-email"
                >
                  {generateEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Email
                </Button>
              </div>

              {emailDraft ? (
                <div className="space-y-3">
                  <Textarea
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    data-testid="textarea-email-draft"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(emailDraft)}>
                      Copy to Clipboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click "Generate Email" to draft a professional email for this event.</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
