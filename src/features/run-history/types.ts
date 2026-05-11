export type RunHistoryStatusFilter = "all" | "queued" | "processing" | "completed" | "failed";

export type RunHistoryItem = {
  id: string;
  researchTopic: string;
  status: Exclude<RunHistoryStatusFilter, "all">;
  lastErrorMessage: string | null;
  answerTitle: string | null;
  sourceCount: number;
  claimCount: number;
  alertCount: number;
  shareLinkCount: number;
  createdAt: string;
  updatedAt: string;
};
