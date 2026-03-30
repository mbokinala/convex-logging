import { verifySignature } from "./signature";
import type { EventStorage } from "../storage/interface";
import type { ConvexEvent } from "../events/types";

const VALID_TOPICS = new Set([
  "verification",
  "console",
  "function_execution",
  "audit_log",
  "concurrency_stats",
  "scheduler_stats",
  "current_storage_usage",
  "storage_api_bandwidth",
]);

export async function handleWebhook(
  req: Request,
  storage: EventStorage,
  webhookSecret: string
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = req.headers.get("x-webhook-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  const body = await req.text();

  if (!verifySignature(body, signature, webhookSecret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let events: unknown;
  try {
    events = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!Array.isArray(events)) {
    return new Response("Expected JSON array", { status: 400 });
  }

  const knownEvents: ConvexEvent[] = [];
  for (const event of events) {
    if (event.topic && VALID_TOPICS.has(event.topic)) {
      knownEvents.push(event as ConvexEvent);
    } else {
      console.warn(`Unknown topic: ${event.topic}`);
    }
  }

  try {
    await storage.storeBatch(knownEvents);
  } catch (err) {
    console.error("Failed to store events:", err);
    return new Response("Internal Server Error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
