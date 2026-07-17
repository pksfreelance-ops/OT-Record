import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ChevronDown, Pencil, Trash2, Inbox, Clock } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  type DayEntry,
  type Member,
  type SlotId,
  activeSlots,
  computeHours,
  TIME_RE,
} from "@/lib/ot-slots";

type EditTarget = {
  entry: DayEntry;
  slot: SlotId;
  memberName: string;
};

export function RecordsList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EditTarget | null>(null);

  const entriesQuery = useQuery({
    queryKey: ["ot_day_entries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ot_day_entries")
        .select("*")
        .order("work_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DayEntry[];
    },
  });

  const membersQuery = useQuery({
    queryKey: ["members", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*");
      if (error) throw error;
      return data as Member[];
    },
  });

  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of membersQuery.data ?? []) map.set(m.id, m);
    return map;
  }, [membersQuery.data]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    for (const e of entriesQuery.data ?? []) {
      const list = map.get(e.work_date) ?? [];
      list.push(e);
      map.set(e.work_date, list);
    }
    return Array.from(map.entries()); // already ascending from query
  }, [entriesQuery.data]);

  const updateSlot = useMutation({
    mutationFn: async ({
      entry,
      slot,
      start,
      end,
    }: {
      entry: DayEntry;
      slot: SlotId;
      start: string;
      end: string;
    }) => {
      const patch = {
        [`emp${slot}_start_time`]: start,
        [`emp${slot}_end_time`]: end,
        [`emp${slot}_total_hours`]: computeHours(start, end),
      } as Record<string, unknown>;
      const { error } = await supabase
        .from("ot_day_entries")
        .update(patch as never)
        .eq("id", entry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ot_day_entries"] });
      toast.success("Record updated");
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSlot = useMutation({
    mutationFn: async ({ entry, slot }: { entry: DayEntry; slot: SlotId }) => {
      const remaining = activeSlots(entry).filter((s) => s.slot !== slot);
      if (remaining.length === 0) {
        const { error } = await supabase
          .from("ot_day_entries")
          .delete()
          .eq("id", entry.id);
        if (error) throw error;
        return;
      }
      const patch = {
        [`emp${slot}_selected`]: false,
        [`emp${slot}_start_time`]: null,
        [`emp${slot}_end_time`]: null,
        [`emp${slot}_total_hours`]: 0,
      } as Record<string, unknown>;
      const { error } = await supabase
        .from("ot_day_entries")
        .update(patch as never)
        .eq("id", entry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ot_day_entries"] });
      toast.success("Record deleted");
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openEdit(t: EditTarget) {
    const slotData = activeSlots(t.entry).find((s) => s.slot === t.slot);
    if (!slotData) return;
    setEditTarget(t);
    setEditStart(slotData.startTime);
    setEditEnd(slotData.endTime);
  }

  if (!user) {
    return (
      <div className="rounded-md border border-border p-6 text-sm text-muted-foreground">
        Sign in from Settings to view records.
      </div>
    );
  }
  if (entriesQuery.isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  if (groupedByDate.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border py-10 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No OT records yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groupedByDate.map(([date, entries]) => {
        const isOpen = expanded === date;
        const employeeCount = entries.reduce(
          (sum, e) => sum + activeSlots(e).length,
          0,
        );
        const totalHours = entries.reduce(
          (sum, e) =>
            sum + activeSlots(e).reduce((s, x) => s + x.totalHours, 0),
          0,
        );
        return (
          <div key={date} className="rounded-md border border-border bg-card">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : date)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {format(parseISO(date), "EEE, MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entries.length} entr{entries.length === 1 ? "y" : "ies"} ·{" "}
                  {employeeCount} employee{employeeCount === 1 ? "" : "s"} ·{" "}
                  {totalHours.toFixed(2)} h
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen && (
              <div className="space-y-3 border-t border-border p-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="mb-2">
                      <p className="text-sm font-medium">
                        {entry.department || "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Session {entry.session_start.slice(0, 5)}–
                        {entry.session_end.slice(0, 5)}
                      </p>
                      {entry.description && (
                        <p className="mt-1 whitespace-pre-wrap text-sm">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    <ul className="divide-y divide-border">
                      {activeSlots(entry).map((s) => {
                        const m = s.memberId ? memberMap.get(s.memberId) : null;
                        return (
                          <li
                            key={s.slot}
                            className="flex items-center gap-2 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm">
                                {m?.name ?? "Unknown"}
                                {m?.employee_id && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    · {m.employee_id}
                                  </span>
                                )}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {s.startTime}–{s.endTime}
                                <span className="ml-2 font-medium text-foreground">
                                  {s.totalHours.toFixed(2)} h
                                </span>
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                openEdit({
                                  entry,
                                  slot: s.slot,
                                  memberName: m?.name ?? "Unknown",
                                })
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({
                                  entry,
                                  slot: s.slot,
                                  memberName: m?.name ?? "Unknown",
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit OT time</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {editTarget.memberName} ·{" "}
                {format(parseISO(editTarget.entry.work_date), "MMM d, yyyy")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ed-start">Start</Label>
                  <Input
                    id="ed-start"
                    type="time"
                    step={60}
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ed-end">End</Label>
                  <Input
                    id="ed-end"
                    type="time"
                    step={60}
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">Total hours</span>
                <span className="text-lg font-semibold tabular-nums">
                  {computeHours(editStart, editEnd).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editTarget) return;
                if (!TIME_RE.test(editStart) || !TIME_RE.test(editEnd)) {
                  toast.error("Invalid time");
                  return;
                }
                updateSlot.mutate({
                  entry: editTarget.entry,
                  slot: editTarget.slot,
                  start: editStart,
                  end: editEnd,
                });
              }}
              disabled={updateSlot.isPending}
            >
              {updateSlot.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  {deleteTarget.memberName} ·{" "}
                  {format(parseISO(deleteTarget.entry.work_date), "MMM d, yyyy")}
                  . This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTarget &&
                deleteSlot.mutate({
                  entry: deleteTarget.entry,
                  slot: deleteTarget.slot,
                })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
