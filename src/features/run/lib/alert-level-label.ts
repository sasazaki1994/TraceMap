import type { AlertLevel } from "@/types/run-evidence";

/** mock/UI表示向けの`AlertLevel`人間可読ラベル。 */
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
