import { UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ManagePeopleCard({ familySlug }: { familySlug: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Need to borrow from or lend to someone new?
        </CardTitle>
        <CardDescription>
          Add a trusted family member or friend before creating a loan with
          them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          href={`/family/${encodeURIComponent(familySlug)}/contacts`}
        >
          <UsersIcon aria-hidden="true" data-icon="inline-start" />
          Manage people
        </Button>
      </CardContent>
    </Card>
  );
}
