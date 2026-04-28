import { StickyNote } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function NotesPage() {
  return (
    <PlaceholderPage
      icon={StickyNote}
      title="Notes & Dropbox"
      description="Quick-capture dump — apple-notes mirror via apple-mcp, Dropbox uploads, and manual entries all flow into hub_notes_dump with tags and pin support."
      phase="Phase 2"
      upcoming={[
        "apple-mcp → Notes mirror (read-only)",
        "Quick-capture textarea wired to hub_quick_capture → ClickUp Inbox Triage",
        "Pin / archive / tag-filter views",
        "Search across body + tags",
      ]}
    />
  );
}
