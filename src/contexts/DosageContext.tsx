
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dosage, AppSettings, RiskLevel, DosageContextType } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

// Initial default settings
const defaultSettings: AppSettings = {
  safeInterval: 90, // 90 minutes
  warningInterval: 60, // 60 minutes
  defaultDosage: 2, // 2ml
  soundEnabled: true,
  maxDailyDosage: 10, // 10ml
};

// Create context
const DosageContext = createContext<DosageContextType | undefined>(undefined);

// Sound for notification
const notificationSound = new Audio('/notification.mp3');

export const DosageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dosages, setDosages] = useState<Dosage[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Try to load settings from localStorage
    const savedSettings = localStorage.getItem('ghbTrackerSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return defaultSettings;
  });
  const [activeSession, setActiveSession] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('safe');
  const [totalConsumed, setTotalConsumed] = useState(0);
  const [lastDosage, setLastDosage] = useState<Dosage | null>(null);
  const [safeTimeReached, setSafeTimeReached] = useState(false);

  // Load data from localStorage on initial mount
  useEffect(() => {
    const savedDosages = localStorage.getItem('ghbTrackerDosages');
    if (savedDosages) {
      try {
        setDosages(JSON.parse(savedDosages));
      } catch (e) {
        console.error('Failed to parse dosages', e);
      }
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ghbTrackerDosages', JSON.stringify(dosages));
  }, [dosages]);

  useEffect(() => {
    localStorage.setItem('ghbTrackerSettings', JSON.stringify(settings));
  }, [settings]);

  // Calculate time remaining and risk level
  useEffect(() => {
    if (dosages.length === 0) {
      setActiveSession(false);
      setTimeRemaining(0);
      setRiskLevel('safe');
      setLastDosage(null);
      return;
    }

    // Sort dosages by timestamp (newest first)
    const sortedDosages = [...dosages].sort((a, b) => b.timestamp - a.timestamp);
    const newest = sortedDosages[0];
    setLastDosage(newest);
    setActiveSession(true);

    // Calculate time elapsed since last dosage
    const updateTimeAndRisk = () => {
      const now = Date.now();
      const elapsed = now - newest.timestamp;
      const safeTime = settings.safeInterval * 60 * 1000; // convert to ms
      const warningTime = settings.warningInterval * 60 * 1000; // convert to ms
      
      // Calculate time remaining until safe window
      const remaining = Math.max(0, safeTime - elapsed);
      setTimeRemaining(remaining);

      // Calculate total consumed in last 24 hours
      const last24Hours = now - 24 * 60 * 60 * 1000;
      const recentDosages = dosages.filter(d => d.timestamp > last24Hours);
      const total = recentDosages.reduce((sum, d) => sum + d.amount, 0);
      setTotalConsumed(total);

      // Determine risk level
      let newRiskLevel: RiskLevel = 'safe';
      
      if (elapsed < warningTime) {
        newRiskLevel = 'danger';
      } else if (elapsed < safeTime) {
        newRiskLevel = 'warning';
      } else {
        newRiskLevel = 'safe';
        
        // Play sound when transitioning to safe (only once)
        if (!safeTimeReached && settings.soundEnabled) {
          setSafeTimeReached(true);
          notificationSound.play().catch(e => console.error('Failed to play sound', e));
        }
      }
      
      // Check if total consumption exceeds max daily dosage
      if (total > settings.maxDailyDosage) {
        newRiskLevel = 'danger';
      }
      
      setRiskLevel(newRiskLevel);
    };

    // Initial calculation
    updateTimeAndRisk();
    
    // Update time remaining every second
    const intervalId = setInterval(updateTimeAndRisk, 1000);
    
    return () => clearInterval(intervalId);
  }, [dosages, settings]);

  // Reset safe time reached flag when new dosage is added
  useEffect(() => {
    if (dosages.length > 0 && timeRemaining > 0) {
      setSafeTimeReached(false);
    }
  }, [dosages, timeRemaining]);

  // Add a new dosage
  const addDosage = (amount: number, note?: string) => {
    const newDosage: Dosage = {
      id: uuidv4(),
      timestamp: Date.now(),
      amount,
      note,
    };
    
    setDosages(prev => [newDosage, ...prev]);
  };

  // Reset current session
  const resetSession = () => {
    setDosages([]);
    setActiveSession(false);
    setTimeRemaining(0);
    setRiskLevel('safe');
    setTotalConsumed(0);
    setLastDosage(null);
  };

  // Update settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const contextValue: DosageContextType = {
    dosages,
    settings,
    addDosage,
    resetSession,
    updateSettings,
    activeSession,
    lastDosage,
    timeRemaining,
    riskLevel,
    totalConsumed,
  };

  return (
    <DosageContext.Provider value={contextValue}>
      {children}
    </DosageContext.Provider>
  );
};

export const useDosage = () => {
  const context = useContext(DosageContext);
  if (!context) {
    throw new Error('useDosage must be used within a DosageProvider');
  }
  return context;
};
