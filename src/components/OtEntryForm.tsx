import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Save, RotateCcw, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_DEPARTMENTS,
  SLOT_IDS,
  type SlotId,
  TIME_RE,
  computeHours,
  slotPayload,
  type Member,
} from "@/lib/ot-slots";
import type { Tables } from "@/integrations/supabase/types";

type Department = Tables<"departments">;

type SlotState = {
  memberId: string | null;
  selected: boolean;
  start: string;
  end: string;
  overridden: boolean;
};

const today = () => format(new Date(), "yyyy-MM-dd");

function emptySlots(session: { start: string; end: string }): Record<SlotId, SlotState> {
  const out = {} as Record<SlotId, SlotState>;
  for (const i of SLOT_IDS) {
    out[i] = {
      memberId: null,
      selected: false,
      start: session.start,
      end: session.end,
      overridden: false,
    };
  }
  return out;
}

export function OtEntryForm() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [workDate, setWorkDate] = useState(today());
  const [department, setDepartment] = useState<string>(DEFAULT_DEPARTMENTS[0]);
  const [description, setDescription] = useState("");
  const [sessionStart, setSessionStart] = useState("16:00");
  const [sessionEnd, setSessionEnd] = useState("18:00");
  const [slots, setSlots] = useState<Record<SlotId, SlotState>>(() =>
    emptySlots({ start: "16:00", end: "18:00" }),
  );
  const [descError, setDescError] = useState<string | null>(null);
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [newDept, setNewDept] = useState("");

  const membersQuery = useQuery({
    queryKey: ["members", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Member[];
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Department[];
    },
  });

  const activeMembers = useMemo(
    () => (membersQuery.data ?? []).filter((m) => m.is_active).slice(0, SLOT_IDS.length),
    [membersQuery.data],
  );

  // Assign members to slots 1..10 by order (only when membership changes)
  useEffect(() => {
    setSlots((prev) => {
      const next = { ...prev };
      for (const i of SLOT_IDS) {
        const idx = i - 1;
        const member = activeMembers[idx];
        const cur = prev[i];
        const nextMemberId = member?.id ?? null;
        if (cur.memberId !== nextMemberId) {
          next[i] = {
            memberId: nextMemberId,
            selected: false,
            start: sessionStart,
            end: sessionEnd,
            overridden: false,
          };
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMembers.map((m) => m.id).join("|")]);

  const departmentOptions = useMemo(() => {
    const custom = (departmentsQuery.data ?? []).map((d) => d.name);
    const merged = [...DEFAULT_DEPARTMENTS];
    for (const n of custom) if (!merged.includes(n)) merged.push(n);
    return merged;
  }, [departmentsQuery.data]);

  function toggleSlot(i: SlotId, checked: boolean) {
    setSlots((prev) => {
      const cur = prev[i];
      return {
        ...prev,
        [i]: {
          ...cur,
          selected: checked,
          start: cur.overridden ? cur.start : sessionStart,
          end: cur.overridden ? cur.end : sessionEnd,
        },
      };
    });
  }

  function toggleAll(checked: boolean) {
    setSlots((prev) => {
      const next = { ...prev };
      for (const i of SLOT_IDS) {
        const cur = prev[i];
        if (!cur.memberId) continue;
        next[i] = {
          ...cur,
          selected: checked,
          start: cur.overridden ? cur.start : sessionStart,
          end: cur.overridden ? cur.end : sessionEnd,
        };
      }
      return next;
    });
  }

  function updateSlotTime(i: SlotId, field: "start" | "end", v: string) {
    setSlots((prev) => ({
      ...prev,
      [i]: { ...prev[i], [field]: v, overridden: true },
    }));
  }

  function resetSlot(i: SlotId) {
    setSlots((prev) => ({
      ...prev,
      [i]: { ...prev[i], start: sessionStart, end: sessionEnd, overridden: false },
    }));
  }

  function updateSessionStart(v: string) {
    setSessionStart(v);
    setSlots((prev) => {
      const next = { ...prev };
      for (const i of SLOT_IDS) {
        if (!prev[i].overridden) next[i] = { ...prev[i], start: v };
      }
      return next;
    });
  }

  function updateSessionEnd(v: string) {
    setSessionEnd(v);
    setSlots((prev) => {
      const next = { ...prev };
      for (const i of SLOT_IDS) {
        if (!prev[i].overridden) next[i] = { ...prev[i], end: v };
      }
      return next;
    });
  }

  const selectedList = useMemo(
    () => SLOT_IDS.filter((i) => slots[i].selected && slots[i].memberId),
    [slots],
  );
  const eligibleCount = activeMembers.length;
  const allSelected = eligibleCount > 0 && selectedList.length === eligibleCount;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const payload = {
        owner_id: user.id,
        work_date: workDate,
        department,
        description: description.trim(),
        session_start: sessionStart,
        session_end: sessionEnd,
        ...slotPayload(
          Object.fromEntries(
            SLOT_IDS.map((i) => [
              i,
              {
                memberId: slots[i].memberId,
                selected: slots[i].selected,
                start: slots[i].start,
                end: slots[i].end,
              },
            ]),
          ) as Record<SlotId, { memberId: string | null; selected: boolean; start: string; end: string }>,
        ),
      };
      const { error } = await supabase.from("ot_day_entries").insert(payload as never);
      if (error) throw error;
      return selectedList.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["ot_day_entries"] });
      toast.success(`Saved entry with ${count} employee${count === 1 ? "" : "s"}`);
      clearForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addDeptMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not signed in");
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name required");
      const { error } = await supabase
        .from("departments")
        .insert({ owner_id: user.id, name: trimmed } as never);
      if (error && !error.message.includes("duplicate")) throw error;
      return trimmed;
    },
    onSuccess: (name) => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setDepartment(name);
      setAddDeptOpen(false);
      setNewDept("");
      toast.success("Department added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function clearForm() {
    setDescription("");
    setDescError(null);
    setSlots((prev) => {
      const next = { ...prev };
      for (const i of SLOT_IDS) {
        next[i] = {
          memberId: prev[i].memberId,
          selected: false,
          start: sessionStart,
          end: sessionEnd,
          overridden: false,
        };
      }
      return next;
    });
  }

  function submit() {
    if (!description.trim()) {
      setDescError("Description is required");
      return;
    }
    setDescError(null);
    if (!department.trim()) {
      toast.error("Select a department");
      return;
    }
    if (selectedList.length === 0) {
      toast.error("Select at least one employee");
      return;
    }
    for (const i of selectedList) {
      const s = slots[i];
      if (!TIME_RE.test(s.start) || !TIME_RE.test(s.end)) {
        toast.error("Invalid time on a selected employee");
        return;
      }
    }
    saveMutation.mutate();
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record overtime</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sign in from Settings to record OT.
        </CardContent>
      </Card>
    );
  }

  const dateValue = (() => {
    const [y, m, d] = workDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  })();

  const totalHours = selectedList.reduce(
    (sum, i) => sum + computeHours(slots[i].start, slots[i].end),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record overtime</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Work date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateValue, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(d) => d && setWorkDate(format(d, "yyyy-MM-dd"))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Department</Label>
            <button
              type="button"
              onClick={() => setAddDeptOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          <div className="space-y-1">
            {departmentOptions.map((name) => (
              <label
                key={name}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border p-2 text-sm cursor-pointer",
                  department === name && "bg-muted/60 border-primary",
                )}
              >
                <Checkbox
                  checked={department === name}
                  onCheckedChange={(v) => v && setDepartment(name)}
                />
                <span className="truncate">{name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="sess-start">Session start</Label>
            <Input
              id="sess-start"
              type="time"
              step={60}
              value={sessionStart}
              onChange={(e) => updateSessionStart(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sess-end">Session end</Label>
            <Input
              id="sess-end"
              type="time"
              step={60}
              value={sessionEnd}
              onChange={(e) => updateSessionEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="ot-desc">Work description</Label>
          <Textarea
            id="ot-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was worked on?"
          />
          {descError && <p className="text-xs text-destructive">{descError}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Employees</Label>
            {eligibleCount > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => toggleAll(!allSelected)}
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            )}
          </div>

          {membersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : eligibleCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active members — add one in Settings.
            </p>
          ) : (
            <ul className="space-y-2">
              {SLOT_IDS.slice(0, eligibleCount).map((i) => {
                const s = slots[i];
                const member = activeMembers[i - 1];
                if (!member) return null;
                const hours = computeHours(s.start, s.end);
                return (
                  <li
                    key={i}
                    className={cn(
                      "rounded-md border border-border p-3",
                      s.selected ? "bg-muted/40" : "bg-background",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={s.selected}
                        onCheckedChange={(v) => toggleSlot(i, v === true)}
                        className="mt-1"
                        id={`slot-${i}`}
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`slot-${i}`}
                          className="block text-sm font-medium truncate"
                        >
                          {member.name}
                        </label>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.employee_id}
                          {member.designation ? ` · ${member.designation}` : ""}
                        </p>
                      </div>
                      {s.selected && (
                        <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                          {hours.toFixed(2)} h
                        </span>
                      )}
                    </div>
                    {s.selected && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor={`s-${i}`}
                            className="text-xs text-muted-foreground"
                          >
                            Start
                          </Label>
                          <Input
                            id={`s-${i}`}
                            type="time"
                            step={60}
                            value={s.start}
                            onChange={(ev) =>
                              updateSlotTime(i, "start", ev.target.value)
                            }
                            className={cn(
                              s.overridden &&
                                "border-amber-500 focus-visible:ring-amber-500",
                            )}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`e-${i}`}
                            className="text-xs text-muted-foreground"
                          >
                            End
                          </Label>
                          <Input
                            id={`e-${i}`}
                            type="time"
                            step={60}
                            value={s.end}
                            onChange={(ev) =>
                              updateSlotTime(i, "end", ev.target.value)
                            }
                            className={cn(
                              s.overridden &&
                                "border-amber-500 focus-visible:ring-amber-500",
                            )}
                          />
                        </div>
                        {s.overridden && (
                          <button
                            type="button"
                            onClick={() => resetSlot(i)}
                            className="col-span-2 inline-flex items-center gap-1 text-xs text-amber-600 hover:underline"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset to session times
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <p className="font-medium">{selectedList.length} selected</p>
          <p className="text-muted-foreground">{totalHours.toFixed(2)} h total</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={clearForm}
            disabled={saveMutation.isPending}
          >
            Clear
          </Button>
          <Button
            className="flex-1"
            onClick={submit}
            disabled={saveMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving…" : "Save entry"}
          </Button>
        </div>
      </CardContent>

      <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add department</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-dept">Department name</Label>
            <Input
              id="new-dept"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="e.g. Electrical, GT, South"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDeptOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addDeptMutation.mutate(newDept)}
              disabled={addDeptMutation.isPending}
            >
              {addDeptMutation.isPending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
