"use client";

import { Button } from "@/components/ui/button";

interface LiveTailToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function LiveTailToggle({ enabled, onToggle }: LiveTailToggleProps) {
  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      onClick={() => onToggle(!enabled)}
      className="gap-2"
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          enabled ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
        }`}
      />
      {enabled ? "Live" : "Live tail"}
    </Button>
  );
}
