import { UploadZone } from "@/components/upload-zone";
import { useLocation } from "wouter";

export default function UploadPage() {
  const [, setLocation] = useLocation();

  const handleUploadSuccess = () => {
    setTimeout(() => {
      setLocation("/");
    }, 1500);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" data-testid="text-upload-title">Upload Events</h1>
        <p className="text-sm text-muted-foreground">
          Import your calendar data from a JSON file
        </p>
      </div>

      <UploadZone onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}
