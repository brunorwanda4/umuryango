"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/common/pages/page-title";
import { CategoryFilters } from "@/components/family/money/categories/category-filters";
import { CategoryStatsCards } from "@/components/family/money/categories/category-stats-cards";
import { CategoryTable } from "@/components/family/money/categories/category-table";
import { EditCategoryDialog } from "@/components/family/money/categories/edit-category-dialog";
import {
  type ApiCategory,
  type CategorySort,
  type CategoryStatus,
  type CategoryType,
  enrichApiCategories,
  filterAndSortCategories,
  getCategoryStats,
  type MoneyCategory,
} from "@/components/family/money/categories/types-and-constants";
import { CreateCategoryForm } from "@/components/family/money/forms/create-category-form";
import type { FamilySummary } from "@/components/money/types";
import apiRequest from "@/service/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function PersonalCategoriesPage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MoneyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | CategoryType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CategoryStatus>(
    "ALL",
  );
  const [sort, setSort] = useState<CategorySort>("updated-desc");
  const [editingCategory, setEditingCategory] = useState<MoneyCategory | null>(
    null,
  );

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setMessage(undefined);

    const familiesResponse = await apiRequest<undefined, FamilySummary[]>(
      "get",
      "/families?limit=1",
    );
    const family = familiesResponse.data?.[0];

    if (!familiesResponse.ok || !family) {
      setFamilyId(null);
      setCategories([]);
      setMessage(
        familiesResponse.ok
          ? "Create or join a family workspace before managing personal categories."
          : (familiesResponse.message ??
              "Family workspace could not be loaded."),
      );
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
      setMessage(
        response.message ?? "Personal categories could not be loaded.",
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const stats = useMemo(() => getCategoryStats(categories), [categories]);
  const visibleCategories = useMemo(
    () =>
      filterAndSortCategories(
        categories,
        search,
        typeFilter,
        statusFilter,
        sort,
      ),
    [categories, search, sort, statusFilter, typeFilter],
  );

  const setCategoryStatus = async (
    category: MoneyCategory,
    status: CategoryStatus,
  ) => {
    if (!familyId) return;
    const response = await apiRequest(
      "patch",
      `/families/${encodeURIComponent(familyId)}/money/categories/mine/${encodeURIComponent(category.id)}`,
      { status },
    );
    if (!response.ok) {
      toast.error(response.message ?? "Category status could not be updated.");
      return;
    }
    setCategories((current) =>
      current.map((item) =>
        item.id === category.id ? { ...item, status } : item,
      ),
    );
    toast.success(
      status === "ACTIVE"
        ? `${category.name} is active again`
        : `${category.name} has been archived`,
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Categories"
        iconImage="/images/icons/categories.png"
        description="Manage the income and expense categories used in your personal money records."
        actions={
          familyId ? (
            <CreateCategoryForm
              existingCategories={categories}
              familyId={familyId}
              onSuccess={loadCategories}
              personal
            />
          ) : null
        }
      />
      <CategoryStatsCards stats={stats} />
      <Tabs>
        <TabsList>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        <TabsContent value="data">
          <CategoryTable
            apiMessage={message}
            categories={visibleCategories}
            currency="RWF"
            loading={loading}
            onArchive={setCategoryStatus}
            onEdit={setEditingCategory}
          />
        </TabsContent>
        <TabsContent value="charts">charts</TabsContent>
      </Tabs>
      {familyId ? (
        <EditCategoryDialog
          categories={categories}
          category={editingCategory}
          familyId={familyId}
          onOpenChange={(open) => {
            if (!open) setEditingCategory(null);
          }}
          onUpdated={(category) => {
            setCategories((current) =>
              current.map((item) =>
                item.id === category.id ? category : item,
              ),
            );
            setEditingCategory(null);
          }}
          personal
        />
      ) : null}
    </div>
  );
}
