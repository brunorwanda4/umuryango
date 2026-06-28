"use client";

import { type Tag, TagInput } from "emblor";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import apiRequest from "@/service/api";

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
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionHint: string;
  inviteEmailLabel: string;
  inviteEmailPlaceholder: string;
  inviteEmailHint: string;
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
    inviteEmailInvalid: string;
  };
  countries: SelectOption[];
  currencies: SelectOption[];
  cadences: SelectOption[];
};

type CreateFamilyResponse = {
  slug?: string;
};

type CreateFamilyFormProps = {
  copy: CreateFamilyFormCopy;
  familyIndexHref: string;
};

type FieldErrors = Partial<
  Record<"name" | "country" | "currency" | "cadence" | "inviteEmail", string>
>;

const createSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function CreateFamilyForm({
  copy,
  familyIndexHref,
}: CreateFamilyFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("RW");
  const [currency, setCurrency] = useState("RWF");
  const [cadence, setCadence] = useState("monthly");
  const [description, setDescription] = useState("");
  const [inviteEmails, setInviteEmails] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const slugPreview = useMemo(() => createSlug(name), [name]);

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      nextErrors.name = copy.validation.nameRequired;
    } else if (trimmedName.length < 2) {
      nextErrors.name = copy.validation.nameLength;
    }

    if (!country) {
      nextErrors.country = copy.validation.countryRequired;
    }

    if (!currency) {
      nextErrors.currency = copy.validation.currencyRequired;
    }

    if (!cadence) {
      nextErrors.cadence = copy.validation.cadenceRequired;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasInvalidEmail = inviteEmails.some(
      (tag) => !emailPattern.test(tag.text.trim()),
    );
    if (hasInvalidEmail) {
      nextErrors.inviteEmail = copy.validation.inviteEmailInvalid;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setIsPending(true);

    const response = await apiRequest<unknown, CreateFamilyResponse>(
      "post",
      "/families",
      {
        name: name.trim(),
        slug: slugPreview,
        country,
        defaultCurrency: currency,
        contributionCadence: cadence,
        description: description.trim() || undefined,
        inviteEmails: inviteEmails.length
          ? inviteEmails.map((tag) => tag.text.trim())
          : undefined,
      },
      {
        idempotencyKey: crypto.randomUUID(),
      },
    );

    if (!response.ok) {
      setFormError(
        response.statusCode === 0
          ? copy.networkError
          : (response.message ?? copy.genericError),
      );
      setIsPending(false);
      return;
    }

    setSuccessMessage(copy.successDescription);
    const createdSlug = response.data?.slug ?? slugPreview;
    router.push(`/family/${encodeURIComponent(createdSlug)}`);
    setIsPending(false);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>{copy.genericError}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert>
          <CheckIcon aria-hidden="true" />
          <AlertTitle>{copy.successTitle}</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="familyName">{copy.nameLabel}</FieldLabel>
          <Input
            id="familyName"
            name="familyName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.namePlaceholder}
            autoComplete="organization"
            required
            maxLength={120}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldDescription>
            {slugPreview ? `/${slugPreview}` : copy.nameDescription}
          </FieldDescription>
          <FieldError>{errors.name}</FieldError>
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field data-invalid={Boolean(errors.country)}>
            <FieldLabel htmlFor="familyCountry">{copy.countryLabel}</FieldLabel>
            <Select value={country} onValueChange={setCountry} required>
              <SelectTrigger
                id="familyCountry"
                className="w-full"
                aria-invalid={Boolean(errors.country)}
              >
                <SelectValue placeholder={copy.countryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {copy.countries.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.country}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.currency)}>
            <FieldLabel htmlFor="familyCurrency">
              {copy.currencyLabel}
            </FieldLabel>
            <Select value={currency} onValueChange={setCurrency} required>
              <SelectTrigger
                id="familyCurrency"
                className="w-full"
                aria-invalid={Boolean(errors.currency)}
              >
                <SelectValue placeholder={copy.currencyPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {copy.currencies.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.currency}</FieldError>
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.cadence)}>
          <FieldLabel htmlFor="contributionCadence">
            {copy.cadenceLabel}
          </FieldLabel>
          <Select value={cadence} onValueChange={setCadence} required>
            <SelectTrigger
              id="contributionCadence"
              className="w-full"
              aria-invalid={Boolean(errors.cadence)}
            >
              <SelectValue placeholder={copy.cadencePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {copy.cadences.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldError>{errors.cadence}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="familyDescription">
            {copy.descriptionLabel}
          </FieldLabel>
          <Textarea
            id="familyDescription"
            name="familyDescription"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={copy.descriptionPlaceholder}
            maxLength={500}
          />
          <FieldDescription>{copy.descriptionHint}</FieldDescription>
        </Field>

        <Field data-invalid={Boolean(errors.inviteEmail)}>
          <FieldLabel htmlFor="inviteEmail">{copy.inviteEmailLabel}</FieldLabel>
          <TagInput
            id="inviteEmail"
            tags={inviteEmails}
            setTags={(newTags) => setInviteEmails(newTags)}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
            placeholder={copy.inviteEmailPlaceholder}
            inputFieldPosition="top"
            addOnPaste
            delimiterList={[",", " ", "Enter", "Tab"]}
            validateTag={(tag) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tag.trim())}
            styleClasses={{
              input: "shadow-none",
              inlineTagsContainer:
                "border-input rounded-md bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] p-1 gap-1",
              tag: {
                body: "bg-secondary text-secondary-foreground rounded px-2 py-0.5",
                closeButton: "text-muted-foreground hover:text-foreground",
              },
            }}
            aria-invalid={Boolean(errors.inviteEmail)}
          />
          <FieldDescription>{copy.inviteEmailHint}</FieldDescription>
          <FieldError>{errors.inviteEmail}</FieldError>
        </Field>
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
