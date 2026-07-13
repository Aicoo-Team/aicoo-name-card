export type ContactField = "email" | "phone" | "linkedin" | "website";

export type CardContact = {
  email: string;
  phone: string;
  linkedin: string;
  website: string;
};

export type SharedAgent = {
  id: string;
  label: string;
  url: string;
  agentUrl: string;
  isActive?: boolean;
};

export type NameCard = {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  accent: string;
  contacts: CardContact;
  meetingUrl: string;
  agent?: SharedAgent;
  updatedAt: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  picture?: string;
};

export type StoredSession = {
  id: string;
  user: SessionUser;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  createdAt: string;
};
