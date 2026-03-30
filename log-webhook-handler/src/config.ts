export interface Config {
  port: number;
  webhookSecret: string;
  databaseUrl: string;
}

export function loadConfig(): Config {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("WEBHOOK_SECRET is required");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  return {
    port: Number(process.env.PORT) || 3000,
    webhookSecret,
    databaseUrl,
  };
}
