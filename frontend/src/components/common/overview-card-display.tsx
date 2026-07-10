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
  description?: string;
  value?: ReactNode;
  icon?: ReactNode;
  className?: string;
  link?: string;
}

interface OverviewCardDisplayProps {
  cards: OverviewCard[];
  className?: string;
}

const OverviewCardDisplay = ({
  cards,
  className,
}: OverviewCardDisplayProps) => {
  return (
    <div
      className={cn(
        "grid gap-3 grid-cols-1 lg:grid-cols-4 2xl:grid-cols-6",
        className,
      )}
    >
      {cards.map((data) => {
        const card = (
          <Card>
            <CardHeader className="flex sm:flex-row flex-row-reverse items-center justify-end sm:justify-between gap-3 ">
              <div className="min-w-0 max-sm:flex-row max-sm:flex max-sm:items-center max-sm:gap-4">
                <CardDescription className=" max-sm:font-semibold max-sm:text-lg max-sm:flex">
                  <span>{data.description}</span>{" "}
                  <span className=" block sm:hidden">:</span>
                </CardDescription>
                <CardTitle className="mt-1 truncate text-xl sm:text-2xl font-bold ">
                  {data.value}
                </CardTitle>
              </div>
              {data.icon}
            </CardHeader>
          </Card>
        );

        if (data.link) {
          return (
            <Link key={data.description} href={data.link}>
              {card}
            </Link>
          );
        }
        return <div key={data.description}>{card}</div>;
      })}
    </div>
  );
};

export default OverviewCardDisplay;
