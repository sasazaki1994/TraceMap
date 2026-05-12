import type {
  SourceFreshnessLevel,
  SourceQualityLevel,
  SourceReachabilityLevel,
} from "@/types/source-quality";

export function sourceQualityGradeLabel(value: SourceQualityLevel): string {
  return { strong: "Strong", usable: "Usable", limited: "Limited", weak: "Weak" }[value];
}

export function sourceFreshnessLabel(value: SourceFreshnessLevel): string {
  return { fresh: "Fresh", possibly_stale: "Possibly stale", stale: "Stale", unknown: "Unknown" }[value];
}

export function sourceReachabilityLabel(value: SourceReachabilityLevel): string {
  return { reachable: "Reachable", unreachable: "Unreachable", invalid: "Invalid", unchecked: "Unchecked" }[value];
}
