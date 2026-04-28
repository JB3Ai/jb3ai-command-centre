import { Network } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function EcosystemPage() {
  return (
    <PlaceholderPage
      icon={Network}
      title="Connected Ecosystem"
      description="Visual map of every service Command Centre talks to — Mac MCP via Cloudflare Tunnel, WhatsApp bridge, Supabase, Vercel, Kestra, ClickUp, GCal, Gmail, Anthropic."
      phase="Phase 2"
      upcoming={[
        "Interactive workflow diagram with live edge states",
        "Click any node → drill into its CONFIG entry",
        "Tunnel + bridge heartbeat indicators",
        "Architecture export (markdown + SVG)",
      ]}
    />
  );
}
