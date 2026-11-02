type TauriInternals = {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
};

declare global {
  interface Window {
    __TAURI_INTERNALS__?: TauriInternals;
  }
}

export function isNativeApp() {
  return (
    typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__?.invoke)
  );
}

export async function invokeNative<T>(
  command: string,
  args?: Record<string, unknown>,
) {
  const invoke = window.__TAURI_INTERNALS__?.invoke;

  if (!invoke) {
    throw new Error(
      "Native offline services are not available in this browser.",
    );
  }

  return invoke<T>(command, args);
}
