
import React from 'react';
import { useDosage } from '@/contexts/DosageContext';
import { formatTime, getRiskColorClass, getRiskText } from '@/utils/dosageUtils';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

const RiskIndicator: React.FC = () => {
  const { riskLevel, timeRemaining, activeSession, settings, lastDosage } = useDosage();
  
  // Calculate time elapsed since last dosage
  const timeElapsed = lastDosage ? Date.now() - lastDosage.timestamp : 0;

  // Get the appropriate icon based on the risk level
  const StatusIcon = () => {
    switch (riskLevel) {
      case 'safe':
        return <CircleCheck className="w-5 h-5 text-safe" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-danger" />;
      default:
        return null;
    }
  };

  // Calculate progress for the progress bar
  const calculateProgress = () => {
    if (!activeSession || timeRemaining <= 0) return 100;
    
    const totalTime = settings.safeInterval * 60 * 1000; // in ms
    const elapsedTime = totalTime - timeRemaining;
    return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
  };

  const progress = calculateProgress();
  const data = [{ value: progress }];

  return (
    <Card className="glass-panel w-full fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Status</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <StatusIcon />
            <span className={`font-semibold ${getRiskColorClass(riskLevel)}`}>
              {getRiskText(riskLevel)}
            </span>
          </div>

          {activeSession && (
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {timeRemaining > 0 
                  ? `Safe in ${formatTime(timeRemaining)}`
                  : 'Safe window now'}
              </span>
            </div>
          )}
        </div>
        
        {activeSession && (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={20}>
              <BarChart
                data={data}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                barSize={20}
                layout="vertical"
              >
                <Bar
                  dataKey="value"
                  radius={4}
                  background={{ fill: '#f1f1f1', radius: 4 }}
                >
                  <Cell fill={
                    riskLevel === 'safe' ? 'hsl(var(--safe))' :
                    riskLevel === 'warning' ? 'hsl(var(--warning))' : 
                    'hsl(var(--danger))'
                  } />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Time information section */}
            <div className="flex justify-between mt-3 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>Elapsed: {formatTime(timeElapsed)}</span>
              </div>
              {timeRemaining > 0 && (
                <div className="flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  <span>Remaining: {formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskIndicator;
