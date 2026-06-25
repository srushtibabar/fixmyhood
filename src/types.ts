export type IssueCategory = 'Pothole' | 'Streetlight' | 'Waste' | 'Water Leakage' | 'Other';
export type IssueStatus = 'ROUTED' | 'VERIFIED' | 'RESOLVED';

export interface TimelineEvent {
  id: string;
  status: IssueStatus | string;
  title: string;
  timestamp: string;
  description: string;
  user?: string;
}

export interface IssueReport {
  id: string;
  category: IssueCategory;
  description: string;
  status: IssueStatus;
  lat: number;
  lng: number;
  areaName: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  confirmCount: number;
  confirmedBy: string[]; // List of user IDs/emails who confirmed this
  timeline: TimelineEvent[];
  reportedBy: string;
  reportedByEmail: string;
  resolutionMediaUrl?: string;
  resolutionMediaType?: 'image' | 'video';
  resolvedAt?: string;
}

export interface Contributor {
  id: string;
  name: string;
  email: string;
  points: number;
  badges: string[];
  issuesReported: number;
  issuesConfirmed: number;
  issuesResolved: number;
}

export interface Hotspot {
  id: string;
  category: IssueCategory;
  lat: number;
  lng: number;
  areaName: string;
  issueCount: number;
  issueIds: string[];
  radius: number; // in meters
}

export interface DashboardStats {
  totalReported: number;
  totalResolved: number;
  totalInProgress: number;
  avgResolutionTimeHours: number;
  categoryDistribution: { category: IssueCategory; count: number }[];
  history30Days: { date: string; reported: number; resolved: number }[];
}
