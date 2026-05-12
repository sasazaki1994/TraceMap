import type {
  SourceFreshnessLevel,
  SourceQualityLevel,
  SourceReachabilityLevel,
} from "@/types/source-quality";

export function sourceQualityGradeLabel(value: SourceQualityLevel): string {
  return { strong: "Strong", usable: "Usable", limited: "Limited", weak: "Weak", unknown: "Unknown" }[value];
}

export function sourceFreshnessLabel(value: SourceFreshnessLevel): string {
  return { fresh: "Fresh", stale: "Stale", unknown: "Unknown" }[value];
}

export function sourceReachabilityLabel(value: SourceReachabilityLevel): string {
  return { reachable: "Reachable", unreachable: "Unreachable", invalid: "Invalid", unchecked: "Unchecked", unknown: "Unknown" }[value];
}
