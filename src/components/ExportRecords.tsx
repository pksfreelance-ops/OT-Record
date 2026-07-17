import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type DayEntry,
  type Member,
  activeSlots,
} from "@/lib/ot-slots";

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ExportRecords() {
  const { user } = useAuth();
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  const entriesQuery = useQuery({
    queryKey: ["ot_day_entries", user?.id, "range", from, to],
    enabled: !!user && from <= to,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ot_day_entries")
        .select("*")
        .gte("work_date", from)
        .lte("work_date", to)
        .order("work_date", { ascending: true });
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

  // Dashboard: rows = members, cols = dates
  const { dates, matrix, memberTotals, dateTotals, grandTotal, memberList } =
    useMemo(() => {
      const entries = entriesQuery.data ?? [];
      const dateSet = new Set<string>();
      const memberSet = new Set<string>();
      const cell = new Map<string, number>(); // key: memberId|date -> hours

      for (const e of entries) {
        dateSet.add(e.work_date);
        for (const s of activeSlots(e)) {
          if (!s.memberId) continue;
          memberSet.add(s.memberId);
          const key = `${s.memberId}|${e.work_date}`;
          cell.set(key, (cell.get(key) ?? 0) + s.totalHours);
        }
      }

      const dates = Array.from(dateSet).sort();
      const memberList = Array.from(memberSet)
        .map((id) => memberMap.get(id))
        .filter((m): m is Member => !!m)
        .sort((a, b) => a.name.localeCompare(b.name));

      const memberTotals = new Map<string, number>();
      const dateTotals = new Map<string, number>();
      let grand = 0;
      const matrix = new Map<string, number>();
      for (const m of memberList) {
        for (const d of dates) {
          const h = cell.get(`${m.id}|${d}`) ?? 0;
          matrix.set(`${m.id}|${d}`, h);
          memberTotals.set(m.id, (memberTotals.get(m.id) ?? 0) + h);
          dateTotals.set(d, (dateTotals.get(d) ?? 0) + h);
          grand += h;
        }
      }
      return { dates, matrix, memberTotals, dateTotals, grandTotal: grand, memberList };
    }, [entriesQuery.data, memberMap]);

  function exportCsv() {
    const entries = entriesQuery.data ?? [];
    const rows: string[] = [];
    rows.push(
      [
        "Date",
        "Department",
        "Employee ID",
        "Employee Name",
        "Designation",
        "Work Description",
        "Start Time",
        "End Time",
        "Total Hours",
      ]
        .map(csvEscape)
        .join(","),
    );
    let count = 0;
    for (const e of entries) {
      for (const s of activeSlots(e)) {
        const m = s.memberId ? memberMap.get(s.memberId) : null;
        rows.push(
          [
            format(parseISO(e.work_date), "yyyy-MM-dd"),
            e.department,
            m?.employee_id ?? "",
            m?.name ?? "",
            m?.designation ?? "",
            e.description,
            s.startTime,
            s.endTime,
            s.totalHours.toFixed(2),
          ]
            .map(csvEscape)
            .join(","),
        );
        count++;
      }
    }
    if (count === 0) {
      toast.info("No records in that range");
      return;
    }
    const blob = new Blob(["\ufeff" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ot-records_${from}_to_${to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${count} record${count === 1 ? "" : "s"}`);
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sign in from Settings to view summary.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ex-from">From</Label>
              <Input
                id="ex-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ex-to">To</Label>
              <Input
                id="ex-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Daily overtime</CardTitle>
          <span className="text-xs text-muted-foreground">
            Total {grandTotal.toFixed(2)} h
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {entriesQuery.isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : memberList.length === 0 || dates.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No overtime hours in this range.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background">
                      Employee
                    </TableHead>
                    {dates.map((d) => (
                      <TableHead key={d} className="text-right whitespace-nowrap">
                        {format(parseISO(d), "MMM d")}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberList.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        {m.name}
                      </TableCell>
                      {dates.map((d) => {
                        const h = matrix.get(`${m.id}|${d}`) ?? 0;
                        return (
                          <TableCell key={d} className="text-right tabular-nums">
                            {h ? h.toFixed(2) : "—"}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-semibold tabular-nums">
                        {(memberTotals.get(m.id) ?? 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-background font-semibold">
                      Total
                    </TableCell>
                    {dates.map((d) => (
                      <TableCell
                        key={d}
                        className="text-right font-semibold tabular-nums"
                      >
                        {(dateTotals.get(d) ?? 0).toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-semibold tabular-nums">
                      {grandTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={exportCsv} className="w-full" disabled={entriesQuery.isLoading}>
        <Download className="mr-2 h-4 w-4" />
        Download CSV
      </Button>
    </div>
  );
}
