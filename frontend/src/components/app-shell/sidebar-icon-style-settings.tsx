"use client";

import { LineChartIcon } from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { type SidebarIconStyle, useSidebarIconStyle } from "./sidebar-icon";

const options: {
  value: SidebarIconStyle;
  title: string;
  description: string;
}[] = [
  {
    value: "line",
    title: "Line icons",
    description: "Clean, simple icons that match the app controls.",
  },
  {
    value: "image",
    title: "Image icons",
    description: "Use the custom image set from the icons folder.",
  },
];

export function SidebarIconStyleSettings() {
  const { style, setStyle } = useSidebarIconStyle();

  return (
    <Card id="appearance">
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Choose how navigation icons appear.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={style}
          onValueChange={(value) => setStyle(value as SidebarIconStyle)}
          className="grid gap-3 sm:grid-cols-2"
          aria-label="Sidebar icon style"
        >
          {options.map((option) => (
            <label
              key={option.value}
              htmlFor={`sidebar-icon-style-${option.value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/60",
                style === option.value && "border-primary bg-muted",
              )}
            >
              <RadioGroupItem
                id={`sidebar-icon-style-${option.value}`}
                value={option.value}
                className="mt-1"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex items-center gap-2 font-medium text-sm">
                  <IconPreview style={option.value} />
                  {option.title}
                </span>
                <span className="text-muted-foreground text-sm leading-5">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

function IconPreview({ style }: { style: SidebarIconStyle }) {
  if (style === "image") {
    return (
      <Image
        src="/images/icons/dashboard.png"
        alt=""
        width={20}
        height={20}
        aria-hidden="true"
        className="size-5 object-contain"
      />
    );
  }

  return <LineChartIcon aria-hidden="true" className="size-5" />;
}
