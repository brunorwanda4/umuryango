"use client";

import { ArrowLeftIcon, CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";

type SelectOption = {
  value: string;
  label: string;
};

export type CreateFamilyFormCopy = {
  nameLabel: string;
  namePlaceholder: string;
  nameDescription: string;
  countryLabel: string;
  countryPlaceholder: string;
  currencyLabel: string;
  currencyPlaceholder: string;
  cadenceLabel: string;
  cadencePlaceholder: string;
  familyTypeLabel: string;
  familyTypePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionHint: string;
  inviteEmailLabel: string;
  inviteEmailPlaceholder: string;
  inviteEmailHint: string;
  kinshipLabel: string;
  kinshipPlaceholder: string;
  addMemberLabel: string;
  removeMemberLabel: string;
  submitLabel: string;
  pendingLabel: string;
  cancelLabel: string;
  successTitle: string;
  successDescription: string;
  genericError: string;
  networkError: string;
  validation: {
    nameRequired: string;
    nameLength: string;
    countryRequired: string;
    currencyRequired: string;
    cadenceRequired: string;
    familyTypeRequired: string;
    inviteEmailInvalid: string;
  };
  countries: SelectOption[];
  currencies: SelectOption[];
  cadences: SelectOption[];
  familyTypes: SelectOption[];
  kinships: SelectOption[];
};

type CreateFamilyResponse = {
  slug?: string;
};

type CreateFamilyFormProps = {
  copy: CreateFamilyFormCopy;
  familyIndexHref: string;
};

type CreateFamilyFormValues = {
  name: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  type: string;
  description: string;
  inviteMembers: { email: string; kinshipLabel: string }[];
};

const createSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getCreateFamilySchema = (copy: CreateFamilyFormCopy) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, copy.validation.nameRequired)
      .min(2, copy.validation.nameLength)
      .max(120),
    country: z.string().min(1, copy.validation.countryRequired),
    defaultCurrency: z.string().min(1, copy.validation.currencyRequired),
    contributionCadence: z.string().min(1, copy.validation.cadenceRequired),
    type: z.string().min(1, copy.validation.familyTypeRequired),
    description: z.string().max(500),
    inviteMembers: z
      .array(
        z.object({
          email: z
            .string()
            .trim()
            .refine((value) => value === "" || emailPattern.test(value), {
              message: copy.validation.inviteEmailInvalid,
            }),
          kinshipLabel: z.string(),
        }),
      )
      .max(50, copy.validation.inviteEmailInvalid),
  });

export function CreateFamilyForm({
  copy,
  familyIndexHref,
}: CreateFamilyFormProps) {
  const router = useRouter();

  const schema = useMemo(() => getCreateFamilySchema(copy), [copy]);
  const { form, onSubmit, error, success, isPending } = useZodFormSubmit<
    CreateFamilyFormValues,
    CreateFamilyResponse
  >({
    schema,
    formOptions: {
      defaultValues: {
        name: "",
        country: "RW",
        defaultCurrency: "RWF",
        contributionCadence: "monthly",
        type: "NUCLEAR",
        description: "",
        inviteMembers: [{ email: "", kinshipLabel: "" }],
      },
    },
    request: {
      method: "post",
      url: "/families",
      apiRequest: () => ({
        idempotencyKey: crypto.randomUUID(),
      }),
    },
    transform: (values) => ({
      name: values.name.trim(),
      slug: createSlug(values.name),
      country: values.country,
      defaultCurrency: values.defaultCurrency,
      contributionCadence: values.contributionCadence,
      type: values.type,
      description: values.description.trim() || undefined,
      invites: (() => {
        const invites = values.inviteMembers
          .filter((member) => member.email.trim() !== "")
          .map((member) => ({
            email: member.email.trim().toLowerCase(),
            kinshipLabel: member.kinshipLabel || undefined,
          }));
        return invites.length ? invites : undefined;
      })(),
    }),
    onSuccessMessage: copy.successDescription,
    onSuccess: (data, values) => {
      const createdSlug = data?.slug ?? createSlug(values.name);
      router.push(`/family/${encodeURIComponent(createdSlug)}`);
    },
    toastOnError: true,
  });

  const {
    fields: inviteFields,
    append: appendInvite,
    remove: removeInvite,
  } = useFieldArray({ control: form.control, name: "inviteMembers" });

  const name = form.watch("name");
  const slugPreview = useMemo(() => createSlug(name), [name]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{copy.genericError}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <CheckIcon aria-hidden="true" />
          <AlertTitle>{copy.successTitle}</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <CommonFormField
          control={form.control}
          name="name"
          label={copy.nameLabel}
          placeholder={copy.namePlaceholder}
          description={slugPreview ? `/${slugPreview}` : copy.nameDescription}
          required
          inputProps={{
            autoComplete: "organization",
            maxLength: 120,
          }}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <CommonFormField
            control={form.control}
            name="country"
            label={copy.countryLabel}
            placeholder={copy.countryPlaceholder}
            fieldType="select"
            selectOptions={copy.countries}
            required
          />

          <CommonFormField
            control={form.control}
            name="defaultCurrency"
            label={copy.currencyLabel}
            placeholder={copy.currencyPlaceholder}
            fieldType="select"
            selectOptions={copy.currencies}
            required
          />
        </div>

        <CommonFormField
          control={form.control}
          name="contributionCadence"
          label={copy.cadenceLabel}
          placeholder={copy.cadencePlaceholder}
          fieldType="select"
          selectOptions={copy.cadences}
          required
        />

        <CommonFormField
          control={form.control}
          name="type"
          label={copy.familyTypeLabel}
          placeholder={copy.familyTypePlaceholder}
          fieldType="select"
          selectOptions={copy.familyTypes}
          required
        />

        <CommonFormField
          control={form.control}
          name="description"
          label={copy.descriptionLabel}
          placeholder={copy.descriptionPlaceholder}
          description={copy.descriptionHint}
          fieldType="textarea"
          textareaProps={{
            maxLength: 500,
          }}
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">{copy.inviteEmailLabel}</span>
            <span className="text-muted-foreground text-sm">
              {copy.inviteEmailHint}
            </span>
          </div>

          {inviteFields.map((memberField, index) => (
            <div
              key={memberField.id}
              className="grid gap-3 sm:grid-cols-[1fr_minmax(0,12rem)_auto] sm:items-end"
            >
              <CommonFormField
                control={form.control}
                name={`inviteMembers.${index}.email`}
                label={copy.inviteEmailLabel}
                placeholder={copy.inviteEmailPlaceholder}
                type="email"
                inputProps={{ autoComplete: "email" }}
              />
              <CommonFormField
                control={form.control}
                name={`inviteMembers.${index}.kinshipLabel`}
                label={copy.kinshipLabel}
                placeholder={copy.kinshipPlaceholder}
                fieldType="select"
                selectOptions={copy.kinships}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeInvite(index)}
                disabled={inviteFields.length === 1}
                aria-label={copy.removeMemberLabel}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => appendInvite({ email: "", kinshipLabel: "" })}
            disabled={inviteFields.length >= 50}
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            {copy.addMemberLabel}
          </Button>
        </div>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button href={familyIndexHref} variant="outline">
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          {copy.cancelLabel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" />
              {copy.pendingLabel}
            </>
          ) : (
            copy.submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
