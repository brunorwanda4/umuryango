"use client";

import { CheckIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { createTranslator } from "@/i18n/translate";
import {
  AUTHORITY_LABELS,
  type FamilyAuthority,
  type FamilyCapability,
  type FamilyKinship,
  hasCapability,
  KINSHIP_LABELS,
} from "@/lib/family-access";
import apiRequest from "@/service/api";

const t = createTranslator("FamilyMembers");
const tCommon = createTranslator("Common");
const tDashboard = createTranslator("FamilyDashboard");

type AssignableAuthority = Exclude<FamilyAuthority, "HEAD">;

type FamilyMemberSummary = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  authority: FamilyAuthority;
  kinshipLabel: FamilyKinship | null;
  kinshipCustom: string | null;
  capabilities: FamilyCapability[];
  joinedAt: string;
};

type FamilyDetail = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  description: string | null;
  createdAt: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  memberCount: number;
  members: FamilyMemberSummary[];
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; family: FamilyDetail };

const ASSIGNABLE_AUTHORITIES: {
  value: AssignableAuthority;
  label: string;
}[] = [
  { value: "ADMIN", label: AUTHORITY_LABELS.ADMIN },
  { value: "MEMBER", label: AUTHORITY_LABELS.MEMBER },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const joinedFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function FamilyMembersPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = use(params);
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setState({ status: "loading" });
      }

      const response = await apiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(familyName)}`,
      );

      if (response.ok && response.data) {
        setState({ status: "success", family: response.data });
      } else {
        setState({
          status: "error",
          message: response.message ?? t((m) => m.FamilyMembers.unableToLoad),
        });
      }
    },
    [familyName],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === "loading") {
    return <MembersSkeleton />;
  }

  if (state.status === "error") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>
            {tDashboard((m) => m.FamilyDashboard.familyNotFound)}
          </EmptyTitle>
          <EmptyDescription>
            {tDashboard((m) => m.FamilyDashboard.familyNotFoundDesc, {
              error: state.message,
            })}{" "}
            <Link href="/family">
              {tDashboard((m) => m.FamilyDashboard.backToFamilies)}
            </Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <MembersManager
      family={state.family}
      familySlug={familyName}
      onChanged={() => load({ silent: true })}
    />
  );
}

function MembersManager({
  family,
  familySlug,
  onChanged,
}: {
  family: FamilyDetail;
  familySlug: string;
  onChanged: () => void;
}) {
  const canManage = hasCapability(family, "MANAGE_MEMBERS");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-2xl tracking-tight">
            {t((m) => m.FamilyMembers.title)}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t((m) => m.FamilyMembers.membersInFamily, {
              count: family.memberCount,
              familyName: family.name,
            })}
          </p>
        </div>
        {canManage ? (
          <AddMemberDialog familySlug={familySlug} onAdded={onChanged} />
        ) : null}
      </header>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4" aria-hidden="true" />
            {t((m) => m.FamilyMembers.title)}
          </CardTitle>
          <CardDescription>
            {canManage
              ? t((m) => m.FamilyMembers.descriptionManage)
              : t((m) => m.FamilyMembers.descriptionView)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {family.members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              familySlug={familySlug}
              canManage={canManage}
              onChanged={onChanged}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MemberRow({
  member,
  familySlug,
  canManage,
  onChanged,
}: {
  member: FamilyMemberSummary;
  familySlug: string;
  canManage: boolean;
  onChanged: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const editable = canManage && member.authority !== "HEAD";

  const changeAuthority = async (authority: AssignableAuthority) => {
    if (authority === member.authority) return;

    setPending(true);
    setError(undefined);

    const response = await apiRequest(
      "patch",
      `/families/${encodeURIComponent(familySlug)}/members/${encodeURIComponent(
        member.id,
      )}`,
      { authority },
    );

    setPending(false);

    if (response.ok) {
      onChanged();
    } else {
      setError(response.message ?? t((m) => m.FamilyMembers.unableToUpdate));
    }
  };

  return (
    <div className="flex flex-col gap-1 border-border/60 border-b py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          {member.avatarUrl ? (
            <AvatarImage src={member.avatarUrl} alt={member.fullName} />
          ) : null}
          <AvatarFallback name={member.fullName} />
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-sm">
            {member.fullName}
          </span>
          <span className="text-muted-foreground text-xs">
            {tDashboard((m) => m.FamilyDashboard.joinedDate, {
              date: joinedFormatter.format(new Date(member.joinedAt)),
            })}
          </span>
          {member.kinshipLabel ? (
            <span className="text-muted-foreground text-xs">
              {member.kinshipLabel === "OTHER" && member.kinshipCustom
                ? member.kinshipCustom
                : KINSHIP_LABELS[member.kinshipLabel]}
            </span>
          ) : null}
        </div>
        {editable ? (
          <div className="flex items-center gap-2">
            {pending ? <Spinner className="size-4" /> : null}
            <Select
              value={member.authority}
              onValueChange={(value) =>
                changeAuthority(value as AssignableAuthority)
              }
              disabled={pending}
            >
              <SelectTrigger
                className="w-32"
                aria-label={t((m) => m.FamilyMembers.memberAuthority)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_AUTHORITIES.map((authority) => (
                  <SelectItem key={authority.value} value={authority.value}>
                    {authority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Badge variant="outline">{AUTHORITY_LABELS[member.authority]}</Badge>
        )}
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

type AddMemberFormValues = {
  email: string;
  authority: AssignableAuthority;
};

const addMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(
      1,
      t((m) => m.FamilyMembers.emailRequired),
    )
    .refine((value) => emailPattern.test(value), {
      message: t((m) => m.FamilyMembers.emailInvalid),
    }),
  authority: z.enum(["ADMIN", "MEMBER"]),
});

function AddMemberDialog({
  familySlug,
  onAdded,
}: {
  familySlug: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon data-icon="inline-start" aria-hidden="true" />
          {t((m) => m.FamilyMembers.inviteMember)}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t((m) => m.FamilyMembers.inviteTitle)}</DialogTitle>
          <DialogDescription>
            {t((m) => m.FamilyMembers.inviteDesc)}
          </DialogDescription>
        </DialogHeader>
        <AddMemberForm
          familySlug={familySlug}
          onAdded={() => {
            setOpen(false);
            onAdded();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddMemberForm({
  familySlug,
  onAdded,
}: {
  familySlug: string;
  onAdded: () => void;
}) {
  const { form, onSubmit, error, success, isPending } =
    useZodFormSubmit<AddMemberFormValues>({
      schema: addMemberSchema,
      formOptions: {
        defaultValues: { email: "", authority: "MEMBER" },
      },
      request: {
        method: "post",
        url: `/families/${encodeURIComponent(familySlug)}/members`,
        apiRequest: () => ({ idempotencyKey: crypto.randomUUID() }),
      },
      transform: (values) => ({
        email: values.email.trim().toLowerCase(),
        authority: values.authority,
      }),
      onSuccessMessage: t((m) => m.FamilyMembers.inviteSuccess),
      onSuccess: () => {
        form.reset();
        onAdded();
      },
      toastOnError: true,
      toastOnSuccess: true,
    });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{t((m) => m.FamilyMembers.addMemberError)}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <CheckIcon aria-hidden="true" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <CommonFormField
          control={form.control}
          name="email"
          label={t((m) => m.FamilyMembers.inviteEmail)}
          placeholder="member@example.com"
          type="email"
          required
          inputProps={{ autoComplete: "email" }}
        />
        <CommonFormField
          control={form.control}
          name="authority"
          label={t((m) => m.FamilyMembers.inviteRole)}
          fieldType="select"
          selectOptions={ASSIGNABLE_AUTHORITIES}
          required
        />
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {tCommon((m) => m.Common.cancel)}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" />
              {t((m) => m.FamilyMembers.sending)}
            </>
          ) : (
            t((m) => m.FamilyMembers.sendInvite)
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function MembersSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Separator />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
