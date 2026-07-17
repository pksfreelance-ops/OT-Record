import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AuthPanel } from "@/components/AuthPanel";
import { MembersManager } from "@/components/MembersManager";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="space-y-4">
        <AuthPanel />
        <MembersManager />
      </div>
    </AppShell>
  );
}
