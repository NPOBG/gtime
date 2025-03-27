
import React from 'react';
import DosageButton from '@/components/DosageButton';
import DosageHistory from '@/components/DosageHistory';
import RiskIndicator from '@/components/RiskIndicator';
import NavBar from '@/components/NavBar';
import { useDosage } from '@/contexts/DosageContext';

const Index: React.FC = () => {
  const { activeSession } = useDosage();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-4 flex flex-col">
        <DosageButton />
        
        <div className="space-y-4 mb-8">
          <RiskIndicator />
          {activeSession && <DosageHistory />}
        </div>
      </main>
    </div>
  );
};

export default Index;
