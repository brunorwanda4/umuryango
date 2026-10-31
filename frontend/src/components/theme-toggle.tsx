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
import { defaultLocale, getMessages } from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme, theme } = useTheme();
  const t = createTranslator(getMessages(defaultLocale), "Shared.theme");

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
        aria-label={t((m) => m.Shared.theme.label)}
      >
        <SunIcon aria-hidden="true" />
        <span className="sr-only">{t((m) => m.Shared.theme.label)}</span>
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
              aria-label={t((m) => m.Shared.theme.label)}
            >
              <ThemeIcon aria-hidden="true" />
              <span className="sr-only">{t((m) => m.Shared.theme.label)}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">
          {t((m) => m.Shared.theme.label)}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {t((m) => m.Shared.theme.label)}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={activeTheme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <SunIcon aria-hidden="true" />
              {t((m) => m.Shared.theme.light)}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <MoonIcon aria-hidden="true" />
              {t((m) => m.Shared.theme.dark)}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <MonitorIcon aria-hidden="true" />
              {t((m) => m.Shared.theme.system)}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
