export type AuditorRole = 
  | 'Lead Security Architect'
  | 'DevSecOps Engineer'
  | 'Application Security Auditor'
  | 'Software Engineer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: AuditorRole;
  avatarUrl: string;
  joinedAt: string;
  totalAuditsRun: number;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, name?: string, role?: AuditorRole) => void;
  logout: () => void;
  incrementAuditCount: () => void;
}
