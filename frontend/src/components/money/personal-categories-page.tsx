"use client";

import {
  FolderIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type ApiCategory,
  type CategoryStatus,
  enrichApiCategories,
  type MoneyCategory,
} from "@/components/family/money/categories/types-and-constants";
import { PersonalCategoryDialog } from "@/components/money/personal-category-dialog";
import type { FamilySummary } from "@/components/money/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import apiRequest from "@/service/api";

export function PersonalCategoriesPage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MoneyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out" | "off">("all");
  const [view, setView] = useState<"data" | "charts">("data");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<MoneyCategory | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);

    const familiesResponse = await apiRequest<undefined, FamilySummary[]>(
      "get",
      "/families?limit=1",
    );
    const family = familiesResponse.data?.[0];

    if (!familiesResponse.ok || !family) {
      setFamilyId(null);
      setCategories([]);
      setLoading(false);
      return;
    }

    setFamilyId(family.id);
    const response = await apiRequest<undefined, ApiCategory[]>(
      "get",
      `/families/${encodeURIComponent(family.id)}/money/categories/mine`,
    );

    if (response.ok) {
      setCategories(enrichApiCategories(response.data ?? [], null));
    } else {
      setCategories([]);
      toast.error(
        response.message ?? "Failed to load categories from database",
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "in" && item.type === "INCOME") ||
        (filter === "out" && item.type === "EXPENSE") ||
        (filter === "off" && item.status !== "ACTIVE");

      const matchesSearch = !q || item.name.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [categories, filter, search]);

  const handleToggleStatus = async (cat: MoneyCategory) => {
    if (!familyId) return;

    const nextStatus: CategoryStatus =
      cat.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const response = await apiRequest(
      "patch",
      `/families/${encodeURIComponent(familyId)}/money/categories/mine/${encodeURIComponent(cat.id)}`,
      { status: nextStatus },
    );

    if (!response.ok) {
      toast.error(response.message ?? "Category status could not be updated.");
      return;
    }

    await loadCategories();
    toast.success(
      nextStatus === "ACTIVE"
        ? `${cat.name} is active again`
        : `${cat.name} has been deactivated`,
    );
  };

  const handleDelete = async (cat: MoneyCategory) => {
    if (!familyId) return;

    const response = await apiRequest(
      "delete",
      `/families/${encodeURIComponent(familyId)}/money/categories/mine/${encodeURIComponent(cat.id)}`,
    );

    if (!response.ok) {
      toast.error(response.message ?? "Category could not be deleted.");
      return;
    }

    await loadCategories();
    toast.success(`${cat.name} has been deleted`);
  };

  const openCreateDialog = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const openEditDialog = (cat: MoneyCategory) => {
    setSelectedCategory(cat);
    setDialogOpen(true);
  };

  // Chart statistics
  const totalCount = categories.length;
  const incomeCount = categories.filter((c) => c.type === "INCOME").length;
  const expenseCount = totalCount - incomeCount;
  const activeCount = categories.filter((c) => c.status === "ACTIVE").length;
  const inactiveCount = totalCount - activeCount;

  const circumference = 2 * Math.PI * 60;
  const incomeFraction = totalCount ? incomeCount / totalCount : 0;
  const expenseFraction = totalCount ? expenseCount / totalCount : 0;

  return (
    <div className="flex flex-col">
      {/* Page Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-3 font-fraunces text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          <ListIcon className="size-8 sm:size-9" aria-hidden="true" />
          Categories
        </h1>
        <p className="mt-2 mb-2 text-[15px] text-muted-foreground">
          Manage the income and expense categories used in your personal money
          records.
        </p>
      </div>

      {/* No Family Alert */}
      {!familyId && !loading ? (
        <div className="my-4 flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-border bg-card p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <UsersIcon className="size-5 flex-none text-foreground" />
            <span>
              Create or join a family workspace before creating personal money
              categories.
            </span>
          </div>
          <Button asChild size="sm">
            <Link href="/family">Open family workspaces</Link>
          </Button>
        </div>
      ) : null}

      {/* Segmented View Control (Data / Charts) */}
      <fieldset
        aria-label="View"
        className="my-5 inline-flex self-start rounded-full border border-border bg-muted p-1"
      >
        <button
          type="button"
          aria-pressed={view === "data"}
          onClick={() => setView("data")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-all",
            view === "data"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Data
        </button>
        <button
          type="button"
          aria-pressed={view === "charts"}
          onClick={() => setView("charts")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-all",
            view === "charts"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Charts
        </button>
      </fieldset>

      {/* Data Section */}
      {view === "data" ? (
        <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
          {/* Header row: Title on left, Search on right */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-fraunces text-xl font-semibold tracking-tight text-foreground">
              Category master data
            </h2>
            <div className="flex h-10 min-w-[220px] items-center gap-2 rounded-xl border border-border bg-muted/60 px-3.5">
              <SearchIcon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                aria-label="Search categories"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Filter Toolbar row: Chips on left, + Add category button on right */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  filter === "all"
                    ? "bg-foreground text-background shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                All
              </button>
              <button
                type="button"
                aria-pressed={filter === "in"}
                onClick={() => setFilter("in")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  filter === "in"
                    ? "bg-foreground text-background shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                Income
              </button>
              <button
                type="button"
                aria-pressed={filter === "out"}
                onClick={() => setFilter("out")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  filter === "out"
                    ? "bg-foreground text-background shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                Expense
              </button>
              <button
                type="button"
                aria-pressed={filter === "off"}
                onClick={() => setFilter("off")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  filter === "off"
                    ? "bg-foreground text-background shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                Inactive
              </button>
            </div>

            <Button
              type="button"
              onClick={() => {
                if (!familyId) {
                  toast.error(
                    "Please create or join a family workspace first.",
                  );
                  return;
                }
                openCreateDialog();
              }}
              className="h-9 gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-sm hover:bg-foreground/90"
            >
              <PlusIcon className="size-4" />
              Add category
            </Button>
          </div>

          {/* Master Data List */}
          {loading ? (
            <div className="flex flex-col gap-3 py-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : categories.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-dashed border-border px-3 py-10 text-center">
              <div className="mx-auto mb-3.5 flex size-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <FolderIcon className="size-7" />
              </div>
              <h3 className="font-fraunces text-xl font-semibold text-foreground">
                No categories found
              </h3>
              <p className="mx-auto mt-1.5 mb-4 max-w-sm text-sm text-muted-foreground">
                Create a category for income or expenses, such as Salary, Food,
                or School fees.
              </p>
              <Button
                type="button"
                onClick={() => {
                  if (!familyId) {
                    toast.error(
                      "Please create or join a family workspace first.",
                    );
                    return;
                  }
                  openCreateDialog();
                }}
                className="h-10 gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background shadow-sm hover:bg-foreground/90"
              >
                <PlusIcon className="size-4" />
                Add category
              </Button>
            </div>
          ) : filteredCategories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No categories match your search or filter.
            </p>
          ) : (
            <div className="flex flex-col">
              {filteredCategories.map((cat, idx) => {
                const isIncome = cat.type === "INCOME";
                const isActive = cat.status === "ACTIVE";

                return (
                  <div
                    key={cat.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 py-3.5",
                      idx > 0 && "border-t border-border",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="size-3 flex-none rounded-full"
                        style={{ backgroundColor: cat.color || "#888888" }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-foreground">
                          {cat.name}
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                          {isIncome ? "Income" : "Expense"} category
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type Badge */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                          isIncome
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-500/15 text-red-700 dark:text-red-400",
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {isIncome ? "Income" : "Expense"}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                          isActive
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {isActive ? "Active" : "Inactive"}
                      </span>

                      {/* Activate / Deactivate Toggle */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(cat)}
                        className="h-[34px] rounded-[10px] px-3 text-[13px] font-semibold"
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(cat)}
                        className="h-[34px] rounded-[10px] px-3 text-[13px] font-semibold"
                      >
                        Edit
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(cat)}
                        className="h-[34px] rounded-[10px] px-3 text-[13px] font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        /* Charts Section */
        <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h2 className="font-fraunces text-xl font-semibold tracking-tight text-foreground">
              Categories by type
            </h2>
          </div>

          {totalCount > 0 ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-center gap-7 py-4">
                {/* SVG Donut */}
                <div className="relative flex items-center justify-center">
                  <svg
                    viewBox="0 0 160 160"
                    className="size-44 sm:size-48"
                    role="img"
                    aria-label={`${incomeCount} income and ${expenseCount} expense categories`}
                  >
                    <circle
                      r="60"
                      cx="80"
                      cy="80"
                      fill="none"
                      className="stroke-muted"
                      strokeWidth="22"
                    />
                    {incomeFraction > 0 && (
                      <circle
                        r="60"
                        cx="80"
                        cy="80"
                        fill="none"
                        stroke="#15803D"
                        strokeWidth="22"
                        strokeDasharray={`${incomeFraction * circumference} ${circumference - incomeFraction * circumference}`}
                        strokeDashoffset="0"
                        transform="rotate(-90 80 80)"
                      />
                    )}
                    {expenseFraction > 0 && (
                      <circle
                        r="60"
                        cx="80"
                        cy="80"
                        fill="none"
                        stroke="#B91C1C"
                        strokeWidth="22"
                        strokeDasharray={`${expenseFraction * circumference} ${circumference - expenseFraction * circumference}`}
                        strokeDashoffset={`${-incomeFraction * circumference}`}
                        transform="rotate(-90 80 80)"
                      />
                    )}
                    <text
                      x="80"
                      y="78"
                      textAnchor="middle"
                      className="fill-foreground font-fraunces text-[26px] font-semibold"
                    >
                      {totalCount}
                    </text>
                    <text
                      x="80"
                      y="96"
                      textAnchor="middle"
                      className="fill-muted-foreground text-[11px]"
                    >
                      categories
                    </text>
                  </svg>
                </div>

                {/* Legend */}
                <div className="grid min-w-[200px] gap-3 text-sm">
                  <div className="grid grid-cols-[12px_1fr_auto_44px] items-center gap-2.5">
                    <i className="size-3 rounded-full bg-[#15803D]" />
                    <span>Income</span>
                    <b className="text-right font-semibold">{incomeCount}</b>
                    <span className="text-right text-xs text-muted-foreground">
                      {totalCount
                        ? Math.round((incomeCount / totalCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>

                  <div className="grid grid-cols-[12px_1fr_auto_44px] items-center gap-2.5">
                    <i className="size-3 rounded-full bg-[#B91C1C]" />
                    <span>Expense</span>
                    <b className="text-right font-semibold">{expenseCount}</b>
                    <span className="text-right text-xs text-muted-foreground">
                      {totalCount
                        ? Math.round((expenseCount / totalCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>

                  <div className="grid grid-cols-[12px_1fr_auto_44px] items-center gap-2.5">
                    <i className="size-3 rounded-full bg-[#1D4ED8]" />
                    <span>Active</span>
                    <b className="text-right font-semibold">{activeCount}</b>
                    <span className="text-right text-xs text-muted-foreground">
                      {totalCount
                        ? Math.round((activeCount / totalCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>

                  <div className="grid grid-cols-[12px_1fr_auto_44px] items-center gap-2.5">
                    <i className="size-3 rounded-full bg-[#B45309]" />
                    <span>Inactive</span>
                    <b className="text-right font-semibold">{inactiveCount}</b>
                    <span className="text-right text-xs text-muted-foreground">
                      {totalCount
                        ? Math.round((inactiveCount / totalCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Each piece below is one of your categories, in its color.
                </p>
                <div className="flex h-3.5 overflow-hidden rounded-full bg-muted">
                  {categories.map((c) => (
                    <i
                      key={c.id}
                      className="block h-full flex-1"
                      style={{ backgroundColor: c.color || "#888888" }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">
              Add categories to see the chart.
            </p>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Counts update as you add, activate, or delete categories.
          </p>
        </section>
      )}

      {/* Add / Edit Category Dialog */}
      <PersonalCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        familyId={familyId}
        category={selectedCategory}
        existingCategories={categories}
        onSuccess={loadCategories}
      />
    </div>
  );
}
