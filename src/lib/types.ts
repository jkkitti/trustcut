export type ScorePoint = {
  label: string;
  score: number;
};

export type HairdresserComment = {
  id: string;
  authorName: string;
  salonName: string;
  body: string;
  rating: number;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
};

export type HairStylePost = {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  postedBy: string;
  createdAt: string;
};

export type Hairdresser = {
  id: string;
  trustCutId: string;
  photos: string[];
  idPhoto: string;
  firstName: string;
  lastName: string;
  nickName: string;
  hometownAddress: string;
  currentAddress: string;
  phone: string;
  email: string;
  lineId: string;
  instagram: string;
  socialMedia: string[];
  yearsExperience: number;
  specialties: string[];
  workHistory: string[];
  certificates: string[];
  competency: ScorePoint[];
  aptitude: ScorePoint[];
  behaviorScore: number;
  reliabilityScore: number;
  pdpaAcceptedAt: string;
  lastVerifiedAt: string;
  comments: HairdresserComment[];
  styles: HairStylePost[];
};

export type Member = {
  id: string;
  name: string;
  salonName: string;
  role: "owner" | "manager" | "admin";
  email: string;
  status: "active" | "pending" | "suspended";
  lastGpsCheck: string;
};

export type UsageStat = {
  label: string;
  value: string;
  trend: string;
};

export type AdminSeed = {
  members: Member[];
  usageStats: UsageStat[];
};

export type AuthIdentity = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  provider: string | null;
};
