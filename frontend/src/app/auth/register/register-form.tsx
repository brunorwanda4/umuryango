"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FloatingField } from "@/components/ui/floating-field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export type RegisterFormCopy = {
  firstNameLabel: string;
  lastNameLabel: string;
  genderLabel: string;
  genderPlaceholder: string;
  emailLabel: string;
  phoneLabel: string;
  contactHint: string;
  passwordLabel: string;
  legal: string;
  submitLabel: string;
  pendingLabel: string;
  haveAccount: string;
  success: string;
  genericError: string;
  verifyHeading: string;
  verifyDescription: string;
  codeLabel: string;
  verifySubmitLabel: string;
  verifyPendingLabel: string;
  verifySuccess: string;
  verifyGenericError: string;
  resendLabel: string;
  resendPendingLabel: string;
  resendSuccess: string;
  genderOptions: Array<{
    value: string;
    label: string;
  }>;
};

type ApiErrorResponse = {
  message?: string | string[];
  error?: {
    message?: string;
  };
};

const getAuthUrl = (path: string) => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:3000";
  const baseUrl = configuredUrl.replace(/\/$/, "");

  if (baseUrl.endsWith("/api/v1")) {
    return `${baseUrl}/auth/${path}`;
  }

  return `${baseUrl}/api/v1/auth/${path}`;
};

const getErrorMessage = (payload: ApiErrorResponse, genericError: string) => {
  if (payload.error?.message) {
    return payload.error.message;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? genericError;
  }

  return payload.message ?? genericError;
};

const inputClassName =
  "h-14 rounded-[1.125rem] border-input/80 bg-background/70 px-5 text-[0.95rem] shadow-none placeholder:text-muted-foreground";

type RegisterFormProps = {
  copy: RegisterFormCopy;
  loginHref: string;
  verifiedHref: string;
};

export const RegisterForm = ({
  copy,
  loginHref,
  verifiedHref,
}: RegisterFormProps) => {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch(getAuthUrl("register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          gender,
          email,
          phoneNumber,
          password,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | ApiErrorResponse
        | undefined;

      if (!response.ok) {
        setError(getErrorMessage(payload ?? {}, copy.genericError));
        return;
      }

      setRegisteredEmail(email);
      setStep("verify");
    } catch {
      setError(copy.genericError);
    } finally {
      setIsPending(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();

    try {
      const response = await fetch(getAuthUrl("verify-email"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: registeredEmail, code }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | ApiErrorResponse
        | undefined;

      if (!response.ok) {
        setError(getErrorMessage(payload ?? {}, copy.verifyGenericError));
        return;
      }

      setSuccessMessage(copy.verifySuccess);
      router.push(verifiedHref);
    } catch {
      setError(copy.verifyGenericError);
    } finally {
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      const response = await fetch(getAuthUrl("resend-verification"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: registeredEmail }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as
          | ApiErrorResponse
          | undefined;
        setError(getErrorMessage(payload ?? {}, copy.verifyGenericError));
        return;
      }

      setSuccessMessage(copy.resendSuccess);
    } catch {
      setError(copy.verifyGenericError);
    } finally {
      setIsResending(false);
    }
  };

  if (step === "verify") {
    return (
      <form className="flex flex-col gap-6" onSubmit={handleVerify}>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{copy.verifyHeading}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.verifyDescription.replace("{email}", registeredEmail)}
          </p>
        </div>

        <FieldGroup className="gap-4">
          <div className="flex flex-col gap-1.5">
            <FloatingField
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              label={copy.codeLabel}
              required
              minLength={6}
              maxLength={6}
              aria-invalid={Boolean(error)}
            />
            <FieldError>{error}</FieldError>
          </div>
        </FieldGroup>

        <div className="flex flex-col items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="h-12 w-full rounded-full text-sm font-semibold"
          >
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                {copy.verifyPendingLabel}
              </>
            ) : (
              copy.verifySubmitLabel
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={isResending}
            className="h-12 w-full rounded-full text-sm font-semibold"
          >
            {isResending ? (
              <>
                <Spinner data-icon="inline-start" />
                {copy.resendPendingLabel}
              </>
            ) : (
              copy.resendLabel
            )}
          </Button>
        </div>

        <FieldDescription aria-live="polite" className="text-center">
          {successMessage}
        </FieldDescription>
      </form>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleRegister}>
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FloatingField
            id="firstName"
            name="firstName"
            type="text"
            label={copy.firstNameLabel}
            autoComplete="given-name"
            required
            maxLength={80}
            aria-invalid={Boolean(error)}
          />

          <FloatingField
            id="lastName"
            name="lastName"
            type="text"
            label={copy.lastNameLabel}
            autoComplete="family-name"
            required
            maxLength={80}
            aria-invalid={Boolean(error)}
          />
        </div>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="gender" className="sr-only">
            {copy.genderLabel}
          </FieldLabel>
          <Select
            value={gender}
            onValueChange={setGender}
            name="gender"
            required
          >
            <SelectTrigger
              id="gender"
              aria-invalid={Boolean(error)}
              className={`w-full justify-between h-14 ${inputClassName}`}
            >
              <SelectValue placeholder={copy.genderPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {copy.genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <FloatingField
          id="email"
          name="email"
          type="email"
          label={copy.emailLabel}
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={Boolean(error)}
        />

        <div className="flex flex-col gap-1.5">
          <FloatingField
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            label={copy.phoneLabel}
            autoComplete="tel"
            required
            minLength={7}
            maxLength={20}
            aria-invalid={Boolean(error)}
          />
          <FieldDescription>{copy.contactHint}</FieldDescription>
        </div>

        <div className="flex flex-col gap-1.5">
          <FloatingField
            id="password"
            name="password"
            type="password"
            label={copy.passwordLabel}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            aria-invalid={Boolean(error)}
          />
          <FieldError>{error}</FieldError>
        </div>
      </FieldGroup>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {copy.legal}
      </p>

      <div className="flex flex-col items-center gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-12 w-full rounded-full text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" />
              {copy.pendingLabel}
            </>
          ) : (
            copy.submitLabel
          )}
        </Button>

        <Button
          href={loginHref}
          variant="outline"
          className="h-12 w-full rounded-full text-sm font-semibold"
        >
          {copy.haveAccount}
        </Button>
      </div>

      <FieldDescription aria-live="polite" className="text-center">
        {successMessage}
      </FieldDescription>
    </form>
  );
};
