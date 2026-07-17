import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ExportRecords } from "@/components/ExportRecords";

export const Route = createFileRoute("/summary")({
  component: SummaryPage,
});

function SummaryPage() {
  return (
    <AppShell title="Summary">
      <ExportRecords />
    </AppShell>
  );
}
