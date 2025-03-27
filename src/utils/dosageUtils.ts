
import { RiskLevel } from "../types/types";

/**
 * Formats milliseconds into a human-readable time string
 * @param ms Milliseconds to format
 * @returns Formatted time string (e.g., "1h 30m")
 */
export const formatTime = (ms: number): string => {
  if (ms <= 0) return "0m";
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Formats milliseconds into a human-readable countdown format
 * @param ms Milliseconds to format
 * @returns Formatted countdown string (e.g., "01:30:45")
 */
export const formatCountdown = (ms: number): string => {
  if (ms <= 0) return "00:00";
  
  let seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  
  const format = (n: number) => n.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
  } else {
    return `${format(minutes)}:${format(seconds)}`;
  }
};

/**
 * Formats a timestamp into a human-readable time string
 * @param timestamp Timestamp to format
 * @returns Formatted time string (e.g., "3:45 PM")
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats a timestamp into a human-readable date string
 * @param timestamp Timestamp to format
 * @returns Formatted date string (e.g., "Today" or "Yesterday" or "2/15")
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  }
};

/**
 * Returns color classes based on the risk level
 * @param riskLevel Risk level
 * @returns Tailwind color classes for the given risk level
 */
export const getRiskColorClass = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'safe':
      return 'text-safe bg-safe/10';
    case 'warning':
      return 'text-warning bg-warning/10';
    case 'danger':
      return 'text-danger bg-danger/10';
    default:
      return 'text-primary bg-primary/10';
  }
};

/**
 * Returns border color classes based on the risk level
 * @param riskLevel Risk level
 * @returns Tailwind border color classes for the given risk level
 */
export const getRiskBorderClass = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'safe':
      return 'border-safe';
    case 'warning':
      return 'border-warning';
    case 'danger':
      return 'border-danger';
    default:
      return 'border-primary';
  }
};

/**
 * Returns a text description of the risk level
 * @param riskLevel Risk level
 * @returns Text description of the given risk level
 */
export const getRiskText = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'safe':
      return 'It`s G-time';
    case 'warning':
      return 'Almost G-time. Be cautious!';
    case 'danger':
      return 'Wait more for safe G-time!';
    default:
      return '';
  }
};
