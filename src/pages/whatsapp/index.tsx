import { MessageSquare } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function WhatsAppPage() {
  return (
    <PlaceholderPage
      icon={MessageSquare}
      title="WhatsApp"
      description="Read-only mirror of the WhatsApp bridge — Go bridge + Python MCP push messages into hub_whatsapp_messages. Bridge dependency: start-whatsapp-bridge.bat must be running on the Windows PC."
      phase="Phase 3"
      upcoming={[
        "Threaded conversation view by JID",
        "Flag/star messages for follow-up",
        "Outbound draft → bridge send",
        "Media attachment indicator",
      ]}
    />
  );
}
