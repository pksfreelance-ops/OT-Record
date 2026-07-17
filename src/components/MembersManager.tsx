import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Tables } from "@/integrations/supabase/types";

type Member = Tables<"members">;

const MAX_MEMBERS = 10;

const memberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  employee_id: z.string().trim().min(1, "Employee ID is required").max(50),
  designation: z.string().trim().max(100).default(""),
  default_start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  default_end_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof memberSchema>;

const emptyForm: FormValues = {
  name: "",
  employee_id: "",
  designation: "",
  default_start_time: "18:00",
  default_end_time: "20:00",
  is_active: true,
};

function toTimeInput(value: string) {
  return value.slice(0, 5);
}

export function MembersManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

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

  const members = membersQuery.data ?? [];
  const canAdd = members.length < MAX_MEMBERS;

  const upsertMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error("Not signed in");
      if (editing) {
        const { error } = await supabase
          .from("members")
          .update({
            name: values.name,
            employee_id: values.employee_id,
            designation: values.designation,
            default_start_time: values.default_start_time,
            default_end_time: values.default_end_time,
            is_active: values.is_active,
          })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("members").insert({
          owner_id: user.id,
          name: values.name,
          employee_id: values.employee_id,
          designation: values.designation,
          default_start_time: values.default_start_time,
          default_end_time: values.default_end_time,
          is_active: values.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success(editing ? "Member updated" : "Member added");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("members").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member removed");
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    setForm({
      name: m.name,
      employee_id: m.employee_id,
      designation: m.designation ?? "",
      default_start_time: toTimeInput(m.default_start_time),
      default_end_time: toTimeInput(m.default_end_time),
      is_active: m.is_active,
    });
    setErrors({});
    setDialogOpen(true);
  }

  function submit() {
    const parsed = memberSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    upsertMutation.mutate(parsed.data);
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team members</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sign in to manage your team.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Team members</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {members.length}/{MAX_MEMBERS} used
          </p>
        </div>
        <Button size="sm" onClick={openAdd} disabled={!canAdd}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {membersQuery.isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border py-8 text-center">
            <UserPlus className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No members yet</p>
            <Button size="sm" variant="secondary" onClick={openAdd}>
              Add your first member
            </Button>
          </div>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  {!m.is_active && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {m.employee_id}
                  {m.designation ? ` · ${m.designation}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {toTimeInput(m.default_start_time)} – {toTimeInput(m.default_end_time)}
                </p>
              </div>
              <Switch
                checked={m.is_active}
                onCheckedChange={(v) => toggleActive.mutate({ id: m.id, is_active: v })}
                aria-label="Active"
              />
              <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleteTarget(m)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
        {!canAdd && (
          <p className="text-center text-xs text-muted-foreground">
            Maximum {MAX_MEMBERS} members reached.
          </p>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit member" : "Add member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="m-name">Name</Label>
              <Input
                id="m-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-eid">Employee ID</Label>
              <Input
                id="m-eid"
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              />
              {errors.employee_id && (
                <p className="text-xs text-destructive">{errors.employee_id}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-desig">Designation</Label>
              <Input
                id="m-desig"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="m-start">Default start</Label>
                <Input
                  id="m-start"
                  type="time"
                  value={form.default_start_time}
                  onChange={(e) =>
                    setForm({ ...form, default_start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-end">Default end</Label>
                <Input
                  id="m-end"
                  type="time"
                  value={form.default_end_time}
                  onChange={(e) =>
                    setForm({ ...form, default_end_time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Include in OT entry selector
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Saving…" : "Save"}
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
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete their OT records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
