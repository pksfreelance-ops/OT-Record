import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RecordsList } from "@/components/RecordsList";

export const Route = createFileRoute("/records")({
  component: RecordsPage,
});

function RecordsPage() {
  return (
    <AppShell title="Records">
      <RecordsList />
    </AppShell>
  );
}
