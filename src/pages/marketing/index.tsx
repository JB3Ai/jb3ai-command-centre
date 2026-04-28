import { Megaphone } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function MarketingPage() {
  return (
    <PlaceholderPage
      icon={Megaphone}
      title="Marketing & CRM"
      description="Lead pipeline by stage — new, qualified, contacted, proposal, won, lost. Sources include Meta ads, referral, website, LinkedIn, and manual entry."
      phase="Phase 3"
      upcoming={[
        "Stage-based kanban with drag-to-progress",
        "Exposure totals (gold callout) per stage",
        "Last-touch ageing alerts",
        "Meta integration (subject to app review approval)",
      ]}
    />
  );
}
