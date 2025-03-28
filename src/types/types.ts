
export type RiskLevel = 'safe' | 'warning' | 'danger';

export interface Dosage {
  id: string;
  timestamp: number;
  amount: number;
  note?: string;
}

export interface Session {
  id: string;
  startTimestamp: number;
  firstIntakeTimestamp?: number;
  lastIntakeTimestamp?: number;
  durationHours?: number;
  totalMl?: number;
  mlPerHour?: number;
  mlPerIntake?: number;
  mlPer24Hours?: number;
  dosageCount?: number;
  dosages: Dosage[];
}

export interface AppSettings {
  safeInterval: number; // in minutes
  warningInterval: number; // in minutes
  defaultDosage: number; // in ml
  soundEnabled: boolean;
  maxDailyDosage: number; // in ml
}

export interface UserDosageData {
  dosages: Dosage[];
  activeSession: boolean;
  timeRemaining: number;
  riskLevel: RiskLevel;
  totalConsumed: number;
  lastDosage: Dosage | null;
  safeTimeReached: boolean;
  sessions: Session[];
  currentSession: Session | null;
}

export interface DosageContextType {
  dosages: Dosage[];
  settings: AppSettings;
  addDosage: (amount: number, note?: string, minutesAgo?: number) => void;
  resetSession: () => void;
  startNewSession: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  activeSession: boolean;
  lastDosage: Dosage | null;
  timeRemaining: number; // in milliseconds
  riskLevel: RiskLevel;
  totalConsumed: number; // in ml
  sessions: Session[];
  currentSession: Session | null;
}
