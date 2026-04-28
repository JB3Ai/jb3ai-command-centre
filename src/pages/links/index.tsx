import { Link2 } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function LinksPage() {
  return (
    <PlaceholderPage
      icon={Link2}
      title="Links"
      description="Clickable index of every URL that matters — clients, projects, references, admin portals. Pinned items stick to the top; everything else sorted by category."
      phase="Phase 2"
      upcoming={[
        "Inline edit + drag-to-reorder",
        "Category filter chips with counts",
        "Right-click → copy / open in new tab",
        "Search across label, URL, notes",
      ]}
    />
  );
}
