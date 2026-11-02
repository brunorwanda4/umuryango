import Image from "next/image";
import { BackButton } from "@/components/common/back-button";
import { Badge } from "@/components/ui/badge";

interface PageTitleProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  iconImage?: string;
}

export function PageTitle({
  title,
  description,
  badge,
  actions,
  icon,
  iconImage,
}: PageTitleProps) {
  return (
    <section className=" flex flex-col lg:flex-row lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2.5 lg:items-center ">
          <BackButton className="-ml-2 md:hidden" />
          {icon && <div className="hidden flex-shrink-0 md:block">{icon}</div>}
          {iconImage && (
            <div className="hidden flex-shrink-0 md:block">
              <Image
                width={24}
                height={24}
                className=" object-contain"
                src={iconImage}
                alt={title}
              />
            </div>
          )}
          <h1 className="font-bold text-3xl sm:text-4xl font-bricolage">
            {title}
          </h1>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        {description && (
          <p className="max-w-3xl text-muted-foreground text-sm leading-6">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div>
      )}
    </section>
  );
}
