import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

type Gender = "male" | "female";

type Athlete = {
  id: string;
  name: string;
  gender: Gender;
  weightKg: number;
};

type SeatId =
  | "DRUMMER"
  | "SWEEP"
  | `R${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}_L`
  | `R${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}_R`;

type PlanState = {
  unassigned: Athlete[];
  seats: Partial<Record<SeatId, Athlete>>;
};

type DragId = `athlete:${string}` | `seat:${SeatId}`;

const MOCK_ATHLETES: Athlete[] = [
  { id: "a1", name: "Petr", gender: "male", weightKg: 82.5 },
  { id: "a2", name: "Kai", gender: "male", weightKg: 75.2 },
  { id: "a3", name: "Anna", gender: "female", weightKg: 61.8 },
  { id: "a4", name: "Mia", gender: "female", weightKg: 68.3 },
  { id: "a5", name: "Tom", gender: "male", weightKg: 90.1 },
  { id: "a6", name: "Sara", gender: "female", weightKg: 57.4 },
  { id: "a7", name: "Liam", gender: "male", weightKg: 78.9 },
  { id: "a8", name: "Zoe", gender: "female", weightKg: 64.0 },
  { id: "a9", name: "Noah", gender: "male", weightKg: 72.0 },
  { id: "a10", name: "Ella", gender: "female", weightKg: 59.6 },
  { id: "a11", name: "Max", gender: "male", weightKg: 85.0 },
  { id: "a12", name: "Ivy", gender: "female", weightKg: 66.2 },
];

function genderDotClass(g: Gender) {
  return g === "male" ? "bg-blue-500" : "bg-red-500";
}

function seatIdsForRow(row: number): { left: SeatId; right: SeatId } {
  const r = row as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  return { left: `R${r}_L`, right: `R${r}_R` };
}

function isFrontSeat(seatId: SeatId): boolean {
  if (seatId === "DRUMMER") return true;
  if (seatId === "SWEEP") return false;
  const match = seatId.match(/^R(\d+)_/);
  const row = match ? Number(match[1]) : 0;
  return row >= 1 && row <= 5;
}
function isBackSeat(seatId: SeatId): boolean {
  if (seatId === "SWEEP") return true;
  if (seatId === "DRUMMER") return false;
  const match = seatId.match(/^R(\d+)_/);
  const row = match ? Number(match[1]) : 0;
  return row >= 6 && row <= 10;
}
function isLeftSeat(seatId: SeatId): boolean {
  return seatId.endsWith("_L");
}
function isRightSeat(seatId: SeatId): boolean {
  return seatId.endsWith("_R");
}

function dragIdForAthlete(id: string): DragId {
  return `athlete:${id}`;
}
function dragIdForSeat(seatId: SeatId): DragId {
  return `seat:${seatId}`;
}
function parseDragId(
  id: string
):
  | { kind: "athlete"; athleteId: string }
  | { kind: "seat"; seatId: SeatId }
  | null {
  if (id.startsWith("athlete:"))
    return { kind: "athlete", athleteId: id.slice("athlete:".length) };
  if (id.startsWith("seat:"))
    return { kind: "seat", seatId: id.slice("seat:".length) as SeatId };
  return null;
}

function AthletePill({ athlete }: { athlete: Athlete }) {
  const draggableId = dragIdForAthlete(athlete.id);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: draggableId });

  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={[
        "flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2",
        "touch-none select-none",
        isDragging ? "opacity-40" : "",
        athlete.gender === "male" ? "bg-blue-100" : "bg-rode-100",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${genderDotClass(
            athlete.gender
          )}`}
          title={athlete.gender}
        />
        <div className="text-sm font-medium text-slate-900">{athlete.name}</div>
      </div>
      <div className="text-sm text-slate-700">
        {athlete.weightKg.toFixed(1)} kg
      </div>
    </div>
  );
}

function SeatCard({
  title,
  seatId,
  athlete,
}: {
  title: string;
  seatId: SeatId;
  athlete?: Athlete;
}) {
  const droppable = useDroppable({ id: dragIdForSeat(seatId) });
  const draggable = useDraggable({
    id: dragIdForSeat(seatId),
    disabled: !athlete,
  });

  const over = droppable.isOver;
  const dragging = draggable.isDragging;

  const transform = draggable.transform;
  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={droppable.setNodeRef}
      className={[
        "rounded-lg border bg-white p-2 sm:p-3 transition",
        over
          ? "border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50"
          : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-slate-500">{title}</div>
        <div className="text-[10px] text-slate-400">{seatId}</div>
      </div>

      <div className="mt-2">
        {athlete ? (
          <div
            ref={draggable.setNodeRef}
            style={style}
            {...draggable.listeners}
            {...draggable.attributes}
            className={[
              "flex items-center gap-2 rounded-md border border-slate-200 p-2",
              "touch-none select-none",
              dragging ? "opacity-40" : "",
              athlete.gender === "male" ? "bg-blue-100" : "bg-rose-100",
            ].join(" ")}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${genderDotClass(
                athlete.gender
              )}`}
              title={athlete.gender}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">
                {athlete.name}
              </div>
              <div className="text-xs text-slate-600">
                {athlete.weightKg.toFixed(1)} kg
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-2 text-sm text-slate-400">
            Empty
          </div>
        )}
      </div>

      <div className="mt-2 text-[11px] text-slate-500">
        Drop here. Drag seated paddlers to swap.
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  diffLabel,
  diffValue,
}: {
  label: string;
  value: string;
  diffLabel: string;
  diffValue: number;
}) {
  const ok = Math.abs(diffValue) <= 5;
  return (
    <div className="rounded-lg bg-slate-100 p-3">
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-600">
        {diffLabel}:{" "}
        <span
          className={
            ok ? "font-semibold text-emerald-700" : "font-semibold text-rose-800"
          }
        >
          {diffValue.toFixed(1)} kg
        </span>
      </div>
    </div>
  );
}

export default function SeatingPlanPage() {
  const [state, setState] = useState<PlanState>(() => ({
    unassigned: MOCK_ATHLETES,
    seats: {},
  }));

  const [activeId, setActiveId] = useState<DragId | null>(null);

  const activeAthlete = useMemo(() => {
    if (!activeId) return null;
    const parsed = parseDragId(activeId);
    if (!parsed) return null;

    if (parsed.kind === "athlete") {
      return state.unassigned.find((a) => a.id === parsed.athleteId) ?? null;
    }

  // seat
  return state.seats[parsed.seatId] ?? null;
}, [activeId, state.seats, state.unassigned]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } })
  );

  const stats = useMemo(() => {
    const assignedEntries = Object.entries(state.seats) as Array<[SeatId, Athlete]>;

    const sum = (items: Athlete[]) =>
      items.reduce((acc, a) => acc + (a.weightKg ?? 0), 0);

    const left = sum(
      assignedEntries.filter(([seatId]) => isLeftSeat(seatId)).map(([, a]) => a)
    );
    const right = sum(
      assignedEntries.filter(([seatId]) => isRightSeat(seatId)).map(([, a]) => a)
    );

    const front = sum(
      assignedEntries.filter(([seatId]) => isFrontSeat(seatId)).map(([, a]) => a)
    );
    const back = sum(
      assignedEntries.filter(([seatId]) => isBackSeat(seatId)).map(([, a]) => a)
    );

    return {
      left,
      right,
      leftRightDiff: left - right,
      front,
      back,
      frontBackDiff: front - back,
      assignedCount: assignedEntries.length,
      unassignedCount: state.unassigned.length,
    };
  }, [state.seats, state.unassigned.length]);

  const warnings = useMemo(() => {
    const seated = Object.values(state.seats).filter(Boolean) as Athlete[];

    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const a of seated) {
      if (seen.has(a.id)) duplicates.push(a.name);
      seen.add(a.id);
    }

    const missingWeight = seated
      .filter((a) => !Number.isFinite(a.weightKg))
      .map((a) => a.name);

    return {
      duplicates,
      missingWeight,
      unassignedCount: state.unassigned.length,
    };
  }, [state.seats, state.unassigned.length]);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id) as DragId);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);

    const active = parseDragId(String(e.active.id));
    const over = e.over ? parseDragId(String(e.over.id)) : null;

    if (!active || !over) return;
    if (over.kind !== "seat") return;

    setState((prev) => {
      const next: PlanState = {
        unassigned: [...prev.unassigned],
        seats: { ...prev.seats },
      };

      const targetSeat = over.seatId;

      let draggedAthlete: Athlete | undefined;
      let sourceSeat: SeatId | null = null;

      if (active.kind === "athlete") {
        const idx = next.unassigned.findIndex((a) => a.id === active.athleteId);
        if (idx === -1) return prev;
        draggedAthlete = next.unassigned[idx];
        next.unassigned.splice(idx, 1);
      } else {
        sourceSeat = active.seatId;
        draggedAthlete = next.seats[sourceSeat];
        if (!draggedAthlete) return prev;
      }

      if (sourceSeat && sourceSeat === targetSeat) return prev;

      const targetExisting = next.seats[targetSeat];

      next.seats[targetSeat] = draggedAthlete;

      // Swap behavior
      if (sourceSeat) {
        if (targetExisting) next.seats[sourceSeat] = targetExisting;
        else delete next.seats[sourceSeat];
      } else {
        if (targetExisting) next.unassigned.unshift(targetExisting);
      }

      return next;
    });
  }

  function onDragCancel() {
    setActiveId(null);
  }

  return (
    <DndContext
    sensors={sensors}
    modifiers={[restrictToWindowEdges]}
    collisionDetection={closestCorners}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    onDragCancel={onDragCancel}
  >
      <div className="space-y-4">
        <div className="sticky top-0 z-10 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Seating plan (DB20)
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Drag paddlers from Unassigned into seats. Drag seated paddlers to
                swap.
              </p>
            </div>

            <div className="text-right text-xs text-slate-500">
              Assigned: <span className="font-medium">{stats.assignedCount}</span>
              <br />
              Unassigned:{" "}
              <span className="font-medium">{stats.unassignedCount}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatPill
              label="Left vs Right"
              value={`${stats.left.toFixed(1)} kg vs ${stats.right.toFixed(1)} kg`}
              diffLabel="L - R"
              diffValue={stats.leftRightDiff}
            />
            <StatPill
              label="Front vs Back"
              value={`${stats.front.toFixed(1)} kg vs ${stats.back.toFixed(1)} kg`}
              diffLabel="F - B"
              diffValue={stats.frontBackDiff}
            />
          </div>

          <div className="mt-3 space-y-2">
            {warnings.unassignedCount > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Unassigned paddlers:{" "}
                <span className="font-semibold">{warnings.unassignedCount}</span>
              </div>
            )}

            {warnings.missingWeight.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                Missing weight:{" "}
                <span className="font-semibold">
                  {warnings.missingWeight.join(", ")}
                </span>
              </div>
            )}

            {warnings.duplicates.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                Duplicate paddlers seated:{" "}
                <span className="font-semibold">
                  {warnings.duplicates.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Unassigned</h2>

            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    unassigned: [...prev.unassigned].sort((a, b) =>
                      a.name.localeCompare(b.name)
                    ),
                  }))
                }
              >
                Sort: Name
              </button>

              <button
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    unassigned: [...prev.unassigned].sort(
                      (a, b) => a.weightKg - b.weightKg
                    ),
                  }))
                }
              >
                Sort: Weight
              </button>

              <button
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    unassigned: [...prev.unassigned].sort((a, b) =>
                      a.gender.localeCompare(b.gender)
                    ),
                  }))
                }
              >
                Sort: Gender
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {state.unassigned.map((a) => (
              <AthletePill key={a.id} athlete={a} />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Boat (DB20)</h2>
          <p className="mt-1 text-xs text-slate-600">
            Drummer → Rows 1–10 (L/R) → Sweep
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3">
            <SeatCard
              title="Drummer"
              seatId="DRUMMER"
              athlete={state.seats["DRUMMER"]}
            />

            {Array.from({ length: 10 }).map((_, idx) => {
              const row = idx + 1;
              const { left, right } = seatIdsForRow(row);
              return (
                <div key={row} className="grid grid-cols-2 gap-3">
                  <SeatCard
                    title={`Row ${row} (Left)`}
                    seatId={left}
                    athlete={state.seats[left]}
                  />
                  <SeatCard
                    title={`Row ${row} (Right)`}
                    seatId={right}
                    athlete={state.seats[right]}
                  />
                </div>
              );
            })}

            <SeatCard
              title="Sweep"
              seatId="SWEEP"
              athlete={state.seats["SWEEP"]}
            />
          </div>
        </div>
      </div>

      {createPortal(
        <DragOverlay>
          {activeAthlete ? (
            <div className="w-[260px] rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${genderDotClass(activeAthlete.gender)}`}
                  />
                  <div className="text-sm font-medium text-slate-900">
                    {activeAthlete.name}
                  </div>
                </div>
                <div className="text-sm text-slate-700">
                  {activeAthlete.weightKg.toFixed(1)} kg
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}


    </DndContext>
  );
}