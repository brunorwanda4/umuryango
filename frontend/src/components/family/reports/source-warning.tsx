import { FileClockIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SourceWarning({
  contributionsMessage,
  moneyMessage,
  projectsMessage,
}: {
  contributionsMessage?: string;
  moneyMessage?: string;
  projectsMessage?: string;
}) {
  const messages = [
    moneyMessage ? `Money: ${moneyMessage}` : null,
    contributionsMessage ? `Contributions: ${contributionsMessage}` : null,
    projectsMessage ? `Projects: ${projectsMessage}` : null,
  ].filter(Boolean);

  return (
    <Alert>
      <FileClockIcon aria-hidden="true" />
      <AlertTitle>Some source modules are not ready</AlertTitle>
      <AlertDescription>
        Reports can only include modules returned by the backend.{" "}
        {messages.join(" ")}
      </AlertDescription>
    </Alert>
  );
}
