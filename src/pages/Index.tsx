
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
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-md mb-8">
          <DosageButton />
        </div>
        
        <div className="w-full max-w-md space-y-6">
          <RiskIndicator />
          <DosageHistory />
        </div>
      </main>
    </div>
  );
};

export default Index;
