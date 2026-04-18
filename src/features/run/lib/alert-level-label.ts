import type { AlertLevel } from "@/types/run-evidence";

/** Human-readable label for mock / UI display of `AlertLevel`. */
export function alertLevelLabel(level: AlertLevel): string {
  switch (level) {
    case "info":
      return "Info";
    case "warning":
      return "Warning";
    case "error":
      return "Error";
  }
}
