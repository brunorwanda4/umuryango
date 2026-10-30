"use client";

import type { LucideIcon } from "lucide-react";
import { LineChartIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type SidebarIconStyle, useSidebarIconStyle } from "./sidebar-icon";

const themeOptions: {
  value: "light" | "dark" | "system";
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "light",
    title: "Light",
    description: "Clean, bright appearance with high contrast.",
    icon: SunIcon,
  },
  {
    value: "dark",
    title: "Dark",
    description: "Dark surfaces to reduce glare and eye strain.",
    icon: MoonIcon,
  },
  {
    value: "system",
    title: "System",
    description: "Automatically matches your system preferences.",
    icon: MonitorIcon,
  },
];

const iconOptions: {
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
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { style, setStyle } = useSidebarIconStyle();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? (theme ?? "system") : "system";

  return (
    <Card id="appearance">
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>
          Customize theme preferences and how navigation icons appear.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm">Theme</h3>
            <p className="text-muted-foreground text-sm">
              Select your preferred color scheme or sync with your system.
            </p>
          </div>
          <RadioGroup
            value={activeTheme}
            onValueChange={setTheme}
            className="grid gap-3 sm:grid-cols-3"
            aria-label="Theme preference"
          >
            {themeOptions.map((option) => (
              <label
                key={option.value}
                htmlFor={`theme-mode-${option.value}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/60",
                  activeTheme === option.value && "border-primary bg-muted",
                )}
              >
                <RadioGroupItem
                  id={`theme-mode-${option.value}`}
                  value={option.value}
                  className="mt-1"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="flex items-center gap-2 font-medium text-sm">
                    <option.icon
                      aria-hidden="true"
                      className="size-5 shrink-0"
                    />
                    {option.title}
                  </span>
                  <span className="text-muted-foreground text-sm leading-5">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm">Navigation icons</h3>
            <p className="text-muted-foreground text-sm">
              Choose how navigation icons appear across the sidebar.
            </p>
          </div>
          <RadioGroup
            value={style}
            onValueChange={(value) => setStyle(value as SidebarIconStyle)}
            className="grid gap-3 sm:grid-cols-2"
            aria-label="Sidebar icon style"
          >
            {iconOptions.map((option) => (
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
        </div>
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
