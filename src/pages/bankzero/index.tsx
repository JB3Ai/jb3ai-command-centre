import { Wallet } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function BankZeroPage() {
  return (
    <PlaceholderPage
      icon={Wallet}
      title="BankZero"
      description="Personal finance — manual CSV upload only. BankZero has no public API, so statements are imported into hub_bankzero_transactions on demand."
      phase="Phase 4"
      upcoming={[
        "CSV file upload with column auto-mapping",
        "Category assignment + saved rules",
        "Running balance and monthly spend chart",
        "Gold-only callout for exposure totals",
      ]}
    />
  );
}
