import Link from "next/link";
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
          ones get added over time.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.href}
            className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="text-3xl">{tool.emoji}</div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              {tool.name}
            </h2>
            <p className="mt-1.5 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              {tool.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Open
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 4.23a.75.75 0 0 1 1.06.02l5 5.25a.75.75 0 0 1 0 1.04l-5 5.25a.75.75 0 1 1-1.08-1.04L11.67 10 7.23 5.29a.75.75 0 0 1-.02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </Link>
        ))}

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
          More tools coming soon
        </div>
      </div>
    </div>
  );
}
