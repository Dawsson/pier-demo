import { Link, Outlet } from "@tanstack/react-router";
import { X } from "lucide-react";

export function AuthLayout() {
  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(400px,40vw)]">
      <AuthPatternPanel />
      <section className="relative z-1 flex min-h-auto min-w-0 items-center justify-center bg-background px-4 pt-14 pb-8 lg:min-h-screen lg:px-7 lg:py-18">
        <Link
          aria-label="Close auth"
          className="absolute top-5 right-5 inline-flex size-10 items-center justify-center rounded-lg border-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:top-6 lg:right-6"
          to="/"
        >
          <X aria-hidden size={22} strokeWidth={1.8} />
        </Link>
        <Outlet />
      </section>
    </main>
  );
}

function AuthPatternPanel() {
  return (
    <section
      className="relative min-h-[168px] overflow-hidden border-border border-b bg-neutral-100 text-neutral-900 lg:min-h-screen lg:border-r lg:border-b-0 dark:bg-neutral-950 dark:text-white"
      aria-hidden
    >
      <CubePattern />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(245_245_245_/_0.78)_0%,transparent_28%,transparent_68%,rgb(229_229_229_/_0.78)_100%)] dark:bg-[linear-gradient(to_bottom,rgb(10_10_10_/_0.80)_0%,transparent_22%,transparent_68%,rgb(10_10_10_/_0.88)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_70%,rgb(212_212_212_/_0.32)_100%)] dark:bg-[linear-gradient(90deg,transparent_0%,transparent_70%,rgb(10_10_10_/_0.34)_100%)]" />
      <div className="relative z-1 flex min-h-[168px] flex-col justify-between p-5 lg:min-h-full lg:p-8">
        <Link
          className="inline-flex items-center gap-2.5 font-extrabold text-[0.9375rem] !text-neutral-900 dark:!text-white"
          to="/"
        >
          <span
            className="inline-block size-3 rounded-[3px] border-2 border-neutral-900 bg-neutral-900/5 shadow-[4px_4px_0_var(--color-neutral-900)] dark:border-white dark:bg-white/10 dark:shadow-[4px_4px_0_var(--color-white)]"
            aria-hidden
          />
          Pier Demo
        </Link>
        <p className="max-w-82 text-balance font-semibold text-neutral-700 text-sm leading-6 lg:max-w-108 lg:text-[1.25rem] lg:leading-[1.35] dark:text-neutral-200">
          A simple product template with auth, API calls, and a shared counter.
        </p>
      </div>
    </section>
  );
}

function CubePattern() {
  return (
    <svg
      className="absolute inset-[-8%_-18%_-8%_-8%] h-[116%] w-[126%] -rotate-3 text-neutral-500/30 dark:text-white/[0.13]"
      aria-hidden
    >
      <defs>
        <pattern
          height="72"
          id="auth-cube-pattern"
          patternUnits="userSpaceOnUse"
          width="84"
          x="-18"
          y="-12"
        >
          <path
            className="fill-none stroke-current opacity-70"
            d="M42 4 78 24v40L42 84 6 64V24z"
            strokeLinejoin="round"
          />
          <path
            className="fill-none stroke-current opacity-50"
            d="M42 4v40M6 24l36 20 36-20M42 44v40"
            strokeLinejoin="round"
          />
          <path
            className="fill-none stroke-current opacity-30"
            d="M42 44 6 64M42 44l36 20"
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
      <rect fill="url(#auth-cube-pattern)" height="100%" width="100%" />
    </svg>
  );
}
