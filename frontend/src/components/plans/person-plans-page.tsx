"use client";

import { AlertCircleIcon, ListChecksIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import apiRequest from "@/service/api";
import { PersonPlanDetailsSheet } from "./person-plan-details-sheet";
import { PersonPlanForm } from "./person-plan-form";
import { PersonPlansFilters } from "./person-plans-filters";
import { PersonPlansHeader } from "./person-plans-header";
import { PersonPlansSummary } from "./person-plans-summary";
import { PersonPlansTabs } from "./person-plans-tabs";
import {
  EMPTY_PLAN_FILTERS,
  isOverdue,
  type PersonalPlansResponse,
  type PersonPlan,
  type PersonPlanStatus,
  type PlanFilters,
  type PlanPerson,
} from "./types-and-schemas";

function PlansSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-14 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {["today", "week", "progress", "complete"].map((item) => (
          <Skeleton key={item} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function PersonPlansPage() {
  const [person, setPerson] = useState<PlanPerson | null>(null);
  const [plans, setPlans] = useState<PersonPlan[]>([]);
  const [filters, setFilters] = useState<PlanFilters>(EMPTY_PLAN_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [createType, setCreateType] = useState<PersonPlan["type"]>("TASK");
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

  const filteredPlans = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return plans.filter((plan) => {
      const planDate = plan.type === "TASK" ? plan.dueDate : plan.targetDate;
      return (
        (!search || plan.title.toLowerCase().includes(search)) &&
        (filters.type === "all" || plan.type === filters.type) &&
        (filters.status === "all" ||
          (filters.status === "OVERDUE"
            ? isOverdue(plan)
            : plan.status === filters.status)) &&
        (filters.priority === "all" || plan.priority === filters.priority) &&
        (!filters.date || planDate?.slice(0, 10) === filters.date)
      );
    });
  }, [filters, plans]);

  const openCreate = (type: PersonPlan["type"] = "TASK") => {
    setCreateType(type);
    setEditPlan(null);
    setFormOpen(true);
  };

  const updateStatus = async (plan: PersonPlan, status: PersonPlanStatus) => {
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
      toast.error("Plan could not be updated", {
        description: response.message,
      });
      void load(detailsPlan?.id);
      return;
    }
    toast.success(
      status === "COMPLETED" ? "Plan completed" : "Plan marked incomplete",
    );
    void load(detailsPlan?.id);
  };

  const confirmDelete = async () => {
    if (!deletePlan) return;
    setDeleting(true);
    const response = await apiRequest(
      "delete",
      `/personal-plans/${encodeURIComponent(deletePlan.id)}`,
    );
    setDeleting(false);
    if (!response.ok) {
      toast.error("Plan could not be deleted", {
        description: response.message,
      });
      return;
    }
    toast.success("Plan deleted");
    setDeletePlan(null);
    setDetailsPlan(null);
    void load();
  };

  if (loading) return <PlansSkeleton />;
  if (error || !person) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Plans could not load</AlertTitle>
          <AlertDescription>
            {error ?? "Person profile not found."}
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
          Try again
        </Button>
      </div>
    );
  }

  const firstName = person.fullName.split(" ")[0] || person.fullName;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PersonPlansHeader person={person} onAdd={() => openCreate()} />
      <PersonPlansSummary plans={plans} />
      {plans.length === 0 ? (
        <Empty className="min-h-80 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListChecksIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No plans for {firstName}</EmptyTitle>
            <EmptyDescription>
              Add a task for today or create an important long-term goal for{" "}
              {firstName}.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => openCreate()}>
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              Add first plan
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <PersonPlansFilters filters={filters} onChange={setFilters} />
          <PersonPlansTabs
            plans={filteredPlans}
            person={person}
            onAdd={openCreate}
            itemActions={{
              onDelete: setDeletePlan,
              onEdit: (plan) => {
                setEditPlan(plan);
                setFormOpen(true);
              },
              onStatus: updateStatus,
              onView: setDetailsPlan,
            }}
          />
        </>
      )}
      <PersonPlanForm
        key={`${editPlan?.id ?? "new"}-${createType}`}
        editPlan={editPlan}
        initialType={createType}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => void load(detailsPlan?.id)}
      />
      <PersonPlanDetailsSheet
        plan={detailsPlan}
        onOpenChange={(open) => {
          if (!open) setDetailsPlan(null);
        }}
        onUpdated={(planId) => void load(planId)}
      />
      <AlertDialog
        open={Boolean(deletePlan)}
        onOpenChange={(open) => {
          if (!open) setDeletePlan(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the plan from the active personal plan list.
              Financial history is not hard-deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? "Deleting..." : "Delete plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
