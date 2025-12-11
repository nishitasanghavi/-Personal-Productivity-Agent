import { useState, useCallback } from "react";
import { Upload, FileJson, X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface UploadZoneProps {
  onUploadSuccess?: () => void;
}

interface ParsedEvent {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  category?: string;
}

interface UploadResult {
  imported: number;
  events: ParsedEvent[];
}

export function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (events: ParsedEvent[]) => {
      const response = await apiRequest("POST", "/api/events/import", { events });
      return response.json() as Promise<UploadResult>;
    },
    onSuccess: (data) => {
      toast({
        title: "Events imported",
        description: `Successfully imported ${data.imported} events`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setSelectedFile(null);
      setPreview(null);
      onUploadSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const parseJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      let events: ParsedEvent[] = [];
      
      if (Array.isArray(data)) {
        events = data;
      } else if (data.events && Array.isArray(data.events)) {
        events = data.events;
      } else {
        throw new Error("Invalid JSON format. Expected an array of events or { events: [...] }");
      }

      const validatedEvents = events.map((event, index) => {
        if (!event.title) {
          throw new Error(`Event ${index + 1}: Missing required field 'title'`);
        }
        if (!event.start) {
          throw new Error(`Event ${index + 1}: Missing required field 'start'`);
        }
        
        return {
          title: event.title || event.summary || "Untitled Event",
          start: event.start || event.startTime || event.dtstart,
          end: event.end || event.endTime || event.dtend || event.start,
          description: event.description || event.notes || "",
          location: event.location || "",
          category: event.category || event.type || "default",
        };
      });

      setPreview(validatedEvents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse JSON file");
      setPreview(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      setSelectedFile(file);
      parseJsonFile(file);
    } else {
      setError("Please upload a valid JSON file");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      parseJsonFile(file);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  }, []);

  const handleImport = useCallback(() => {
    if (preview) {
      uploadMutation.mutate(preview);
    }
  }, [preview, uploadMutation]);

  return (
    <div className="space-y-6" data-testid="upload-zone">
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Drag & drop your calendar JSON
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          or click to browse your files
        </p>
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          data-testid="input-file-upload"
        />
        <Button variant="outline" asChild>
          <label htmlFor="file-upload" className="cursor-pointer">
            Select File
          </label>
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="font-medium text-destructive">Error parsing file</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {selectedFile && preview && (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <FileJson className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              data-testid="button-remove-file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="border rounded-lg">
            <div className="p-3 border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {preview.length} events found
                </span>
                <CheckCircle className="h-4 w-4 text-chart-2" />
              </div>
            </div>
            <ScrollArea className="h-48">
              <div className="p-3 space-y-2">
                {preview.map((event, index) => (
                  <div
                    key={index}
                    className="p-2 rounded bg-muted/30 text-sm"
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.start).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleRemoveFile}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={uploadMutation.isPending}
              data-testid="button-import-events"
            >
              {uploadMutation.isPending ? "Importing..." : "Import Events"}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h4 className="font-semibold mb-3">Expected JSON Format</h4>
        <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "events": [
    {
      "title": "Team Meeting",
      "start": "2024-12-15T10:00:00",
      "end": "2024-12-15T11:00:00",
      "description": "Weekly sync",
      "location": "Conference Room A",
      "category": "work"
    }
  ]
}`}
        </pre>
      </Card>
    </div>
  );
}
