"use client";

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

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

type CreateFamilyResponse = {
  slug?: string;
  data?: {
    slug?: string;
  };
};

type CreateFamilyFormProps = {
  copy: CreateFamilyFormCopy;
  familyIndexHref: string;
};

type FieldErrors = Partial<
  Record<"name" | "country" | "currency" | "cadence" | "inviteEmail", string>
>;

const getApiUrl = (path: string) => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:4915";
  const baseUrl = configuredUrl.replace(/\/$/, "");

  if (baseUrl.endsWith("/api/v1")) {
    return `${baseUrl}/${path}`;
  }

  return `${baseUrl}/api/v1/${path}`;
};

const getErrorMessage = (payload: ApiErrorResponse, genericError: string) => {
  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? genericError;
  }

  return payload.message ?? payload.error ?? genericError;
};

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
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [cadence, setCadence] = useState("");
  const [description, setDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const slugPreview = useMemo(() => createSlug(name), [name]);

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedInviteEmail = inviteEmail.trim();

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

    if (
      trimmedInviteEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedInviteEmail)
    ) {
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

    try {
      const response = await fetch(getApiUrl("families"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          slug: slugPreview,
          country,
          defaultCurrency: currency,
          contributionCadence: cadence,
          description: description.trim() || undefined,
          inviteEmail: inviteEmail.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | (ApiErrorResponse & CreateFamilyResponse)
        | undefined;

      if (!response.ok) {
        setFormError(getErrorMessage(payload ?? {}, copy.genericError));
        return;
      }

      setSuccessMessage(copy.successDescription);
      const createdSlug = payload?.data?.slug ?? payload?.slug ?? slugPreview;
      router.push(`/family/${encodeURIComponent(createdSlug)}`);
    } catch (err) {
      const isNetworkError =
        err instanceof TypeError && err.message.toLowerCase().includes("fetch");
      setFormError(isNetworkError ? copy.networkError : copy.genericError);
    } finally {
      setIsPending(false);
    }
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
          <Input
            id="inviteEmail"
            name="inviteEmail"
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder={copy.inviteEmailPlaceholder}
            autoComplete="email"
            maxLength={254}
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
