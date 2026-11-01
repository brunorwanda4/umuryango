"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { FloatingField } from "@/components/ui/floating-field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import apiRequest, { getApiAuthUrl } from "@/service/api";

const defaultDevelopmentVerificationCode = process.env.NODE_ENV === "development" ? "678901" : "";

export type RegisterFormCopy = {
  fullNameLabel: string;
  genderLabel: string;
  emailLabel: string;
  phoneLabel: string;
  contactHint: string;
  passwordLabel: string;
  legal: string;
  submitLabel: string;
  pendingLabel: string;
  haveAccount: string;
  continueWithGoogle: string;
  success: string;
  genericError: string;
  networkError: string;
  verifyHeading: string;
  verifyDescription: string;
  spamHint: string;
  codeLabel: string;
  verifySubmitLabel: string;
  verifyPendingLabel: string;
  verifySuccess: string;
  verifyGenericError: string;
  resendLabel: string;
  resendPendingLabel: string;
  resendSuccess: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  genderOptions: Array<{
    value: string;
    label: string;
  }>;
};

type RegisterFormProps = {
  copy: RegisterFormCopy;
  loginHref: string;
  verifiedHref?: string;
};

export const RegisterForm = ({ copy, loginHref, verifiedHref = "/me" }: RegisterFormProps) => {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [gender, setGender] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const passwordToggleLabel = isPasswordVisible ? copy.hidePasswordLabel : copy.showPasswordLabel;
  const PasswordIcon = isPasswordVisible ? EyeOffIcon : EyeIcon;

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const [firstName, ...lastNameParts] = fullName.split(/\s+/);
    const lastName = lastNameParts.join(" ");
    const email = String(formData.get("email") ?? "").trim();
    const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const response = await apiRequest("post", "/auth/register", {
      firstName,
      lastName,
      gender,
      email,
      phoneNumber,
      password,
    });

    if (!response.ok) {
      setError(
        response.statusCode === 0 ? copy.networkError : (response.message ?? copy.genericError),
      );
      setIsPending(false);
      return;
    }

    setRegisteredEmail(email);
    setOtpValue(defaultDevelopmentVerificationCode);
    setStep("verify");
    setIsPending(false);
  };

  const handleVerify = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const code = otpValue.trim();
    if (code.length !== 6) return;
    setError(null);
    setSuccessMessage(null);
    setIsPending(true);

    const response = await apiRequest("post", "/auth/verify-email", {
      email: registeredEmail,
      code,
    });

    if (!response.ok) {
      setError(
        response.statusCode === 0
          ? copy.networkError
          : (response.message ?? copy.verifyGenericError),
      );
      setIsPending(false);
      return;
    }

    setSuccessMessage(copy.verifySuccess);
    router.push(verifiedHref);
    router.refresh();
    setIsPending(false);
  };

  const handleResend = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsResending(true);

    const response = await apiRequest("post", "/auth/resend-verification", {
      email: registeredEmail,
    });

    if (!response.ok) {
      setError(
        response.statusCode === 0
          ? copy.networkError
          : (response.message ?? copy.verifyGenericError),
      );
      setIsResending(false);
      return;
    }

    setSuccessMessage(copy.resendSuccess);
    setIsResending(false);
  };

  if (step === "verify") {
    return (
      <form className="flex flex-col gap-6" onSubmit={handleVerify}>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{copy.verifyHeading}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.verifyDescription.split("{email}").flatMap((part, i, arr) =>
              i < arr.length - 1
                ? [
                    part,
                    <span
                      key="registered-email"
                      className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold break-all text-foreground"
                    >
                      {registeredEmail}
                    </span>,
                  ]
                : [part],
            )}
          </p>
        </div>

        <FieldGroup className="gap-4">
          <div className="flex flex-col items-center gap-3">
            <Field className="flex flex-col items-center gap-2">
              <FieldLabel className="sr-only">{copy.codeLabel}</FieldLabel>
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={(val) => {
                  setOtpValue(val);
                  if (val.length === 6) {
                    void handleVerify();
                  }
                }}
                autoFocus
                disabled={isPending}
                aria-invalid={Boolean(error)}
                aria-label={copy.codeLabel}
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
              <p className="text-xs text-muted-foreground text-center">{copy.spamHint}</p>
            </Field>
          </div>
        </FieldGroup>

        <div className="flex flex-col items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={isPending || otpValue.length !== 6}
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
        <FloatingField
          id="fullName"
          name="fullName"
          type="text"
          label={copy.fullNameLabel}
          autoComplete="name"
          required
          minLength={3}
          maxLength={161}
          pattern=".*\S+\s+\S+.*"
          className="input"
          aria-invalid={Boolean(error)}
        />

        <FieldSet data-invalid={Boolean(error)} className="gap-3">
          <FieldLegend variant="label">{copy.genderLabel}</FieldLegend>
          <RadioGroup
            value={gender}
            onValueChange={setGender}
            name="gender"
            required
            aria-invalid={Boolean(error)}
            className="grid-cols-3"
          >
            {copy.genderOptions.map((option) => {
              const id = `gender-${option.value}`;

              return (
                <FieldLabel htmlFor={id} key={option.value}>
                  <Field orientation="horizontal">
                    <RadioGroupItem
                      id={id}
                      value={option.value}
                      className="radio"
                      aria-invalid={Boolean(error)}
                    />
                    {option.label}
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>
        </FieldSet>

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
        </div>

        <div className="flex flex-col gap-1.5">
          <FloatingField
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            label={copy.passwordLabel}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            aria-invalid={Boolean(error)}
            trailingSlot={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={passwordToggleLabel}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <PasswordIcon aria-hidden="true" />
              </Button>
            }
          />
          <FieldError>{error}</FieldError>
        </div>
      </FieldGroup>

      <p className="text-xs leading-relaxed text-muted-foreground">{copy.legal}</p>

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
          asChild
          variant="outline"
          className="h-12 w-full rounded-full text-sm font-semibold"
        >
          <a href={getApiAuthUrl("google")}>
            <GoogleIcon data-icon="inline-start" />
            {copy.continueWithGoogle}
          </a>
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
