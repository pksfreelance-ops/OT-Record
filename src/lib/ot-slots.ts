import type { Tables } from "@/integrations/supabase/types";

export type DayEntry = Tables<"ot_day_entries">;
export type Member = Tables<"members">;

export const SLOT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export const DEFAULT_DEPARTMENTS = [
  "Mechanical, GT, North",
  "Mechanical, ST, North",
];

export const TIME_RE = /^\d{2}:\d{2}$/;

export function toTime(v: string | null | undefined): string {
  return (v ?? "").slice(0, 5);
}

export function computeHours(start: string, end: string): number {
  if (!TIME_RE.test(start) || !TIME_RE.test(end)) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 100) / 100;
}

export type SlotView = {
  slot: SlotId;
  memberId: string | null;
  selected: boolean;
  startTime: string;
  endTime: string;
  totalHours: number;
};

export function readSlot(e: DayEntry, i: SlotId): SlotView {
  const raw = e as unknown as Record<string, unknown>;
  return {
    slot: i,
    memberId: (raw[`emp${i}_member_id`] as string | null) ?? null,
    selected: Boolean(raw[`emp${i}_selected`]),
    startTime: toTime(raw[`emp${i}_start_time`] as string | null),
    endTime: toTime(raw[`emp${i}_end_time`] as string | null),
    totalHours: Number(raw[`emp${i}_total_hours`] ?? 0),
  };
}

export function allSlots(e: DayEntry): SlotView[] {
  return SLOT_IDS.map((i) => readSlot(e, i));
}

export function activeSlots(e: DayEntry): SlotView[] {
  return allSlots(e).filter((s) => s.selected && s.memberId);
}

/** Build a payload of all 40 slot columns for insert/update. */
export function slotPayload(
  slots: Record<SlotId, { memberId: string | null; selected: boolean; start: string; end: string }>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const i of SLOT_IDS) {
    const s = slots[i];
    out[`emp${i}_member_id`] = s.memberId;
    out[`emp${i}_selected`] = s.selected && !!s.memberId;
    out[`emp${i}_start_time`] = s.selected && TIME_RE.test(s.start) ? s.start : null;
    out[`emp${i}_end_time`] = s.selected && TIME_RE.test(s.end) ? s.end : null;
    out[`emp${i}_total_hours`] =
      s.selected && TIME_RE.test(s.start) && TIME_RE.test(s.end)
        ? computeHours(s.start, s.end)
        : 0;
  }
  return out;
}
