"use client";

import { CheckIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { createTranslator } from "@/i18n/translate";
import {
  AUTHORITY_LABELS,
  type FamilyAuthority,
  type FamilyKinship,
  type FamilyType,
  getKinshipOptions,
} from "@/lib/family-access";
import apiRequest from "@/service/api";

const t = createTranslator("FamilyMembers");
const tCommon = createTranslator("Common");

export type AssignableAuthority = Exclude<FamilyAuthority, "HEAD">;

export const ASSIGNABLE_AUTHORITIES: {
  value: AssignableAuthority;
  label: string;
}[] = [
  { value: "ADMIN", label: AUTHORITY_LABELS.ADMIN },
  { value: "MEMBER", label: AUTHORITY_LABELS.MEMBER },
];

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const addMemberSchema = z
  .object({
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
    kinshipLabel: z.string().optional(),
    kinshipCustom: z.string().max(80).optional(),
  })
  .refine(
    (values) => {
      if (values.kinshipLabel === "OTHER") {
        return Boolean(
          values.kinshipCustom && values.kinshipCustom.trim().length > 0,
        );
      }
      return true;
    },
    {
      message: t((m) => m.FamilyMembers.customKinshipRequired),
      path: ["kinshipCustom"],
    },
  );

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export interface AddMemberFormProps {
  familySlug: string;
  familyType?: FamilyType;
  onAdded?: () => void;
  onCancel?: () => void;
}

export function AddMemberForm({
  familySlug,
  familyType,
  onAdded,
  onCancel,
}: AddMemberFormProps) {
  const [resolvedType, setResolvedType] = useState<FamilyType | undefined>(
    familyType,
  );

  useEffect(() => {
    if (familyType) {
      setResolvedType(familyType);
      return;
    }

    let active = true;
    apiRequest<undefined, { type?: FamilyType }>(
      "get",
      `/families/${encodeURIComponent(familySlug)}`,
    )
      .then((res) => {
        if (active && res.ok && res.data?.type) {
          setResolvedType(res.data.type);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [familySlug, familyType]);

  const kinshipOptions = useMemo(
    () => getKinshipOptions(resolvedType),
    [resolvedType],
  );

  const { form, onSubmit, error, success, isPending } =
    useZodFormSubmit<AddMemberFormValues>({
      schema: addMemberSchema,
      formOptions: {
        defaultValues: {
          email: "",
          authority: "MEMBER",
          kinshipLabel: "",
          kinshipCustom: "",
        },
      },
      request: {
        method: "post",
        url: `/families/${encodeURIComponent(familySlug)}/members`,
        apiRequest: () => ({ idempotencyKey: crypto.randomUUID() }),
      },
      transform: (values) => ({
        email: values.email.trim().toLowerCase(),
        authority: values.authority,
        kinshipLabel: values.kinshipLabel
          ? (values.kinshipLabel as FamilyKinship)
          : undefined,
        kinshipCustom:
          values.kinshipLabel === "OTHER" && values.kinshipCustom
            ? values.kinshipCustom.trim()
            : undefined,
      }),
      onSuccessMessage: t((m) => m.FamilyMembers.inviteSuccess),
      onSuccess: () => {
        form.reset();
        onAdded?.();
      },
      toastOnError: true,
      toastOnSuccess: true,
    });

  const selectedKinship = form.watch("kinshipLabel");

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
        <CommonFormField
          control={form.control}
          name="kinshipLabel"
          label={t((m) => m.FamilyMembers.inviteKinship)}
          placeholder={t((m) => m.FamilyMembers.inviteKinshipPlaceholder)}
          fieldType="select"
          selectOptions={kinshipOptions}
        />
        {selectedKinship === "OTHER" ? (
          <CommonFormField
            control={form.control}
            name="kinshipCustom"
            label={t((m) => m.FamilyMembers.customKinshipLabel)}
            placeholder={t((m) => m.FamilyMembers.customKinshipPlaceholder)}
            required
            inputProps={{ maxLength: 80 }}
          />
        ) : null}
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>
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

export interface AddMemberDialogProps {
  familySlug: string;
  familyType?: FamilyType;
  onAdded?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AddMemberDialog({
  familySlug,
  familyType,
  onAdded,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: AddMemberDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    setControlledOpen?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== null ? (
        trigger !== undefined ? (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button>
              <UserPlusIcon data-icon="inline-start" aria-hidden="true" />
              {t((m) => m.FamilyMembers.inviteMember)}
            </Button>
          </DialogTrigger>
        )
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t((m) => m.FamilyMembers.inviteTitle)}</DialogTitle>
          <DialogDescription>
            {t((m) => m.FamilyMembers.inviteDesc)}
          </DialogDescription>
        </DialogHeader>
        <AddMemberForm
          familySlug={familySlug}
          familyType={familyType}
          onAdded={() => {
            handleOpenChange(false);
            onAdded?.();
          }}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
