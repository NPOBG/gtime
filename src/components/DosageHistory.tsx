
import React from 'react';
import { useDosage } from '@/contexts/DosageContext';
import { formatTimestamp, formatDate } from '@/utils/dosageUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dosage } from '@/types/types';
import { Clock } from 'lucide-react';

const DosageHistory: React.FC = () => {
  const { dosages, totalConsumed } = useDosage();

  // Group dosages by date
  const groupedDosages: Record<string, Dosage[]> = {};
  
  dosages.forEach(dosage => {
    const date = formatDate(dosage.timestamp);
    if (!groupedDosages[date]) {
      groupedDosages[date] = [];
    }
    groupedDosages[date].push(dosage);
  });
  
  // Sort dosages by timestamp (newest first)
  Object.keys(groupedDosages).forEach(date => {
    groupedDosages[date].sort((a, b) => b.timestamp - a.timestamp);
  });
  
  // Sort dates (today first, then yesterday, then others)
  const sortedDates = Object.keys(groupedDosages).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return 0;
  });

  return (
    <Card className="glass-panel w-full fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex justify-between items-center">
          <span>History</span>
          <span className="text-sm font-normal text-muted-foreground">
            Total today: {totalConsumed.toFixed(1)} ml
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-4">
        {dosages.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground italic">
            No dosages recorded yet
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map(date => (
              <div key={date} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
                
                <div className="space-y-2">
                  {groupedDosages[date].map(dosage => (
                    <div 
                      key={dosage.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{formatTimestamp(dosage.timestamp)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium text-primary">{dosage.amount.toFixed(1)} ml</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DosageHistory;
