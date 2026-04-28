import { ToggleLeft } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function SubscriptionsPage() {
  return (
    <PlaceholderPage
      icon={ToggleLeft}
      title="Subscriptions"
      description="Toolbox of every paid service — status lights, monthly cost, renewal date, and a one-click cancel route. Powered by hub_subscriptions + hub_subscriptions_meta."
      phase="Phase 2"
      upcoming={[
        "Status light per service (active / paused / cancelled)",
        "Monthly + annual rollup with gold callout for exposure",
        "Renewal calendar + upcoming-charge alerts",
        "Cancel link / management URL per row",
      ]}
    />
  );
}
