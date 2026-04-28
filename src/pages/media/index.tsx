import { Image } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function MediaPage() {
  return (
    <PlaceholderPage
      icon={Image}
      title="Media Kanban"
      description="Ideas → prompt-ready → rendering → review → done. Image, video, audio, copy, and design assets tracked through a single board with thumbnails."
      phase="Phase 3"
      upcoming={[
        "Drag-and-drop column reordering",
        "Thumbnail preview + asset URL link-out",
        "Prompt history per item (with diff view)",
        "Bulk export / archive controls",
      ]}
    />
  );
}
