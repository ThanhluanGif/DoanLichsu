export const roles = ["ADMIN", "EDITOR", "REVIEWER"] as const;
export type Role = (typeof roles)[number];

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

export type SessionPayload = {
  userId: string;
  sessionVersion: number;
};

