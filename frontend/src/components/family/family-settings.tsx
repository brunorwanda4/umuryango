"use client";

import {
  ArrowRightIcon,
  ClipboardListIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ALL_CAPABILITIES,
  AUTHORITY_LABELS,
  CAPABILITY_LABELS,
  type FamilyAuthority,
  type FamilyCapability,
  type FamilyKinship,
  hasCapability,
  KINSHIP_LABELS,
} from "@/lib/family-access";
import apiRequest from "@/service/api";

type Member = {
  id: string;
  fullName: string;
  authority: FamilyAuthority;
  kinshipLabel: FamilyKinship | null;
  kinshipCustom: string | null;
  capabilities: FamilyCapability[];
};

type FamilyType =
  | "NUCLEAR"
  | "JOINT_EXTENDED"
  | "SINGLE_PARENT"
  | "BLENDED"
  | "ADOPTIVE";

type FamilyDetail = {
  id: string;
  name: string;
  slug: string;
  type: FamilyType;
  defaultCurrency: string;
  contributionCadence: string;
  description: string | null;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  members: Member[];
};

type AuditEvent = {
  id: string;
  action: string;
  actorId: string;
  targetMemberId: string | null;
  createdAt: string;
};

type FamilySettingsPage = "overview" | "general" | "members" | "audit";

const FAMILY_TYPE_OPTIONS: { value: FamilyType; label: string }[] = [
  { value: "NUCLEAR", label: "Nuclear family" },
  { value: "JOINT_EXTENDED", label: "Joint / extended family" },
  { value: "SINGLE_PARENT", label: "Single-parent family" },
  { value: "BLENDED", label: "Blended family" },
  { value: "ADOPTIVE", label: "Adoptive family" },
];

const CURRENCY_OPTIONS = ["RWF", "USD", "EUR", "KES", "TZS", "UGX"];

const CADENCE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "as-needed", label: "As needed" },
  { value: "project-based", label: "Project based" },
  { value: "event-based", label: "Event based" },
];

export function FamilySettings({
  familySlug,
  page = "overview",
}: {
  familySlug: string;
  page?: FamilySettingsPage;
}) {
  const [family, setFamily] = useState<FamilyDetail>();
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    const response = await apiRequest<undefined, FamilyDetail>(
      "get",
      `/families/${encodeURIComponent(familySlug)}`,
    );

    if (response.ok && response.data) {
      setFamily(response.data);
      setError(undefined);
    } else {
      setError(response.message ?? "Unable to load this family.");
    }
  }, [familySlug]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Cannot open settings</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!family) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const canManageMembers = hasCapability(family, "MANAGE_MEMBERS");
  const canManageSettings = hasCapability(family, "MANAGE_FAMILY_SETTINGS");
  const settingsHref = `/family/${encodeURIComponent(familySlug)}/settings`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl tracking-tight">
          {getPageTitle(page)}
        </h1>
        <p className="text-muted-foreground text-sm">{family.name}</p>
      </div>

      {page === "overview" ? (
        <SettingsOverview
          canManageMembers={canManageMembers}
          canManageSettings={canManageSettings}
          settingsHref={settingsHref}
        />
      ) : null}

      {page === "general" ? (
        canManageSettings ? (
          <GeneralTab familySlug={familySlug} family={family} onSaved={load} />
        ) : (
          <SettingsPermissionAlert action="manage general family settings" />
        )
      ) : null}

      {page === "members" ? (
        <div className="flex flex-col gap-3">
          {family.members.map((member) => (
            <MemberAccessCard
              key={member.id}
              familySlug={familySlug}
              member={member}
              actor={family}
              onChanged={load}
            />
          ))}
        </div>
      ) : null}

      {page === "audit" ? (
        canManageMembers ? (
          <AuditTab familySlug={familySlug} />
        ) : (
          <SettingsPermissionAlert action="view the family audit log" />
        )
      ) : null}
    </div>
  );
}

function SettingsOverview({
  canManageMembers,
  canManageSettings,
  settingsHref,
}: {
  canManageMembers: boolean;
  canManageSettings: boolean;
  settingsHref: string;
}) {
  const sections = [
    {
      title: "General",
      description: "Edit family name, type, currency, and contribution rhythm.",
      href: `${settingsHref}/general`,
      icon: SettingsIcon,
      enabled: canManageSettings,
    },
    {
      title: "Members and access",
      description: "Control capabilities for each family member.",
      href: `${settingsHref}/members`,
      icon: UsersIcon,
      enabled: true,
    },
    {
      title: "Audit",
      description: "Review recent permission and member activity.",
      href: `${settingsHref}/audit`,
      icon: ClipboardListIcon,
      enabled: canManageMembers,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sections.map((section) => (
        <Card key={section.href}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <section.icon className="size-5" aria-hidden="true" />
              {section.enabled ? null : (
                <Badge variant="outline">No access</Badge>
              )}
            </div>
            <CardTitle className="text-base">{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {section.enabled ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={section.href}>
                  Open
                  <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                Restricted
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SettingsPermissionAlert({ action }: { action: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Access restricted</AlertTitle>
      <AlertDescription>
        You do not have permission to {action}.
      </AlertDescription>
    </Alert>
  );
}

function getPageTitle(page: FamilySettingsPage) {
  if (page === "general") return "General settings";
  if (page === "members") return "Member access";
  if (page === "audit") return "Audit log";

  return "Family settings";
}

function MemberAccessCard({
  familySlug,
  member,
  actor,
  onChanged,
}: {
  familySlug: string;
  member: Member;
  actor: { authority: FamilyAuthority; capabilities: FamilyCapability[] };
  onChanged: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const editable =
    hasCapability(actor, "MANAGE_MEMBERS") && member.authority !== "HEAD";

  const toggle = async (capability: FamilyCapability, checked: boolean) => {
    const capabilities = checked
      ? Array.from(new Set([...member.capabilities, capability]))
      : member.capabilities.filter((item) => item !== capability);

    setPending(true);
    setError(undefined);

    const response = await apiRequest(
      "patch",
      `/families/${encodeURIComponent(familySlug)}/members/${encodeURIComponent(
        member.id,
      )}`,
      { capabilities },
    );

    setPending(false);

    if (response.ok) {
      onChanged();
    } else {
      setError(response.message ?? "Unable to update access.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="min-w-0 truncate">{member.fullName}</span>
          <Badge variant="outline">{AUTHORITY_LABELS[member.authority]}</Badge>
        </CardTitle>
        <CardDescription>
          {member.kinshipLabel
            ? member.kinshipLabel === "OTHER" && member.kinshipCustom
              ? member.kinshipCustom
              : KINSHIP_LABELS[member.kinshipLabel]
            : "No relationship set"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {ALL_CAPABILITIES.map((capability) => {
          const granted =
            member.authority === "HEAD" ||
            member.capabilities.includes(capability);
          const actorCanGrant = hasCapability(actor, capability);
          const checkboxId = `capability-${member.id}-${capability}`;

          return (
            <label
              key={capability}
              className="flex items-center gap-2 text-sm"
              htmlFor={checkboxId}
            >
              <Checkbox
                id={checkboxId}
                checked={granted}
                disabled={
                  !editable ||
                  pending ||
                  member.authority === "HEAD" ||
                  !actorCanGrant
                }
                onCheckedChange={(value) => toggle(capability, value === true)}
              />
              <span className="text-muted-foreground">
                {CAPABILITY_LABELS[capability]}
              </span>
            </label>
          );
        })}
        {error ? (
          <p className="text-destructive text-sm sm:col-span-2">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GeneralTab({
  familySlug,
  family,
  onSaved,
}: {
  familySlug: string;
  family: FamilyDetail;
  onSaved: () => void;
}) {
  const [name, setName] = useState(family.name);
  const [type, setType] = useState<FamilyType>(family.type);
  const [currency, setCurrency] = useState(family.defaultCurrency);
  const [cadence, setCadence] = useState(family.contributionCadence);
  const [description, setDescription] = useState(family.description ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const nameId = `${family.id}-settings-name`;
  const descriptionId = `${family.id}-settings-description`;

  useEffect(() => {
    setName(family.name);
    setType(family.type);
    setCurrency(family.defaultCurrency);
    setCadence(family.contributionCadence);
    setDescription(family.description ?? "");
  }, [family]);

  const save = async () => {
    setPending(true);
    setError(undefined);

    const response = await apiRequest(
      "patch",
      `/families/${encodeURIComponent(familySlug)}/settings`,
      {
        name,
        type,
        defaultCurrency: currency,
        contributionCadence: cadence,
        description,
      },
    );

    setPending(false);

    if (response.ok) {
      onSaved();
    } else {
      setError(response.message ?? "Unable to save settings.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">General</CardTitle>
        <CardDescription>
          Family name, type, and money defaults.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label className="font-medium text-sm" htmlFor={nameId}>
            Family name
          </label>
          <Input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-sm">Family type</span>
          <Select
            value={type}
            onValueChange={(value) => setType(value as FamilyType)}
          >
            <SelectTrigger aria-label="Family type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FAMILY_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-sm">Default currency</span>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger aria-label="Default currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-sm">Contribution rhythm</span>
            <Select value={cadence} onValueChange={setCadence}>
              <SelectTrigger aria-label="Contribution rhythm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CADENCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-medium text-sm" htmlFor={descriptionId}>
            Family note
          </label>
          <Textarea
            id={descriptionId}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AuditTab({ familySlug }: { familySlug: string }) {
  const [events, setEvents] = useState<AuditEvent[]>();

  useEffect(() => {
    let active = true;

    apiRequest<undefined, AuditEvent[]>(
      "get",
      `/families/${encodeURIComponent(familySlug)}/audit`,
    ).then((response) => {
      if (active && response.ok && response.data) {
        setEvents(response.data);
      }
    });

    return () => {
      active = false;
    };
  }, [familySlug]);

  if (!events) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent changes</CardTitle>
        <CardDescription>Permission and member activity.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-3 border-border/60 border-b py-2 text-sm last:border-b-0"
            >
              <span>{event.action.replaceAll("_", " ").toLowerCase()}</span>
              <span className="text-muted-foreground text-xs">
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
