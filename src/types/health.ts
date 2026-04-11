export type DatabaseHealthStatus =
  | "connected"
  | "not_configured"
  | "unavailable";

export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
  database: {
    status: DatabaseHealthStatus;
    configured: boolean;
  };
};
