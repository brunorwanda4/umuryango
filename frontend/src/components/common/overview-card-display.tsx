"use client";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
} from "../ui/item";

interface OverviewCard {
  description?: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;
  iconImage?: string;
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
        const cardIcon = data.iconImage ? (
          <Image
            alt=""
            aria-hidden="true"
            height={40}
            src={data.iconImage}
            width={40}
          />
        ) : (
          (data.icon ?? null)
        );
        const mobileItem = (
          <Item variant="muted" className="border border-border sm:hidden">
            <ItemContent>
              <ItemHeader>
                <div className="flex min-w-0 flex-row items-center gap-4">
                  {cardIcon}
                  <div className="min-w-0">
                    <ItemDescription
                      className={cn("truncate", cardDescriptionClassName)}
                    >
                      {data.description}
                    </ItemDescription>
                    {data.footer && (
                      <span
                        className={cn(
                          "flex items-center gap-2 p-0 font-medium text-muted-foreground text-sm",
                          cardFooterClassName,
                        )}
                      >
                        {data.footer}
                      </span>
                    )}
                  </div>
                </div>
              </ItemHeader>
            </ItemContent>
            <ItemActions className="min-w-0">
              <span
                className={cn("truncate text-lg font-semibold", cardTitleClassName)}
              >
                {data.value}
              </span>
            </ItemActions>
          </Item>
        );
        const card = (
          <Card className={cn("hidden sm:block", data.className)}>
            <CardHeader
              className={cn(
                "flex flex-col items-center justify-end sm:justify-between md:gap-3 ",
                cardHeaderClassName,
              )}
            >
              <div className=" flex flex-row gap-4 items-center">
                {iconPosition === "start" && cardIcon}
                <CardDescription
                  className={cn(
                    "max-sm:font-semibold max-sm:text-lg max-sm:flex",
                    cardDescriptionClassName,
                  )}
                >
                  <span>{data.description}</span>{" "}
                  <span className=" block sm:hidden">:</span>
                </CardDescription>
              </div>
              <div className="min-w-0 max-sm:flex-row-reverse max-sm:flex max-sm:items-center max-sm:gap-4">
                <CardTitle
                  className={cn(
                    "sm:mt-1 truncate text-xl sm:text-2xl font-bold",
                    cardTitleClassName,
                  )}
                >
                  {data.value}
                </CardTitle>
                {data.footer && (
                  <div
                    className={cn(
                      "sm:mt-3 flex items-center gap-2 font-medium text-muted-foreground text-sm",
                      cardFooterClassName,
                    )}
                  >
                    {data.footer}
                  </div>
                )}
              </div>
              {iconPosition === "end" && cardIcon}
            </CardHeader>
          </Card>
        );

        if (data.link) {
          return (
            <Link key={key} href={data.link}>
              {mobileItem}
              {card}
            </Link>
          );
        }
        return (
          <div key={key}>
            {mobileItem}
            {card}
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCardDisplay;
