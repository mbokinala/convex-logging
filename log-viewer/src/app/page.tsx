import { getFilterOptions } from "@/lib/queries";
import { LogViewer } from "@/components/log-viewer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const filterOptions = await getFilterOptions();

  return (
    <main className="flex flex-col h-screen">
      <header className="border-b px-6 py-3 shrink-0">
        <h1 className="text-lg font-semibold">Convex Log Viewer</h1>
      </header>
      <LogViewer filterOptions={filterOptions} />
    </main>
  );
}
