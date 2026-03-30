import type { ConvexEvent } from "../events/types";

export interface EventStorage {
  storeBatch(events: ConvexEvent[]): Promise<void>;
  close(): Promise<void>;
}
