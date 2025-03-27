
export type RiskLevel = 'safe' | 'warning' | 'danger';

export interface Dosage {
  id: string;
  timestamp: number;
  amount: number;
  note?: string;
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
}

export interface DosageContextType {
  dosages: Dosage[];
  settings: AppSettings;
  addDosage: (amount: number, note?: string) => void;
  resetSession: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  activeSession: boolean;
  lastDosage: Dosage | null;
  timeRemaining: number; // in milliseconds
  riskLevel: RiskLevel;
  totalConsumed: number; // in ml
}
