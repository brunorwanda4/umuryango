"use client";

import { AlertCircleIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/common/pages/page-title";
import {
  calculatePlanSummary,
  filterSharedPlans,
  PlanList,
  PlanPageSkeleton,
  PlanSegmentedFilters,
  PlanSummaryHero,
  type SharedPlanFilterTab,
} from "@/components/common/plans";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import { PersonPlanDetailsSheet } from "./person-plan-details-sheet";
import { PersonPlanForm } from "./person-plan-form";
import { adaptPersonPlanToSharedItem } from "./person-plans-adapter";
import type {
  PersonalPlansResponse,
  PersonPlan,
  PersonPlanStatus,
  PlanPerson,
} from "./types-and-schemas";

export function PersonPlansPage() {
  const t = createTranslator("PersonalPlans");
  const tShared = createTranslator("SharedPlans");

  const [person, setPerson] = useState<PlanPerson | null>(null);
  const [plans, setPlans] = useState<PersonPlan[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [createType, setCreateType] =
    useState<PersonPlan["type"]>("LONG_TERM_GOAL");
  const [editPlan, setEditPlan] = useState<PersonPlan | null>(null);
  const [detailsPlan, setDetailsPlan] = useState<PersonPlan | null>(null);
  const [deletePlan, setDeletePlan] = useState<PersonPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (detailsId?: string) => {
    setError(null);
    const response = await apiRequest<undefined, PersonalPlansResponse>(
      "get",
      "/personal-plans",
    );
    if (!response.ok || !response.data) {
      setError(response.message ?? "Personal plans could not be loaded.");
    } else {
      setPerson(response.data.person);
      setPlans(response.data.plans);
      if (detailsId) {
        setDetailsPlan(
          response.data.plans.find((plan) => plan.id === detailsId) ?? null,
        );
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = (type: PersonPlan["type"] = "LONG_TERM_GOAL") => {
    setCreateType(type);
    setEditPlan(null);
    setFormOpen(true);
  };

  const updateStatus = useCallback(
    async (plan: PersonPlan, status: PersonPlanStatus) => {
      setPlans((current) =>
        current.map((item) =>
          item.id === plan.id
            ? {
                ...item,
                status,
                completedAt:
                  status === "COMPLETED" ? new Date().toISOString() : null,
              }
            : item,
        ),
      );
      const response = await apiRequest(
        "patch",
        `/personal-plans/${encodeURIComponent(plan.id)}`,
        { status },
      );
      if (!response.ok) {
        toast.error(
          t((m) => m.PersonalPlans.toasts.updateFailed),
          {
            description: response.message,
          },
        );
        void load(detailsPlan?.id);
        return;
      }
      toast.success(
        status === "COMPLETED"
          ? t((m) => m.PersonalPlans.toasts.planCompleted)
          : t((m) => m.PersonalPlans.toasts.planIncomplete),
      );
      void load(detailsPlan?.id);
    },
    [detailsPlan?.id, load, t],
  );

  const confirmDelete = async () => {
    if (!deletePlan) return;
    setDeleting(true);
    const response = await apiRequest(
      "delete",
      `/personal-plans/${encodeURIComponent(deletePlan.id)}`,
    );
    setDeleting(false);
    if (!response.ok) {
      toast.error(
        t((m) => m.PersonalPlans.toasts.deleteFailed),
        {
          description: response.message,
        },
      );
      return;
    }
    toast.success(t((m) => m.PersonalPlans.toasts.planDeleted));
    setDeletePlan(null);
    setDetailsPlan(null);
    void load();
  };

  const sharedItems = useMemo(() => {
    return plans.map((plan) =>
      adaptPersonPlanToSharedItem(plan, {
        onEdit: (p) => {
          setEditPlan(p);
          setFormOpen(true);
        },
        onDelete: setDeletePlan,
        onStatus: updateStatus,
        onView: setDetailsPlan,
      }),
    );
  }, [plans, updateStatus]);

  const summary = useMemo(() => {
    return calculatePlanSummary(sharedItems, "RWF");
  }, [sharedItems]);

  const tabs: SharedPlanFilterTab[] = useMemo(() => {
    const savingsCount = sharedItems.filter((i) => i.isFinancial).length;
    const tasksCount = sharedItems.filter((i) => i.taskCheckable).length;
    const completedCount = sharedItems.filter((i) => i.isCompleted).length;

    return [
      {
        id: "all",
        label: tShared((m) => m.SharedPlans.allPlansTab),
        count: sharedItems.length,
      },
      {
        id: "savings",
        label: tShared((m) => m.SharedPlans.savingsTab),
        count: savingsCount,
      },
      {
        id: "tasks",
        label: tShared((m) => m.SharedPlans.tasksTab),
        count: tasksCount,
      },
      {
        id: "completed",
        label: tShared((m) => m.SharedPlans.completedTab),
        count: completedCount,
      },
    ];
  }, [sharedItems, tShared]);

  const filteredItems = useMemo(() => {
    return filterSharedPlans(sharedItems, activeTab, searchQuery);
  }, [sharedItems, activeTab, searchQuery]);

  if (loading) {
    return <PlanPageSkeleton />;
  }

  if (error || !person) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>{t((m) => m.PersonalPlans.loadErrorTitle)}</AlertTitle>
          <AlertDescription>
            {error ?? t((m) => m.PersonalPlans.personNotFound)}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          {t((m) => m.PersonalPlans.tryAgain)}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full min-w-0">
      {/* Page Title with Add Goal Primary Action */}
      <PageTitle
        title={tShared((m) => m.SharedPlans.title)}
        description={tShared((m) => m.SharedPlans.subtitle)}
        actions={
          <Button
            size="sm"
            onClick={() => openCreate("LONG_TERM_GOAL")}
            className="gap-1.5"
          >
            <PlusIcon className="size-4" />
            <span>{tShared((m) => m.SharedPlans.newGoal)}</span>
          </Button>
        }
      />

      {/* Summary Hero Card */}
      <PlanSummaryHero summary={summary} isPersonal={true} />

      {/* Segmented Filter Tabs & Search */}
      <PlanSegmentedFilters
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Plans List */}
      <PlanList
        items={filteredItems}
        hasPlans={sharedItems.length > 0}
        onAdd={() => openCreate("LONG_TERM_GOAL")}
        onResetFilters={() => {
          setActiveTab("all");
          setSearchQuery("");
        }}
        isPersonal={true}
      />

      {/* Existing Create/Edit Dialog */}
      <PersonPlanForm
        key={`${editPlan?.id ?? "new"}-${createType}`}
        editPlan={editPlan}
        initialType={createType}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => void load(detailsPlan?.id)}
      />

      {/* Existing Plan Details Sheet */}
      <PersonPlanDetailsSheet
        plan={detailsPlan}
        onOpenChange={(open) => {
          if (!open) setDetailsPlan(null);
        }}
        onUpdated={(planId) => void load(planId)}
      />

      {/* Existing Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletePlan)}
        onOpenChange={(open) => {
          if (!open) setDeletePlan(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t((m) => m.PersonalPlans.deleteConfirmTitle)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t((m) => m.PersonalPlans.deleteConfirmDesc)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t((m) => m.PersonalPlans.cancel)}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting
                ? t((m) => m.PersonalPlans.deleting)
                : t((m) => m.PersonalPlans.deletePlan)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
