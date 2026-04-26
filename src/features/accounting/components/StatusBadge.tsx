import type { RecordState } from "../types";
import { RECORD_STATE_LABELS } from "../permissions";
import { getStatusTone } from "../utils";
import "./StatusBadge.css";

interface StatusBadgeProps {
  state: RecordState;
}

export function StatusBadge({ state }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${getStatusTone(state)}`}>
      {RECORD_STATE_LABELS[state]}
    </span>
  );
}
