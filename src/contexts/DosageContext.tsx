
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dosage, AppSettings, RiskLevel, DosageContextType, UserDosageData } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from './UserContext';
import { toast } from '@/hooks/use-toast';

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

// Sounds for notifications
const notificationSound = new Audio('/notification.mp3');
const unsafeTimeSound = new Audio('/unsafe-time.mp3');

export const DosageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
  const [userDosageData, setUserDosageData] = useState<Record<string, UserDosageData>>(() => {
    // Try to load user dosage data from localStorage
    const savedUserDosageData = localStorage.getItem('ghbTrackerUserDosageData');
    if (savedUserDosageData) {
      try {
        return JSON.parse(savedUserDosageData);
      } catch (e) {
        console.error('Failed to parse user dosage data', e);
      }
    }
    return {};
  });
  
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

  // Initialize current user's dosage data if it doesn't exist
  useEffect(() => {
    if (!userDosageData[currentUser.id]) {
      setUserDosageData(prev => ({
        ...prev,
        [currentUser.id]: {
          dosages: [],
          activeSession: false,
          timeRemaining: 0,
          riskLevel: 'safe',
          totalConsumed: 0,
          lastDosage: null,
          safeTimeReached: false
        }
      }));
    }
  }, [currentUser.id, userDosageData]);

  // Get current user's dosage data
  const currentUserData = userDosageData[currentUser.id] || {
    dosages: [],
    activeSession: false,
    timeRemaining: 0,
    riskLevel: 'safe',
    totalConsumed: 0,
    lastDosage: null,
    safeTimeReached: false
  };

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ghbTrackerUserDosageData', JSON.stringify(userDosageData));
  }, [userDosageData]);

  useEffect(() => {
    localStorage.setItem('ghbTrackerSettings', JSON.stringify(settings));
  }, [settings]);
  
  // Calculate time remaining and risk level for current user
  useEffect(() => {
    if (!currentUserData || !currentUserData.dosages || currentUserData.dosages.length === 0) {
      updateUserData({
        activeSession: false,
        timeRemaining: 0,
        riskLevel: 'safe',
        lastDosage: null
      });
      return;
    }

    // Sort dosages by timestamp (newest first)
    const sortedDosages = [...currentUserData.dosages].sort((a, b) => b.timestamp - a.timestamp);
    const newest = sortedDosages[0];
    
    updateUserData({
      lastDosage: newest,
      activeSession: true
    });

    // Calculate time elapsed since last dosage
    const updateTimeAndRisk = () => {
      const now = Date.now();
      const elapsed = now - newest.timestamp;
      const safeTime = settings.safeInterval * 60 * 1000; // convert to ms
      const warningTime = settings.warningInterval * 60 * 1000; // convert to ms
      
      // Calculate time remaining until safe window
      const remaining = Math.max(0, safeTime - elapsed);

      // Calculate total consumed in last 24 hours
      const last24Hours = now - 24 * 60 * 60 * 1000;
      const recentDosages = currentUserData.dosages.filter(d => d.timestamp > last24Hours);
      const total = recentDosages.reduce((sum, d) => sum + d.amount, 0);
      
      // Determine risk level
      let newRiskLevel: RiskLevel = 'safe';
      let previousRiskLevel = currentUserData.riskLevel;
      
      if (elapsed < warningTime) {
        newRiskLevel = 'danger';
      } else if (elapsed < safeTime) {
        newRiskLevel = 'warning';
      } else {
        newRiskLevel = 'safe';
        
        // Play sound when transitioning to safe (only once)
        if (!currentUserData.safeTimeReached && settings.soundEnabled) {
          updateUserData({ safeTimeReached: true });
          notificationSound.play().catch(e => console.error('Failed to play sound', e));
          
          // If previously in danger state, show congratulatory message
          if (previousRiskLevel === 'danger') {
            toast({
              title: "Congratulations! 🎉",
              description: "You've safely waited through the entire interval. Great job staying safe!",
            });
          } else {
            toast({
              title: "Safe Time Reached",
              description: "It's now safe to take another dose if needed.",
            });
          }
        }
      }
      
      // Check if total consumption exceeds max daily dosage
      if (total > settings.maxDailyDosage) {
        newRiskLevel = 'danger';
      }
      
      // Play stronger sound when risk level changes from warning to danger
      if (previousRiskLevel === 'warning' && newRiskLevel === 'danger' && settings.soundEnabled) {
        unsafeTimeSound.play().catch(e => console.error('Failed to play unsafe time sound', e));
        toast({
          title: "Warning: Unsafe Time!",
          description: "It's now unsafe to take another dose. Please wait for the safe interval.",
          variant: "destructive",
        });
      }
      
      updateUserData({
        timeRemaining: remaining,
        riskLevel: newRiskLevel,
        totalConsumed: total
      });
    };

    // Initial calculation
    updateTimeAndRisk();
    
    // Update time remaining every second
    const intervalId = setInterval(updateTimeAndRisk, 1000);
    
    return () => clearInterval(intervalId);
  }, [currentUser.id, currentUserData.dosages, settings, currentUserData.riskLevel]);

  // Reset safe time reached flag when new dosage is added
  useEffect(() => {
    if (currentUserData.dosages.length > 0 && currentUserData.timeRemaining > 0) {
      updateUserData({ 
        safeTimeReached: false
      });
    }
  }, [currentUser.id, currentUserData.dosages, currentUserData.timeRemaining]);

  // Helper function to update the current user's data
  const updateUserData = (updates: Partial<UserDosageData>) => {
    setUserDosageData(prev => ({
      ...prev,
      [currentUser.id]: {
        ...prev[currentUser.id],
        ...updates
      }
    }));
  };

  // Add a new dosage for the current user
  const addDosage = (amount: number, note?: string, minutesAgo?: number) => {
    const newDosage: Dosage = {
      id: uuidv4(),
      timestamp: minutesAgo ? Date.now() - (minutesAgo * 60 * 1000) : Date.now(),
      amount,
      note,
    };
    
    const updatedDosages = [newDosage, ...(currentUserData.dosages || [])];
    updateUserData({ dosages: updatedDosages });
  };

  // Reset current user's session
  const resetSession = () => {
    updateUserData({
      dosages: [],
      activeSession: false,
      timeRemaining: 0,
      riskLevel: 'safe',
      totalConsumed: 0,
      lastDosage: null,
      safeTimeReached: false
    });
  };

  // Update settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const contextValue: DosageContextType = {
    dosages: currentUserData.dosages || [],
    settings,
    addDosage,
    resetSession,
    updateSettings,
    activeSession: currentUserData.activeSession || false,
    lastDosage: currentUserData.lastDosage,
    timeRemaining: currentUserData.timeRemaining || 0,
    riskLevel: currentUserData.riskLevel || 'safe',
    totalConsumed: currentUserData.totalConsumed || 0
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
