const URL_PATTERN = /https?:\/\/[^\s<>")\]}]+/gi;

export function extractUrls(input: string): string[] {
  const matches = input.match(URL_PATTERN) ?? [];
  return matches.map((value) => value.replace(/[.,!?;:]+$/g, ""));
}
