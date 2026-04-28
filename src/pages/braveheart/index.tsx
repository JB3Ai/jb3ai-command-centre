import { Scale } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function BraveheartPage() {
  return (
    <PlaceholderPage
      icon={Scale}
      title="BRAVEHEART"
      description="Matters and creditor accounts — extends hub_braveheart with priority, credit-record flags, IMED status, attorney metadata, and last correspondence timestamps."
      phase="Phase 2"
      upcoming={[
        "24 creditor rows seeded from creditors-dashboard.html (Task #9)",
        "Correspondence drafting from email triggers",
        "Credit-record flag indicator + IMED status pill",
        "Linked Gmail thread preview per matter",
      ]}
    />
  );
}
