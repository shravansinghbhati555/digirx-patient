import type { ReactNode } from "react";
import { BackButton } from "./Button";

const widths = {
  // narrow: "tablet:max-w-[600px]",
  // medium: "tablet:max-w-[880px]",
  wide: "max-w-[1240px]",
};

/**
 * Page container. Phone: 20px gutter, room at the bottom for the nav or
 * action bar. Tablet+: centred column; detail screens stay narrow so the
 * phone layout reads well instead of stretching.
 */
export function Screen({
  children,
  width = "narrow",
  className = "",
}: {
  children: ReactNode;
  width?: keyof typeof widths;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-col px-5 pb-36 pt-[max(24px,env(safe-area-inset-top))] tablet:px-9 tablet:pb-12 tablet:pt-10 desktop:px-12 ${widths[width]} ${className}`}
    >
      {children}
    </div>
  );
}

/** Back · centred title · optional right action. */
export function PageHeader({
  title,
  back = "/",
  right,
}: {
  title?: ReactNode;
  back?: string | false;
  right?: ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      {back !== false ? (
        <BackButton fallback={back} />
      ) : (
        <span className="w-11" />
      )}
      {title ? (
        <span className="truncate text-[17px] font-semibold">{title}</span>
      ) : null}
      {right ?? <span className="w-11" aria-hidden="true" />}
    </div>
  );
}

/**
 * Bottom action bar. Fixed to the viewport on phones (with safe-area
 * padding); sticks to the bottom of the content column on larger screens.
 */
export function ActionBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 rounded-t-[28px] bg-surface px-5 pb-[calc(30px+env(safe-area-inset-bottom))] pt-3.5 shadow-bar tablet:sticky tablet:bottom-6 tablet:mt-8 tablet:rounded-[28px] tablet:pb-3.5 tablet:shadow-panel ${className}`}
    >
      {children}
    </div>
  );
}

/** "Label / value" stack used on the left of action bars. */
export function BarSummary({
  label,
  value,
  large,
}: {
  label: string;
  value: ReactNode;
  large?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="text-[12px] text-text-caption">{label}</span>
      <span
        className={`truncate font-semibold ${large ? "text-[20px]" : "text-[15px]"}`}
      >
        {value}
      </span>
    </span>
  );
}
