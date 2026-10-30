import { MessageCircleIcon, PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizePhoneForWhatsApp } from "./contact-utils";
import type { FamilyContact } from "./types-and-schemas";

export interface ContactActionsProps {
  contact: FamilyContact;
  className?: string;
}

export function ContactActions({ contact, className }: ContactActionsProps) {
  if (!contact.phoneNumber) return null;
  const whatsAppNumber = normalizePhoneForWhatsApp(contact.phoneNumber);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        href={`tel:${contact.phoneNumber}`}
        size="sm"
        variant="outline"
        className="md:hidden"
      >
        <PhoneIcon aria-hidden="true" data-icon="inline-start" />
        Call
      </Button>
      {whatsAppNumber ? (
        <Button
          href={`https://wa.me/${whatsAppNumber}`}
          size="sm"
          variant="outline"
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircleIcon aria-hidden="true" data-icon="inline-start" />
          WhatsApp
        </Button>
      ) : null}
    </div>
  );
}
