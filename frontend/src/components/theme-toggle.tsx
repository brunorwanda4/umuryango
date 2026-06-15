"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const themeToggleCopy = {
  label: "Theme",
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? (theme ?? "system") : "system";
  const ThemeIcon = resolvedTheme === "dark" ? MoonIcon : SunIcon;

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-full"
        disabled
        aria-label={themeToggleCopy.label}
      >
        <SunIcon aria-hidden="true" />
        <span className="sr-only">{themeToggleCopy.label}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full bg-background/90 backdrop-blur"
              aria-label={themeToggleCopy.label}
            >
              <ThemeIcon aria-hidden="true" />
              <span className="sr-only">{themeToggleCopy.label}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">{themeToggleCopy.label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{themeToggleCopy.label}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={activeTheme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <SunIcon aria-hidden="true" />
              {themeToggleCopy.light}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <MoonIcon aria-hidden="true" />
              {themeToggleCopy.dark}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <MonitorIcon aria-hidden="true" />
              {themeToggleCopy.system}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
