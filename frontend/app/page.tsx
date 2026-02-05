import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Harvest Hub
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Market Manager Portal
          </p>
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-white transition-colors hover:bg-green-800 md:w-[200px]"
          >
            Go to Login
          </Link>
        </div>
      </main>
    </div>
  );
}
