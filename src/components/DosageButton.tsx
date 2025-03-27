import React, { useState, useEffect } from 'react';
import { useDosage } from '@/contexts/DosageContext';
import { useUser } from '@/contexts/UserContext';
import { formatCountdown, getRiskBorderClass, getRiskColorClass, formatTime } from '@/utils/dosageUtils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RiskLevel } from '@/types/types';
import { AlertTriangle, Check, Timer, Clock, InfoIcon, Clock10 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

const DosageButton: React.FC = () => {
  const { 
    addDosage, 
    riskLevel, 
    timeRemaining, 
    activeSession, 
    settings,
    lastDosage,
    hourWarningReached
  } = useDosage();
  
  const { currentUser } = useUser();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [dosageAmount, setDosageAmount] = useState(settings.defaultDosage.toString());
  const [dosageNote, setDosageNote] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showHourWarning, setShowHourWarning] = useState(false);
  const [useTimeOffset, setUseTimeOffset] = useState(false);
  const [minutesAgo, setMinutesAgo] = useState("0");

  // Update the time elapsed since last dosage
  useEffect(() => {
    if (!activeSession || !lastDosage) return;

    const updateElapsedTime = () => {
      setTimeElapsed(Date.now() - lastDosage.timestamp);
    };

    // Initial update
    updateElapsedTime();

    // Update elapsed time every second
    const intervalId = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(intervalId);
  }, [activeSession, lastDosage]);

  // Show one-hour warning when appropriate
  useEffect(() => {
    if (hourWarningReached && !showHourWarning) {
      setShowHourWarning(true);
    } else if (!hourWarningReached && showHourWarning) {
      setShowHourWarning(false);
    }
  }, [hourWarningReached, showHourWarning]);

  const handleButtonClick = () => {
    if (riskLevel === 'safe') {
      setIsDialogOpen(true);
    } else {
      setIsWarningOpen(true);
    }
  };

  const handleConfirmDosage = () => {
    const amount = parseFloat(dosageAmount) || settings.defaultDosage;
    
    if (useTimeOffset && parseInt(minutesAgo) > 0) {
      addDosage(amount, dosageNote, parseInt(minutesAgo));
    } else {
      addDosage(amount, dosageNote);
    }
    
    // Reset form values
    setDosageAmount(settings.defaultDosage.toString());
    setDosageNote('');
    setUseTimeOffset(false);
    setMinutesAgo("0");
    setIsDialogOpen(false);
  };

  const handleOverrideDosage = () => {
    setIsWarningOpen(false);
    setIsDialogOpen(true);
  };

  // Suggest a lower dose based on last intake
  const getSuggestedDose = () => {
    if (!lastDosage) return settings.defaultDosage;
    return Math.max(0.5, lastDosage.amount * 0.8).toFixed(1);
  };

  // Format time as HH:MM:SS
  const formatTimeAsHHMMSS = (ms: number): string => {
    if (ms <= 0) return "00:00:00";
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Utility function to determine the button label
  const getButtonLabel = (): React.ReactNode => {
    if (!activeSession) return 'Start Session';
    
    // Display elapsed time in active session
    if (activeSession && lastDosage) {
      return (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="text-lg font-bold mb-2 text-white text-shadow">
            <Clock className="inline-block w-5 h-5 mr-1" />
            {lastDosage.amount.toFixed(1)} ML
          </div>
          <div className="text-4xl font-mono font-bold text-white text-shadow">
            {formatTimeAsHHMMSS(timeElapsed)}
          </div>
          {timeRemaining > 0 && (
            <div className="text-sm mt-3 text-white font-medium text-shadow">
              Safe in {formatCountdown(timeRemaining)}
            </div>
          )}
        </div>
      );
    }
    
    return formatCountdown(timeRemaining);
  };

  // Get the CSS classes for different risk levels
  const getRiskClasses = (level: RiskLevel): string => {
    if (level === 'safe') return 'bg-safe/10 text-safe';
    if (level === 'warning') return 'bg-warning/10 text-warning';
    return 'bg-danger/10 text-danger';
  };

  // Get icon for warning dialog
  const WarningIcon = () => {
    if (riskLevel === 'warning') {
      return <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" strokeWidth={1.5} />;
    } else {
      return <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" strokeWidth={1.5} />;
    }
  };

  // Utility function to get gradient background based on risk level
  const getGradientBackground = (level: RiskLevel): string => {
    if (level === 'safe') {
      return 'bg-gradient-to-br from-safe/30 to-green-400/40';
    } else if (level === 'warning') {
      return 'bg-gradient-to-br from-warning/30 to-amber-400/40';
    } else {
      return 'bg-gradient-to-br from-danger/30 to-red-400/40';
    }
  };

  // Get one-hour warning message if needed
  const getHourWarningMessage = () => {
    if (!hourWarningReached || !lastDosage) return null;
    
    return (
      <Alert className="mb-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertTitle className="text-yellow-600 dark:text-yellow-400">1-Hour Warning</AlertTitle>
        <AlertDescription className="text-yellow-600 dark:text-yellow-400">
          It's been over an hour since your last dose. Please consider:
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Take with cotton to moderate effects</li>
            <li>Consider a lower dose ({getSuggestedDose()} ml recommended)</li>
            <li>Or wait until the safe interval ({formatCountdown(timeRemaining)})</li>
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  // Predefined minutes options for the dropdown
  const minutesOptions = [5, 10, 15, 30, 45, 60, 90, 120];

  return (
    <>
      <div className="w-full flex flex-col items-center justify-center py-6">
        {showHourWarning && (
          <div className="w-full max-w-md mb-4 animate-fade-in">
            {getHourWarningMessage()}
          </div>
        )}
        
        <div className="text-center mb-6">
          <div className="flex flex-col items-center">
            <div className="text-xl font-medium mb-2" style={{ color: currentUser.color }}>
              {currentUser.emoji} {currentUser.name}
            </div>
            <div className={`inline-block px-6 py-2 rounded-full text-sm font-medium ${getRiskClasses(riskLevel)} shadow-sm`}>
              {riskLevel === 'safe' ? 'Safe to dose' : (
                riskLevel === 'warning' ? 'Caution Period' : 'Unsafe Period'
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleButtonClick}
          className={`relative w-56 h-56 rounded-full flex items-center justify-center font-semibold button-active
            ${getRiskBorderClass(riskLevel)} border-4 ${getGradientBackground(riskLevel)} ${getRiskColorClass(riskLevel)} 
            shadow-xl z-10 backdrop-blur-sm before:absolute before:inset-0 before:rounded-full 
            before:bg-gradient-to-tr before:from-white/10 before:to-transparent before:z-0
            ${hourWarningReached ? 'ring-4 ring-yellow-400 ring-opacity-70' : ''}`}
          style={{ borderColor: currentUser.color }}
        >
          {activeSession && timeRemaining > 0 && (
            <div className={`absolute inset-0 rounded-full ${getRiskBorderClass(riskLevel)} opacity-60`}
                 style={{
                   transform: `scale(${1 - (timeRemaining / (settings.safeInterval * 60 * 1000))})`,
                   transition: 'transform 1s linear'
                 }}
            />
          )}
          
          {/* Pulsing animation for safe status */}
          {riskLevel === 'safe' && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-safe opacity-70 animate-pulse-ring" />
              <div className="absolute -inset-1 rounded-full border-2 border-safe opacity-40 animate-pulse-ring" 
                   style={{ animationDelay: '0.4s' }} />
            </>
          )}

          {/* Pulsing animation for hour warning */}
          {hourWarningReached && (
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400 opacity-70 animate-pulse-ring" />
          )}
          
          <div className="z-10 px-4 text-center">
            {getButtonLabel()}
          </div>
        </button>
        
        <div className="text-center mt-6">
          <span className="text-sm font-medium text-muted-foreground">
            {activeSession
              ? 'Tap to log a new intake'
              : 'Tap to start tracking'}
          </span>
        </div>
      </div>

      {/* Dosage input dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-panel">
          <DialogHeader>
            <DialogTitle>Log Intake for {currentUser.name}</DialogTitle>
            <DialogDescription>
              Enter the amount and any notes about this dose.
            </DialogDescription>
          </DialogHeader>
          
          {hourWarningReached && (
            <div className="mt-2 mb-2">
              {getHourWarningMessage()}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dosage-amount">Amount (ml)</Label>
              <Input
                id="dosage-amount"
                type="number"
                step="0.1"
                min="0.1"
                value={dosageAmount}
                onChange={(e) => setDosageAmount(e.target.value)}
                className="text-lg"
              />
              {hourWarningReached && lastDosage && (
                <p className="text-sm text-yellow-600 mt-1">
                  <InfoIcon className="inline-block w-4 h-4 mr-1" />
                  Recommended: {getSuggestedDose()} ml (lower than your last dose)
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 py-2">
              <Switch 
                id="time-offset-switch"
                checked={useTimeOffset}
                onCheckedChange={setUseTimeOffset}
              />
              <Label htmlFor="time-offset-switch" className="cursor-pointer flex items-center">
                <Clock10 className="w-4 h-4 mr-2" />
                Taken earlier than now
              </Label>
            </div>
            
            {useTimeOffset && (
              <div className="grid gap-2">
                <Label htmlFor="minutes-ago">Minutes ago</Label>
                <div className="flex gap-3">
                  <Select
                    value={minutesAgo}
                    onValueChange={setMinutesAgo}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select minutes" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutesOptions.map((min) => (
                        <SelectItem key={min} value={min.toString()}>
                          {min} minutes ago
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {minutesAgo === "custom" && (
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      placeholder="Minutes"
                      className="w-24"
                      onChange={(e) => setMinutesAgo(e.target.value)}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select how many minutes ago you took this dose
                </p>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="dosage-note">Notes (optional)</Label>
              <Textarea
                id="dosage-note"
                value={dosageNote}
                onChange={(e) => setDosageNote(e.target.value)}
                placeholder="Any additional details..."
                className="min-h-20"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDosage} className="bg-primary hover:bg-primary/90">
              <Check className="mr-2 h-4 w-4" /> Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning dialog */}
      <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <DialogContent className="glass-panel">
          <DialogHeader>
            <WarningIcon />
            <DialogTitle className="text-center text-xl">
              {riskLevel === 'warning' ? 'Caution: Approaching Safe Window' : 'Warning: Unsafe Timing'}
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              {riskLevel === 'warning'
                ? `It's recommended to wait ${formatCountdown(timeRemaining)} longer before your next dose.`
                : `It's unsafe to dose now. Please wait ${formatCountdown(timeRemaining)} for a safe window.`}
            </DialogDescription>
          </DialogHeader>
          
          {hourWarningReached && (
            <div className="mt-2">
              {getHourWarningMessage()}
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsWarningOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleOverrideDosage} 
              variant="destructive"
              className="w-full sm:w-auto"
            >
              Override & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DosageButton;
