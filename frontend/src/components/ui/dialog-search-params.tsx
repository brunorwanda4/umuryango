"use client";

import * as React from "react";

type DialogSearchParamHistory = "replace" | "push";

type DialogSearchParamSyncProps = {
  /**
   * Keeps dialog open state in the URL search params. Defaults to true and
   * uses the dialog title text, like "Add Income" -> ?dialog=add-income.
   */
  syncWithSearchParams?: boolean;
  /**
   * Escape hatch for pages with duplicate titles or title text that should not
   * be used in the URL.
   */
  searchParamValue?: string;
  searchParamHistory?: DialogSearchParamHistory;
  searchParamName?: string;
  searchParamSegment?: number;
};

type UseDialogSearchParamSyncOptions = Required<
  Pick<DialogSearchParamSyncProps, "searchParamHistory" | "searchParamName">
> &
  DialogSearchParamSyncProps & {
    children: React.ReactNode;
    componentName: string;
    defaultOpen?: boolean;
    fallbackSearchParamPrefix: string;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    rootComponent: React.ElementType;
    titleComponent: React.ElementType;
  };

const DIALOG_SEARCH_PARAM_CHANGE_EVENT = "dialog-search-param-change";

const DialogSearchParamSegmentContext = React.createContext<{
  name: string;
  nextSegment: number;
} | null>(null);

function DialogSearchParamSegmentProvider({
  children,
  name,
  nextSegment,
}: {
  children: React.ReactNode;
  name: string;
  nextSegment: number;
}) {
  return (
    <DialogSearchParamSegmentContext.Provider value={{ name, nextSegment }}>
      {children}
    </DialogSearchParamSegmentContext.Provider>
  );
}

function useDialogSearchParamSync({
  children,
  componentName,
  defaultOpen,
  fallbackSearchParamPrefix,
  onOpenChange,
  open,
  rootComponent,
  searchParamHistory,
  searchParamName,
  searchParamSegment,
  searchParamValue,
  syncWithSearchParams,
  titleComponent,
}: UseDialogSearchParamSyncOptions) {
  const parentSearchParam = React.useContext(DialogSearchParamSegmentContext);
  const fallbackSearchParamValue = React.useId();
  const resolvedSearchParamValue = React.useMemo(
    () =>
      searchParamValue ??
      getAutoSearchParamValue({
        children,
        fallbackPrefix: fallbackSearchParamPrefix,
        fallbackValue: fallbackSearchParamValue,
        rootComponent,
        titleComponent,
      }),
    [
      children,
      fallbackSearchParamPrefix,
      fallbackSearchParamValue,
      rootComponent,
      searchParamValue,
      titleComponent,
    ],
  );
  const resolvedSearchParamSegment =
    searchParamSegment ??
    (parentSearchParam?.name === searchParamName
      ? parentSearchParam.nextSegment
      : 0);
  const canSyncWithSearchParams =
    syncWithSearchParams &&
    typeof resolvedSearchParamValue === "string" &&
    resolvedSearchParamValue.length > 0;
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const activeOpen = isControlled ? open : internalOpen;
  const activeOpenRef = React.useRef(activeOpen);
  const hasSyncedInitialSearchParamRef = React.useRef(false);
  const pendingSearchParamOpenRef = React.useRef(false);

  React.useEffect(() => {
    activeOpenRef.current = activeOpen;
  }, [activeOpen]);

  React.useEffect(() => {
    if (!syncWithSearchParams || resolvedSearchParamValue) return;

    console.warn(
      `${componentName} syncWithSearchParams requires a title or non-empty searchParamValue.`,
    );
  }, [componentName, resolvedSearchParamValue, syncWithSearchParams]);

  React.useEffect(() => {
    if (!canSyncWithSearchParams) return;

    function syncDialogFromSearchParam() {
      const shouldOpen =
        getSearchParamDialogValue(
          searchParamName,
          resolvedSearchParamSegment,
        ) === resolvedSearchParamValue;
      hasSyncedInitialSearchParamRef.current = true;

      if (shouldOpen && !activeOpenRef.current) {
        pendingSearchParamOpenRef.current = true;
      }

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
    resolvedSearchParamValue,
    searchParamName,
  ]);

  React.useEffect(() => {
    if (!canSyncWithSearchParams) return;
    if (!hasSyncedInitialSearchParamRef.current) return;
    if (pendingSearchParamOpenRef.current && !activeOpen) return;

    if (pendingSearchParamOpenRef.current && activeOpen) {
      pendingSearchParamOpenRef.current = false;
    }

    if (
      !activeOpen &&
      getSearchParamDialogValue(searchParamName, resolvedSearchParamSegment) !==
        resolvedSearchParamValue
    ) {
      return;
    }

    writeSearchParamDialogValue({
      history: searchParamHistory,
      name: searchParamName,
      open: activeOpen ?? false,
      segment: resolvedSearchParamSegment,
      value: resolvedSearchParamValue,
    });
  }, [
    activeOpen,
    canSyncWithSearchParams,
    resolvedSearchParamSegment,
    resolvedSearchParamValue,
    searchParamHistory,
    searchParamName,
  ]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      activeOpenRef.current = nextOpen;
      if (!nextOpen) {
        pendingSearchParamOpenRef.current = false;
      }

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
          value: resolvedSearchParamValue,
        });
      }
    },
    [
      canSyncWithSearchParams,
      isControlled,
      onOpenChange,
      resolvedSearchParamSegment,
      resolvedSearchParamValue,
      searchParamHistory,
      searchParamName,
    ],
  );

  return {
    activeOpen,
    canSyncWithSearchParams,
    handleOpenChange,
    resolvedSearchParamSegment,
  };
}

function getAutoSearchParamValue({
  children,
  fallbackPrefix,
  fallbackValue,
  rootComponent,
  titleComponent,
}: {
  children: React.ReactNode;
  fallbackPrefix: string;
  fallbackValue: string;
  rootComponent: React.ElementType;
  titleComponent: React.ElementType;
}) {
  const titleText = getDialogTitleText({
    children,
    rootComponent,
    titleComponent,
  });
  const titleValue = slugifySearchParamValue(titleText);
  const fallbackDialogValue = slugifySearchParamValue(fallbackValue);

  return titleValue ?? `${fallbackPrefix}-${fallbackDialogValue ?? "root"}`;
}

function getDialogTitleText({
  children,
  rootComponent,
  titleComponent,
}: {
  children: React.ReactNode;
  rootComponent: React.ElementType;
  titleComponent: React.ElementType;
}) {
  let titleText: string | undefined;

  function visit(node: React.ReactNode) {
    if (titleText) return;

    React.Children.forEach(node, (child) => {
      if (titleText || !React.isValidElement(child)) return;

      const childProps = child.props as {
        children?: React.ReactNode;
      };

      if (child.type === titleComponent) {
        titleText = getTextContent(childProps.children);
        return;
      }

      if (child.type === rootComponent) return;

      if (childProps.children) {
        visit(childProps.children);
      }
    });
  }

  visit(children);

  return titleText;
}

function getTextContent(node: React.ReactNode): string | undefined {
  const parts: string[] = [];

  function visit(childNode: React.ReactNode) {
    React.Children.forEach(childNode, (child) => {
      if (typeof child === "string" || typeof child === "number") {
        parts.push(String(child));
        return;
      }

      if (!React.isValidElement(child)) return;

      const childProps = child.props as {
        children?: React.ReactNode;
      };

      if (childProps.children) {
        visit(childProps.children);
      }
    });
  }

  visit(node);

  const textContent = parts.join(" ").replace(/\s+/g, " ").trim();

  return textContent || undefined;
}

function slugifySearchParamValue(value?: string) {
  const slug = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || undefined;
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
  DialogSearchParamSegmentProvider,
  type DialogSearchParamSyncProps,
  useDialogSearchParamSync,
};
