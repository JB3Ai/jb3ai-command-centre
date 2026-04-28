import { FolderGit2 } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function ProjectsPage() {
  return (
    <PlaceholderPage
      icon={FolderGit2}
      title="Projects"
      description="GitHub repos, cPanel sites, and VSCode commit activity in one view. VSCode has no remote API — workaround is GitHub commit signal."
      phase="Phase 2"
      upcoming={[
        "Repo list with last commit + open PR count",
        "cPanel uptime + disk usage (UAPI behind login)",
        "Commit-activity heatmap by project",
        "Quick deploy → Vercel project mapping",
      ]}
    />
  );
}
