import type { ReactNode } from "react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: EmptyStateAction;
}

/**
 * Default placeholder icon shown when no custom icon is provided.
 * A simple document-style outline rendered at 24x24 inside the 48px circle.
 */
function DefaultIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6 text-on-surface-variant"
      aria-hidden="true"
    >
      <path
        d="M9 2H15L21 8V20C21 21.1 20.1 22 19 22H9C7.9 22 7 21.1 7 20V4C7 2.9 7.9 2 9 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 2V8H21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-12 text-center">
      {/* Icon area */}
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high">
        {icon ?? <DefaultIcon />}
      </div>

      <h3 className="mt-4 font-display text-lg text-on-surface">{title}</h3>

      <p className="mt-2 font-body text-sm text-on-surface-variant">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-primary px-5 py-2.5 font-display text-sm text-on-primary transition-opacity hover:opacity-80"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
