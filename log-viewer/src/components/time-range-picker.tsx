"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface TimeRangePickerProps {
  timeFrom?: string;
  timeTo?: string;
  onChange: (timeFrom?: string, timeTo?: string) => void;
}

const PRESETS = [
  { label: "Last 15m", minutes: 15 },
  { label: "Last 1h", minutes: 60 },
  { label: "Last 6h", minutes: 360 },
  { label: "Last 24h", minutes: 1440 },
  { label: "Last 7d", minutes: 10080 },
];

export function TimeRangePicker({
  timeFrom,
  timeTo,
  onChange,
}: TimeRangePickerProps) {
  const [open, setOpen] = useState(false);

  const activePreset = timeFrom && !timeTo ? getActivePreset(timeFrom) : null;

  const label = activePreset
    ? activePreset
    : timeFrom || timeTo
      ? "Custom range"
      : "Time range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                const from = new Date(
                  Date.now() - preset.minutes * 60 * 1000
                ).toISOString();
                onChange(from, undefined);
                setOpen(false);
              }}
            >
              {preset.label}
            </Button>
          ))}
          <div className="border-t my-1" />
          <div className="px-2 py-1 space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <input
                type="datetime-local"
                className="w-full text-sm bg-transparent border rounded px-2 py-1"
                value={timeFrom ? toLocalDatetimeString(timeFrom) : ""}
                onChange={(e) =>
                  onChange(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                    timeTo
                  )
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <input
                type="datetime-local"
                className="w-full text-sm bg-transparent border rounded px-2 py-1"
                value={timeTo ? toLocalDatetimeString(timeTo) : ""}
                onChange={(e) =>
                  onChange(
                    timeFrom,
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined
                  )
                }
              />
            </div>
          </div>
          {(timeFrom || timeTo) && (
            <>
              <div className="border-t my-1" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  onChange(undefined, undefined);
                  setOpen(false);
                }}
              >
                Clear time range
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function toLocalDatetimeString(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function getActivePreset(timeFrom: string): string | null {
  const diff = Date.now() - new Date(timeFrom).getTime();
  const minutes = diff / (60 * 1000);
  for (const preset of PRESETS) {
    if (Math.abs(minutes - preset.minutes) < 2) {
      return preset.label;
    }
  }
  return null;
}
