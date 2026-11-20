import ToolGrid from "@/app/components/home/ToolGrid";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Toolbox
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          A small collection of focused web tools. Pick one to get started — new
          ones get added over time. Drag the grip on a card to rearrange them.
        </p>
      </div>

      <ToolGrid tools={tools} />
    </div>
  );
}
