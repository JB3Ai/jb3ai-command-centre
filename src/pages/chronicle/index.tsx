import { CalendarDays } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function ChroniclePage() {
  return (
    <PlaceholderPage
      icon={CalendarDays}
      title="Monthly Chronicle"
      description="Current month + archive — auto-assembled narrative drawing from briefings, daily reviews, completed tasks, deploys, and key emails. Backed by hub_monthly_chronicles."
      phase="Phase 3"
      upcoming={[
        "Current-month rolling summary auto-refreshed by Kestra",
        "Highlights, metrics jsonb, body markdown",
        "Archive list — flip back to any prior month",
        "Export to docx for end-of-month reporting",
      ]}
    />
  );
}
