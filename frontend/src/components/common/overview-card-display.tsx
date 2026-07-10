import Link from "next/link";
import type { ReactNode } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OverviewCard {
  description?: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
  link?: string;
}

interface OverviewCardDisplayProps {
  cards: OverviewCard[];
  cardDescriptionClassName?: string;
  cardFooterClassName?: string;
  cardHeaderClassName?: string;
  cardTitleClassName?: string;
  className?: string;
  iconPosition?: "end" | "start";
}

const OverviewCardDisplay = ({
  cards,
  cardDescriptionClassName,
  cardFooterClassName,
  cardHeaderClassName,
  cardTitleClassName,
  className,
  iconPosition = "end",
}: OverviewCardDisplayProps) => {
  return (
    <div
      className={cn(
        "grid gap-3 grid-cols-1 lg:grid-cols-4 2xl:grid-cols-6",
        className,
      )}
    >
      {cards.map((data, index) => {
        const key =
          typeof data.description === "string" ? data.description : index;
        const card = (
          <Card className={data.className}>
            <CardHeader
              className={cn(
                "flex sm:flex-row flex-row-reverse items-center justify-end sm:justify-between gap-3",
                cardHeaderClassName,
              )}
            >
              {iconPosition === "start" && data.icon}
              <div className="min-w-0 max-sm:flex-row max-sm:flex max-sm:items-center max-sm:gap-4">
                <CardDescription
                  className={cn(
                    "max-sm:font-semibold max-sm:text-lg max-sm:flex",
                    cardDescriptionClassName,
                  )}
                >
                  <span>{data.description}</span>{" "}
                  <span className=" block sm:hidden">:</span>
                </CardDescription>
                <CardTitle
                  className={cn(
                    "mt-1 truncate text-xl sm:text-2xl font-bold",
                    cardTitleClassName,
                  )}
                >
                  {data.value}
                </CardTitle>
                {data.footer && (
                  <div
                    className={cn(
                      "mt-3 flex items-center gap-2 font-medium text-muted-foreground text-sm",
                      cardFooterClassName,
                    )}
                  >
                    {data.footer}
                  </div>
                )}
              </div>
              {iconPosition === "end" && data.icon}
            </CardHeader>
          </Card>
        );

        if (data.link) {
          return (
            <Link key={key} href={data.link}>
              {card}
            </Link>
          );
        }
        return <div key={key}>{card}</div>;
      })}
    </div>
  );
};

export default OverviewCardDisplay;
