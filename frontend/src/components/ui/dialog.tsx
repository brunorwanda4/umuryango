"use client";

import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogSearchParamHistory = "replace" | "push";

type DialogSearchParamSyncProps =
  | {
      searchParamHistory?: DialogSearchParamHistory;
      searchParamName?: string;
      searchParamSegment?: number;
      searchParamValue?: never;
      syncWithSearchParams?: false;
    }
  | {
      /**
       * Keeps dialog open state in the URL search params. Use a stable,
       * page-unique value such as "create-project".
       */
      searchParamValue: string;
      searchParamHistory?: DialogSearchParamHistory;
      searchParamName?: string;
      searchParamSegment?: number;
      syncWithSearchParams: true;
    };

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root> &
  DialogSearchParamSyncProps;

const DIALOG_SEARCH_PARAM_CHANGE_EVENT = "dialog-search-param-change";

const DialogSearchParamSegmentContext = React.createContext<{
  name: string;
  nextSegment: number;
} | null>(null);

function Dialog({
  defaultOpen,
  onOpenChange,
  open,
  searchParamHistory = "replace",
  searchParamName = "dialog",
  searchParamSegment,
  searchParamValue,
  syncWithSearchParams = false,
  ...props
}: DialogProps) {
  const parentSearchParam = React.useContext(DialogSearchParamSegmentContext);
  const resolvedSearchParamSegment =
    searchParamSegment ??
    (parentSearchParam?.name === searchParamName
      ? parentSearchParam.nextSegment
      : 0);
  const canSyncWithSearchParams =
    syncWithSearchParams &&
    typeof searchParamValue === "string" &&
    searchParamValue.length > 0;
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const activeOpen = isControlled ? open : internalOpen;
  const activeOpenRef = React.useRef(activeOpen);

  React.useEffect(() => {
    activeOpenRef.current = activeOpen;
  }, [activeOpen]);

  React.useEffect(() => {
    if (!syncWithSearchParams || searchParamValue) return;

    console.warn(
      "Dialog syncWithSearchParams requires a non-empty searchParamValue.",
    );
  }, [searchParamValue, syncWithSearchParams]);

  React.useEffect(() => {
    if (!canSyncWithSearchParams) return;

    function syncDialogFromSearchParam() {
      const shouldOpen =
        getSearchParamDialogValue(
          searchParamName,
          resolvedSearchParamSegment,
        ) === searchParamValue;

      if (shouldOpen === activeOpenRef.current) return;

      activeOpenRef.current = shouldOpen;

      if (isControlled) {
        onOpenChange?.(shouldOpen);
      } else {
        setInternalOpen(shouldOpen);
      }
    }

    syncDialogFromSearchParam();
    window.addEventListener("popstate", syncDialogFromSearchParam);
    window.addEventListener(
      DIALOG_SEARCH_PARAM_CHANGE_EVENT,
      syncDialogFromSearchParam,
    );

    return () => {
      window.removeEventListener("popstate", syncDialogFromSearchParam);
      window.removeEventListener(
        DIALOG_SEARCH_PARAM_CHANGE_EVENT,
        syncDialogFromSearchParam,
      );
    };
  }, [
    canSyncWithSearchParams,
    isControlled,
    onOpenChange,
    resolvedSearchParamSegment,
    searchParamName,
    searchParamValue,
  ]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      activeOpenRef.current = nextOpen;

      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);

      if (canSyncWithSearchParams) {
        writeSearchParamDialogValue({
          history: searchParamHistory,
          name: searchParamName,
          open: nextOpen,
          segment: resolvedSearchParamSegment,
          value: searchParamValue,
        });
      }
    },
    [
      canSyncWithSearchParams,
      isControlled,
      onOpenChange,
      resolvedSearchParamSegment,
      searchParamHistory,
      searchParamName,
      searchParamValue,
    ],
  );

  if (!canSyncWithSearchParams) {
    return (
      <DialogPrimitive.Root
        data-slot="dialog"
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        open={open}
        {...props}
      />
    );
  }

  return (
    <DialogSearchParamSegmentContext.Provider
      value={{
        name: searchParamName,
        nextSegment: resolvedSearchParamSegment + 1,
      }}
    >
      <DialogPrimitive.Root
        data-slot="dialog"
        onOpenChange={handleOpenChange}
        open={activeOpen}
        {...props}
      />
    </DialogSearchParamSegmentContext.Provider>
  );
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none sm:max-w-md dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-4 right-4 bg-secondary"
              size="icon-sm"
            >
              <XIcon data-icon="inline-start" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function getSearchParamDialogValue(name: string, segment: number) {
  return getSearchParamSegments(name)[segment];
}

function getSearchParamSegments(name: string) {
  if (typeof window === "undefined") return [];

  const rawValue = getRawSearchParamValue(name);
  if (!rawValue) return [];

  return rawValue.split("/").filter(Boolean).map(decodeSearchParamSegment);
}

function getRawSearchParamValue(name: string) {
  if (typeof window === "undefined") return undefined;

  const rawSearch = window.location.search.replace(/^\?/, "");
  if (!rawSearch) return undefined;

  for (const pair of rawSearch.split("&")) {
    const [rawKey, rawValue = ""] = pair.split("=");

    if (decodeQueryComponent(rawKey) === name) {
      return rawValue;
    }
  }

  return undefined;
}

function writeSearchParamDialogValue({
  history,
  name,
  open,
  segment,
  value,
}: {
  history: DialogSearchParamHistory;
  name: string;
  open: boolean;
  segment: number;
  value?: string;
}) {
  if (typeof window === "undefined" || !value) return;

  const oldUrl = window.location.href;
  const url = new URL(window.location.href);
  const searchParamSegments = getSearchParamSegments(name);

  if (open) {
    searchParamSegments[segment] = value;
    searchParamSegments.splice(segment + 1);
  } else if (searchParamSegments[segment] === value) {
    searchParamSegments.splice(segment);
  } else {
    return;
  }

  const nextValue = searchParamSegments.length
    ? searchParamSegments.map(encodeURIComponent).join("/")
    : undefined;

  setRawSearchParamValue(url, name, nextValue);

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) return;

  if (history === "push") {
    window.history.pushState(window.history.state, "", nextUrl);
  } else {
    window.history.replaceState(window.history.state, "", nextUrl);
  }

  dispatchSearchParamChange(oldUrl, window.location.href);
}

function setRawSearchParamValue(url: URL, name: string, rawValue?: string) {
  const encodedName = encodeURIComponent(name);
  const rawSearch = url.search.replace(/^\?/, "");
  const searchParamParts = rawSearch
    ? rawSearch.split("&").filter(Boolean)
    : [];
  const nextSearchParamParts: string[] = [];
  let hasWrittenValue = false;

  for (const part of searchParamParts) {
    const [rawKey] = part.split("=");

    if (decodeQueryComponent(rawKey) !== name) {
      nextSearchParamParts.push(part);
      continue;
    }

    if (!hasWrittenValue && rawValue !== undefined) {
      nextSearchParamParts.push(`${encodedName}=${rawValue}`);
      hasWrittenValue = true;
    }
  }

  if (!hasWrittenValue && rawValue !== undefined) {
    nextSearchParamParts.push(`${encodedName}=${rawValue}`);
  }

  url.search = nextSearchParamParts.length
    ? `?${nextSearchParamParts.join("&")}`
    : "";
}

function decodeQueryComponent(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, "%20"));
  } catch {
    return value;
  }
}

function decodeSearchParamSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function dispatchSearchParamChange(oldUrl: string, newUrl: string) {
  window.dispatchEvent(
    new CustomEvent(DIALOG_SEARCH_PARAM_CHANGE_EVENT, {
      detail: { newUrl, oldUrl },
    }),
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
