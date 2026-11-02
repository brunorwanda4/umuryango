export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">You are offline</h1>
      <p className="text-sm text-muted-foreground">
        Open a page you previously used, or reconnect once to save more pages on
        this device. Offline-safe money entries will sync automatically when the
        connection returns.
      </p>
    </main>
  );
}
