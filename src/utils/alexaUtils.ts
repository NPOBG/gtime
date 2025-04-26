
import { v4 as uuidv4 } from 'uuid';
import { AlexaRequest, AlexaResponse } from '../types/alexa-types';
import { Dosage, Session, AppSettings, RiskLevel } from '../types/types';

// Default settings - should be kept in sync with app defaults
const defaultSettings: AppSettings = {
  safeInterval: 90, // 90 minutes
  warningInterval: 60, // 60 minutes
  defaultDosage: 2, // 2ml
  soundEnabled: true,
  maxDailyDosage: 10, // 10ml
};

// Function to create a basic response
export const createResponse = (
  text: string, 
  sessionAttributes: Record<string, any> = {}, 
  shouldEndSession: boolean = false
): AlexaResponse => {
  return {
    version: '1.0',
    sessionAttributes,
    response: {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${text}</speak>`,
      },
      shouldEndSession,
    },
  };
};

// Get dosage data from localStorage (for demo purposes - in production would use a database)
export const getUserData = (userId: string): {
  settings: AppSettings;
  dosages: Dosage[];
  lastDosage: Dosage | null;
  riskLevel: RiskLevel;
  timeRemaining: number;
  sessions: Session[];
  currentSession: Session | null;
} => {
  // In a real implementation, this would fetch from a database based on userId
  // For demo, it tries to access localStorage (won't work in Lambda function)
  try {
    const savedUserDosageData = localStorage.getItem('ghbTrackerUserDosageData');
    const savedSettings = localStorage.getItem('ghbTrackerSettings');
    
    const userDosageData = savedUserDosageData ? JSON.parse(savedUserDosageData) : {};
    const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    
    // Get the first user's data (in real implementation would match to Alexa user)
    const firstUserId = Object.keys(userDosageData)[0] || '';
    const userData = firstUserId ? userDosageData[firstUserId] : null;
    
    if (userData) {
      return {
        settings,
        dosages: userData.dosages || [],
        lastDosage: userData.lastDosage || null,
        riskLevel: userData.riskLevel || 'safe',
        timeRemaining: userData.timeRemaining || 0,
        sessions: userData.sessions || [],
        currentSession: userData.currentSession || null,
      };
    }
    
    return {
      settings: defaultSettings,
      dosages: [],
      lastDosage: null,
      riskLevel: 'safe',
      timeRemaining: 0,
      sessions: [],
      currentSession: null,
    };
  } catch (error) {
    console.error('Error getting user data', error);
    return {
      settings: defaultSettings,
      dosages: [],
      lastDosage: null,
      riskLevel: 'safe',
      timeRemaining: 0,
      sessions: [],
      currentSession: null,
    };
  }
};

// Format time remaining
export const formatTime = (ms: number): string => {
  if (ms <= 0) return "0 minutes";
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
};

// Get information about the current status
export const getStatusInfo = (userData: ReturnType<typeof getUserData>): string => {
  const { riskLevel, timeRemaining, lastDosage, currentSession } = userData;
  
  if (!lastDosage) {
    return "You haven't recorded any dosages yet. You can say 'log a new dose' to get started.";
  }
  
  const timeElapsed = Date.now() - lastDosage.timestamp;
  const formattedElapsed = formatTime(timeElapsed);
  
  let statusText = `Your last dose was ${lastDosage.amount} ml, taken ${formattedElapsed} ago. `;
  
  if (riskLevel === 'safe') {
    statusText += "It's safe to take another dose now if needed.";
  } else if (riskLevel === 'warning') {
    statusText += `You're approaching the safe window. Please wait another ${formatTime(timeRemaining)} for complete safety.`;
  } else {
    statusText += `It's not safe to take another dose yet. Please wait another ${formatTime(timeRemaining)} for safety.`;
  }
  
  return statusText;
};

// Handle adding a new dosage
export const handleAddDosage = (amount: number = 2): string => {
  // In a real implementation, this would add to a database
  // For demo purposes, we'll just return a confirmation
  return `I've recorded a new dose of ${amount} ml. Please update your app to sync this information.`;
};

// Get session statistics
export const getSessionStats = (userData: ReturnType<typeof getUserData>): string => {
  const { currentSession } = userData;
  
  if (!currentSession) {
    return "You don't have an active session at the moment.";
  }
  
  const firstIntakeTime = new Date(currentSession.firstIntakeTimestamp || 0);
  const lastIntakeTime = new Date(currentSession.lastIntakeTimestamp || 0);
  
  const formattedFirstIntake = firstIntakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedLastIntake = lastIntakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return `Your current session started at ${formattedFirstIntake}. ` +
    `Your last intake was at ${formattedLastIntake}. ` +
    `The session has lasted ${currentSession.durationHours?.toFixed(1) || 0} hours. ` +
    `You've taken ${currentSession.dosageCount || 0} doses totaling ${currentSession.totalMl?.toFixed(1) || 0} ml. ` +
    `That's ${currentSession.mlPerIntake?.toFixed(1) || 0} ml per intake and ` +
    `${currentSession.mlPerHour?.toFixed(1) || 0} ml per hour.`;
};
