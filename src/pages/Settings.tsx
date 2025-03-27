
import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import { useDosage } from '@/contexts/DosageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Clock, Volume2, VolumeX, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useDosage();
  const { toast } = useToast();
  
  const [safeInterval, setSafeInterval] = useState(settings.safeInterval);
  const [warningInterval, setWarningInterval] = useState(settings.warningInterval);
  const [defaultDosage, setDefaultDosage] = useState(settings.defaultDosage);
  const [maxDailyDosage, setMaxDailyDosage] = useState(settings.maxDailyDosage);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  
  const handleSaveSettings = () => {
    // Ensure warning interval is less than or equal to safe interval
    const validatedWarningInterval = Math.min(warningInterval, safeInterval);
    
    updateSettings({
      safeInterval,
      warningInterval: validatedWarningInterval,
      defaultDosage,
      maxDailyDosage,
      soundEnabled,
    });
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };
  
  // Format the interval values for display
  const formatIntervalLabel = (value: number) => {
    if (value < 60) {
      return `${value} min`;
    } else {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}m`;
      }
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          <Card className="glass-panel fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Time Intervals
              </CardTitle>
              <CardDescription>
                Configure the safe and warning periods between dosages
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="safe-interval">Safe Interval</Label>
                    <span className="text-sm font-medium">
                      {formatIntervalLabel(safeInterval)}
                    </span>
                  </div>
                  <Slider
                    id="safe-interval"
                    min={60}
                    max={240}
                    step={15}
                    value={[safeInterval]}
                    onValueChange={(value) => {
                      setSafeInterval(value[0]);
                      // Adjust warning interval if needed
                      if (warningInterval > value[0]) {
                        setWarningInterval(value[0]);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum time before it's safe to take another dose
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="warning-interval">Warning Interval</Label>
                    <span className="text-sm font-medium">
                      {formatIntervalLabel(warningInterval)}
                    </span>
                  </div>
                  <Slider
                    id="warning-interval"
                    min={30}
                    max={safeInterval}
                    step={15}
                    value={[warningInterval]}
                    onValueChange={(value) => setWarningInterval(value[0])}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    When to show caution warning (must be less than safe interval)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-panel fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle>Dosage Settings</CardTitle>
              <CardDescription>
                Configure default dosage and daily limits
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="default-dosage" className="mb-2 block">
                    Default Dosage (ml)
                  </Label>
                  <Input
                    id="default-dosage"
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={defaultDosage}
                    onChange={(e) => setDefaultDosage(parseFloat(e.target.value) || 0.1)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max-daily" className="mb-2 block">
                    Max Daily (ml)
                  </Label>
                  <Input
                    id="max-daily"
                    type="number"
                    min={1}
                    step={0.5}
                    value={maxDailyDosage}
                    onChange={(e) => setMaxDailyDosage(parseFloat(e.target.value) || 1)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="sound-enabled"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
                <Label htmlFor="sound-enabled" className="cursor-pointer flex items-center">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 mr-2" />
                  ) : (
                    <VolumeX className="w-4 h-4 mr-2" />
                  )}
                  Sound Notifications
                </Label>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            onClick={handleSaveSettings} 
            className="w-full bg-primary hover:bg-primary/90 scale-in"
            style={{ animationDelay: '200ms' }}
          >
            <Save className="w-4 h-4 mr-2" /> Save Settings
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
