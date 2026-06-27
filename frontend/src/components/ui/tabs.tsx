"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root> & {
  /**
   * Keeps tab state in the URL hash. The default tab keeps the URL clean,
   * while other tabs use hashes like #incoming or #incoming/details.
   */
  syncWithHash?: boolean;
  /**
   * Advanced escape hatch for nested tabs. Top-level tabs use segment 0,
   * children inside a TabsContent automatically use the next segment.
   */
  hashSegment?: number;
  hashHistory?: "replace" | "push";
};

const TabsHashSegmentContext = React.createContext(0);

function Tabs({
  children,
  className,
  defaultValue,
  hashHistory = "replace",
  hashSegment,
  onValueChange,
  orientation = "horizontal",
  syncWithHash = true,
  value,
  ...props
}: TabsProps) {
  const parentHashSegment = React.useContext(TabsHashSegmentContext);
  const resolvedHashSegment = hashSegment ?? parentHashSegment;
  const tabValues = React.useMemo(() => collectTabValues(children), [children]);
  const fallbackValue =
    typeof defaultValue === "string" ? defaultValue : tabValues[0];
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(fallbackValue);
  const activeValue = isControlled ? value : internalValue;
  const activeValueRef = React.useRef(activeValue);

  React.useEffect(() => {
    activeValueRef.current = activeValue;
  }, [activeValue]);

  React.useEffect(() => {
    if (!syncWithHash || isControlled) return;

    setInternalValue((currentValue) => {
      const hashValue = getHashTabValue(tabValues, resolvedHashSegment);

      if (hashValue) return hashValue;
      if (currentValue && tabValues.includes(currentValue)) return currentValue;

      return fallbackValue;
    });
  }, [
    fallbackValue,
    isControlled,
    resolvedHashSegment,
    syncWithHash,
    tabValues,
  ]);

  React.useEffect(() => {
    if (!syncWithHash || tabValues.length === 0) return;

    function syncTabFromHash() {
      const hashValue = getHashTabValue(tabValues, resolvedHashSegment);

      if (hashValue) {
        if (hashValue === activeValueRef.current) return;

        if (isControlled) {
          onValueChange?.(hashValue);
        } else {
          setInternalValue(hashValue);
        }
        return;
      }

      if (!isControlled && !hasHashSegment(resolvedHashSegment)) {
        setInternalValue(fallbackValue);
      }
    }

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    window.addEventListener("popstate", syncTabFromHash);

    return () => {
      window.removeEventListener("hashchange", syncTabFromHash);
      window.removeEventListener("popstate", syncTabFromHash);
    };
  }, [
    fallbackValue,
    isControlled,
    onValueChange,
    resolvedHashSegment,
    syncWithHash,
    tabValues,
  ]);

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      activeValueRef.current = nextValue;

      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onValueChange?.(nextValue);

      if (syncWithHash) {
        writeHashTabValue({
          defaultValue: fallbackValue,
          hashHistory,
          hashSegment: resolvedHashSegment,
          value: nextValue,
        });
      }
    },
    [
      fallbackValue,
      hashHistory,
      isControlled,
      onValueChange,
      resolvedHashSegment,
      syncWithHash,
    ],
  );

  return (
    <TabsHashSegmentContext.Provider value={resolvedHashSegment + 1}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        className={cn(
          "group/tabs flex gap-2 data-horizontal:flex-col",
          className,
        )}
        defaultValue={syncWithHash ? undefined : defaultValue}
        onValueChange={syncWithHash ? handleValueChange : onValueChange}
        value={syncWithHash ? activeValue : value}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsHashSegmentContext.Provider>
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-full p-1 text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:rounded-2xl data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full border border-transparent! px-3 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

function collectTabValues(children: React.ReactNode) {
  const values = new Set<string>();

  function visit(node: React.ReactNode) {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;

      const childProps = child.props as {
        children?: React.ReactNode;
        value?: unknown;
      };

      if (child.type === TabsTrigger || child.type === TabsContent) {
        if (typeof childProps.value === "string") {
          values.add(childProps.value);
        }
        return;
      }

      if (child.type === Tabs) return;

      if (childProps.children) {
        visit(childProps.children);
      }
    });
  }

  visit(children);

  return Array.from(values);
}

function getHashSegments() {
  if (typeof window === "undefined") return [];

  const rawHash = window.location.hash.replace(/^#/, "");
  if (!rawHash) return [];

  return rawHash.split("/").filter(Boolean).map(decodeHashSegment);
}

function hasHashSegment(hashSegment: number) {
  return getHashSegments().length > hashSegment;
}

function getHashTabValue(tabValues: string[], hashSegment: number) {
  const hashValue = getHashSegments()[hashSegment];

  if (!hashValue || !tabValues.includes(hashValue)) {
    return undefined;
  }

  return hashValue;
}

function writeHashTabValue({
  defaultValue,
  hashHistory,
  hashSegment,
  value,
}: {
  defaultValue?: string;
  hashHistory: "replace" | "push";
  hashSegment: number;
  value: string;
}) {
  if (typeof window === "undefined") return;

  const oldUrl = window.location.href;
  const hashSegments = getHashSegments();

  if (defaultValue && value === defaultValue) {
    hashSegments.splice(hashSegment);
  } else {
    hashSegments[hashSegment] = value;
    hashSegments.splice(hashSegment + 1);
  }

  const nextHash = hashSegments.length
    ? `#${hashSegments.map(encodeURIComponent).join("/")}`
    : "";
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;

  if (
    nextUrl ===
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  ) {
    return;
  }

  if (hashHistory === "push") {
    window.history.pushState(window.history.state, "", nextUrl);
  } else {
    window.history.replaceState(window.history.state, "", nextUrl);
  }

  dispatchHashChange(oldUrl, window.location.href);
}

function decodeHashSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function dispatchHashChange(oldUrl: string, newUrl: string) {
  try {
    window.dispatchEvent(
      new HashChangeEvent("hashchange", { oldURL: oldUrl, newURL: newUrl }),
    );
  } catch {
    window.dispatchEvent(new Event("hashchange"));
  }
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
