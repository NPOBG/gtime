import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dosage, AppSettings, RiskLevel, DosageContextType, UserDosageData, Session } from '../types/types';
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
          safeTimeReached: false,
          sessions: [],
          currentSession: null
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
    safeTimeReached: false,
    sessions: [],
    currentSession: null
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
      
      // Check if 4 safe intervals have passed since last dosage
      // If yes, automatically start a new session
      const fourSafeIntervals = 4 * safeTime;
      if (elapsed > fourSafeIntervals && currentUserData.currentSession) {
        // Only auto-start new session if we haven't already done so for this elapsed time
        if (currentUserData.currentSession.lastIntakeTimestamp === newest.timestamp) {
          startNewSession();
          toast({
            title: "New Session Started",
            description: "More than 4 safe intervals have passed since your last intake. A new session has been started.",
          });
        }
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
  }, [currentUser.id, currentUserData.dosages, settings, currentUserData.riskLevel, currentUserData.currentSession]);

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

  // Calculate session statistics based on dosages
  const calculateSessionStats = (dosages: Dosage[]) => {
    if (!dosages || dosages.length === 0) return null;
    
    const sortedDosages = [...dosages].sort((a, b) => a.timestamp - b.timestamp);
    const firstDosage = sortedDosages[0];
    const lastDosage = sortedDosages[sortedDosages.length - 1];
    
    const firstIntakeTime = new Date(firstDosage.timestamp);
    const lastIntakeTime = new Date(lastDosage.timestamp);
    
    // Duration in hours
    const durationMs = lastIntakeTime.getTime() - firstIntakeTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    // Total ml consumed
    const totalMl = sortedDosages.reduce((sum, d) => sum + d.amount, 0);
    
    // ML per hour (if duration > 0)
    const mlPerHour = durationHours > 0 ? totalMl / durationHours : totalMl;
    
    // ML per intake
    const mlPerIntake = totalMl / sortedDosages.length;
    
    // ML per 24 hours (extrapolated if session < 24h)
    const mlPer24Hours = durationHours > 0 ? (totalMl / durationHours) * 24 : 0;
    
    return {
      firstIntakeTimestamp: firstIntakeTime.getTime(),
      lastIntakeTimestamp: lastIntakeTime.getTime(),
      durationHours,
      totalMl,
      mlPerHour,
      mlPerIntake,
      mlPer24Hours,
      dosageCount: sortedDosages.length
    };
  };

  // Add a new dosage for the current user
  const addDosage = (amount: number, note?: string, minutesAgo?: number) => {
    const timestamp = minutesAgo ? Date.now() - (minutesAgo * 60 * 1000) : Date.now();
    
    const newDosage: Dosage = {
      id: uuidv4(),
      timestamp,
      amount,
      note,
    };
    
    // If no active session, create a new one
    if (!currentUserData.currentSession) {
      const newSession: Session = {
        id: uuidv4(),
        startTimestamp: timestamp,
        dosages: [newDosage],
        ...calculateSessionStats([newDosage])
      };
      
      updateUserData({
        currentSession: newSession,
        sessions: [...(currentUserData.sessions || []), newSession]
      });
    } else {
      // Add to existing session
      const updatedDosages = [...(currentUserData.currentSession.dosages || []), newDosage];
      const updatedSessionStats = calculateSessionStats(updatedDosages);
      
      const updatedSession = {
        ...currentUserData.currentSession,
        dosages: updatedDosages,
        ...updatedSessionStats
      };
      
      // Update session in the sessions array
      const updatedSessions = currentUserData.sessions.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      );
      
      updateUserData({
        currentSession: updatedSession,
        sessions: updatedSessions
      });
    }
    
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
      safeTimeReached: false,
      sessions: [],
      currentSession: null
    });
  };

  // Start a new session without removing history
  const startNewSession = () => {
    // Keep history but reset current session
    updateUserData({
      activeSession: false,
      timeRemaining: 0,
      riskLevel: 'safe',
      safeTimeReached: false,
      currentSession: null
    });
    
    toast({
      title: "New G-session Started",
      description: "Previous session history is preserved.",
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
    startNewSession,
    updateSettings,
    activeSession: currentUserData.activeSession || false,
    lastDosage: currentUserData.lastDosage,
    timeRemaining: currentUserData.timeRemaining || 0,
    riskLevel: currentUserData.riskLevel || 'safe',
    totalConsumed: currentUserData.totalConsumed || 0,
    sessions: currentUserData.sessions || [],
    currentSession: currentUserData.currentSession
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
