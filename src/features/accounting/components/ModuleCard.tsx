import type { AccountingModule } from "../types";
import { MODULE_LABELS } from "../permissions";
import "./ModuleCard.css";

interface ModuleCardProps {
  module: AccountingModule;
  description: string;
  onOpen: () => void;
  allowed: boolean;
  subtitle?: string;
}

export function ModuleCard({
  module,
  description,
  onOpen,
  allowed,
  subtitle,
}: ModuleCardProps) {
  return (
    <button
      className={`module-card ${allowed ? "allowed" : "locked"}`}
      onClick={onOpen}
      disabled={!allowed}
    >
      <span className="module-card-kicker">{MODULE_LABELS[module]}</span>
      <h3>{MODULE_LABELS[module]}</h3>
      <p>{description}</p>
      {subtitle ? <small>{subtitle}</small> : null}
      <span className="module-card-cta">
        {allowed ? "Open module" : "Locked by role"}
      </span>
    </button>
  );
}
