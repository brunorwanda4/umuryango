"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
import apiRequest, { type ApiRequestOptions } from "@/service/api";

const DEFAULT_MESSAGE_TIMEOUT = 4000;

interface UseZodFormSubmitOptions<TForm extends FieldValues, TResult> {
  schema: Parameters<typeof zodResolver>[0];
  formOptions: UseFormProps<TForm>;
  request: {
    method: "post" | "put" | "patch" | "delete";
    url: string | ((values: TForm) => string);
    apiRequest?: ApiRequestOptions | ((values: TForm) => ApiRequestOptions);
    omitBody?: boolean;
  };
  transform?: (values: TForm) => unknown;
  onSuccessMessage: string;
  onSuccess?: (
    data: TResult | undefined,
    values: TForm,
  ) => void | Promise<void>;
  onError?: (message: string, values: TForm) => void | Promise<void>;
  onFinally?: () => void;
  messageTimeout?: number;
  toastOnError?: boolean;
  toastOnSuccess?: boolean;
}

export function useZodFormSubmit<TForm extends FieldValues, TResult = unknown>(
  options: UseZodFormSubmitOptions<TForm, TResult>,
) {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isPending, setIsPending] = useState(false);
  const messageTimeout = options.messageTimeout ?? DEFAULT_MESSAGE_TIMEOUT;

  const form = useForm<TForm>({
    resolver: zodResolver(options.schema) as Resolver<TForm>,
    mode: "onChange",
    reValidateMode: "onChange",
    ...options.formOptions,
  });

  const clearMessages = () => {
    setError(undefined);
    setSuccess(undefined);
  };

  const clearErrorLater = () => {
    window.setTimeout(() => setError(undefined), messageTimeout);
  };

  const clearSuccessLater = () => {
    window.setTimeout(() => setSuccess(undefined), messageTimeout);
  };

  const handleError = async (message: string, values: TForm) => {
    setError(message);
    await options.onError?.(message, values);

    if (options.toastOnError) {
      toast.error("Something went wrong", {
        description: message,
      });
    }

    clearErrorLater();
  };

  const onSubmit = async (values: TForm) => {
    clearMessages();
    setIsPending(true);

    try {
      const url =
        typeof options.request.url === "function"
          ? options.request.url(values)
          : options.request.url;
      const payload = options.request.omitBody
        ? undefined
        : options.transform
          ? options.transform(values)
          : values;
      const apiRequestOptions =
        typeof options.request.apiRequest === "function"
          ? options.request.apiRequest(values)
          : options.request.apiRequest;
      const response = await apiRequest<unknown, TResult>(
        options.request.method,
        url,
        payload,
        apiRequestOptions,
      );

      if (!response.ok) {
        await handleError(response.message ?? "Something went wrong", values);
        return;
      }

      setSuccess(options.onSuccessMessage);

      if (options.toastOnSuccess) {
        toast.success(options.onSuccessMessage);
      }

      await options.onSuccess?.(response.data, values);
      clearSuccessLater();
    } catch {
      await handleError("Request failed", values);
    } finally {
      setIsPending(false);
      options.onFinally?.();
    }
  };

  return {
    form: form as UseFormReturn<TForm>,
    onSubmit,
    error,
    success,
    isPending,
    resetMessages: clearMessages,
  };
}
