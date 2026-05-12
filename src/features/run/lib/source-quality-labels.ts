import type {
  SourceFreshness,
  SourceQualityLevel,
  SourceReachability,
} from "@/types/source-quality";

export function sourceQualityGradeLabel(value: SourceQualityLevel): string {
  return { strong: "Strong", usable: "Usable", limited: "Limited", weak: "Weak", unknown: "Unknown" }[value];
}

export function sourceFreshnessLabel(value: SourceFreshness): string {
  return { fresh: "Fresh", stale: "Stale", unknown: "Unknown" }[value];
}

export function sourceReachabilityLabel(value: SourceReachability): string {
  return { reachable: "Reachable", unreachable: "Unreachable", invalid: "Invalid", unchecked: "Unchecked", unknown: "Unknown" }[value];
}
