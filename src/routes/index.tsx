import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { OtEntryForm } from "@/components/OtEntryForm";

export const Route = createFileRoute("/")({
  component: EntryPage,
});

function EntryPage() {
  return (
    <AppShell title="OT Entry">
      <OtEntryForm />
    </AppShell>
  );
}
