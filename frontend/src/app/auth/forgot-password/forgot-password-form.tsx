"use client";

import { CheckCircle2Icon, MailIcon } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { FloatingField } from "@/components/ui/floating-field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ForgotPasswordFormCopy = {
  emailLabel: string;
  submitLabel: string;
  pendingLabel: string;
  requestSuccess: string;
  codeLabel: string;
  verifySubmitLabel: string;
  verifyPendingLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  resetSubmitLabel: string;
  resetPendingLabel: string;
  resetSuccess: string;
  resendLabel: string;
  resendPendingLabel: string;
  resendSuccess: string;
  passwordMismatch: string;
  genericError: string;
};

type ApiErrorResponse = {
  message?: string | string[];
  error?: { message?: string };
};

type Step = "request" | "verify" | "reset" | "done";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getAuthUrl = (path: string) => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:4915";
  const baseUrl = configuredUrl.replace(/\/$/, "");
  if (baseUrl.endsWith("/api/v1")) {
    return `${baseUrl}/auth/${path}`;
  }
  return `${baseUrl}/api/v1/auth/${path}`;
};

const getErrorMessage = (payload: ApiErrorResponse, fallback: string) => {
  if (payload.error?.message) return payload.error.message;
  if (Array.isArray(payload.message)) return payload.message[0] ?? fallback;
  return payload.message ?? fallback;
};

// ─── Component ───────────────────────────────────────────────────────────────

type ForgotPasswordFormProps = {
  copy: ForgotPasswordFormCopy;
  loginHref: string;
};

export const ForgotPasswordForm = ({
  copy,
  loginHref,
}: ForgotPasswordFormProps) => {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isResendPending, setIsResendPending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // ── Step 1: Request reset code ─────────────────────────────────────────────

  const handleRequestSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get("email") ?? "").toLowerCase();

    try {
      const response = await fetch(getAuthUrl("forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedEmail }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;
        setError(getErrorMessage(payload, copy.genericError));
        return;
      }

      setEmail(submittedEmail);
      setOtpValue("");
      setStep("verify");
    } catch {
      setError(copy.genericError);
    } finally {
      setIsPending(false);
    }
  };

  // ── Step 2: Verify code ────────────────────────────────────────────────────

  const handleVerifySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("otp") ?? otpValue);

    try {
      // We validate the code as part of the reset step; here we just advance.
      // A lightweight validate endpoint would be ideal but we keep it simple
      // by moving directly to the reset step once the user has 6 digits.
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        setError("Please enter the full 6-digit code.");
        return;
      }
      setStep("reset");
    } catch {
      setError(copy.genericError);
    } finally {
      setIsPending(false);
    }
  };

  // ── Step 2: Resend code ────────────────────────────────────────────────────

  const handleResend = async () => {
    setIsResendPending(true);
    setError(null);
    setInfo(null);

    try {
      await fetch(getAuthUrl("forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setInfo(copy.resendSuccess);
    } catch {
      setError(copy.genericError);
    } finally {
      setIsResendPending(false);
    }
  };

  // ── Step 3: Reset password ─────────────────────────────────────────────────

  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError(copy.passwordMismatch);
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch(getAuthUrl("reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpValue, newPassword }),
      });

      const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;

      if (!response.ok) {
        setError(getErrorMessage(payload, copy.genericError));
        return;
      }

      setStep("done");
    } catch {
      setError(copy.genericError);
    } finally {
      setIsPending(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  // Step 4: Done
  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2Icon className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold">{copy.resetSuccess}</p>
        </div>
        <Button
          href={loginHref}
          className="h-11 w-full max-w-xs rounded-full text-sm font-semibold"
        >
          Go to login
        </Button>
      </div>
    );
  }

  // Step 1: Request
  if (step === "request") {
    return (
      <form className="flex flex-col gap-6" onSubmit={handleRequestSubmit}>
        <FieldGroup className="gap-4">
          <FloatingField
            id="email"
            name="email"
            type="email"
            label={copy.emailLabel}
            autoComplete="email"
            required
            maxLength={254}
            aria-invalid={Boolean(error)}
            ref={emailRef}
          />
          <FieldError>{error}</FieldError>
        </FieldGroup>

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-11 w-full rounded-full text-sm font-semibold"
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

        <FieldDescription aria-live="polite" className="text-center">
          {info}
        </FieldDescription>
      </form>
    );
  }

  // Step 2: Verify OTP
  if (step === "verify") {
    return (
      <form className="flex flex-col gap-6" onSubmit={handleVerifySubmit}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <MailIcon className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              We sent a reset code to{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm font-medium">{copy.codeLabel}</p>
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
              name="otp"
              id="otp"
              aria-label={copy.codeLabel}
              aria-invalid={Boolean(error)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <FieldError>{error}</FieldError>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={isPending || otpValue.length !== 6}
            className="h-11 w-full rounded-full text-sm font-semibold"
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
            size="lg"
            disabled={isResendPending}
            onClick={handleResend}
            className="h-11 w-full rounded-full text-sm font-semibold"
          >
            {isResendPending ? (
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
          {info}
        </FieldDescription>
      </form>
    );
  }

  // Step 3: Reset password
  return (
    <form className="flex flex-col gap-6" onSubmit={handleResetSubmit}>
      <FieldGroup className="gap-4">
        <FloatingField
          id="newPassword"
          name="newPassword"
          type="password"
          label={copy.newPasswordLabel}
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          aria-invalid={Boolean(error)}
        />
        <div className="flex flex-col gap-1.5">
          <FloatingField
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label={copy.confirmPasswordLabel}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            aria-invalid={Boolean(error)}
          />
          <FieldError>{error}</FieldError>
        </div>
      </FieldGroup>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="h-11 w-full rounded-full text-sm font-semibold"
      >
        {isPending ? (
          <>
            <Spinner data-icon="inline-start" />
            {copy.resetPendingLabel}
          </>
        ) : (
          copy.resetSubmitLabel
        )}
      </Button>

      <FieldDescription aria-live="polite" className="text-center">
        {info}
      </FieldDescription>
    </form>
  );
};
