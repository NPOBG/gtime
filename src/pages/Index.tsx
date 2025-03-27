
import React, { useEffect, useState } from 'react';
import DosageButton from '@/components/DosageButton';
import DosageHistory from '@/components/DosageHistory';
import RiskIndicator from '@/components/RiskIndicator';
import NavBar from '@/components/NavBar';
import UserSelector from '@/components/UserSelector';
import { useDosage } from '@/contexts/DosageContext';
import { useUser } from '@/contexts/UserContext';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Index: React.FC = () => {
  const { activeSession } = useDosage();
  const { users, currentUser, setCurrentUser } = useUser();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  
  // When the current user changes, update the carousel
  useEffect(() => {
    if (!api) return;
    
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    if (userIndex >= 0 && userIndex !== current) {
      api.scrollTo(userIndex);
    }
  }, [api, currentUser.id, users, current]);
  
  // When the carousel changes, update the current user
  useEffect(() => {
    if (!api) return;
    
    const handleSelect = () => {
      const selectedIndex = api.selectedScrollSnap();
      setCurrent(selectedIndex);
      
      // Update current user based on carousel position
      if (users[selectedIndex]) {
        setCurrentUser(users[selectedIndex]);
      }
    };
    
    api.on('select', handleSelect);
    
    return () => {
      api.off('select', handleSelect);
    };
  }, [api, users, setCurrentUser]);
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
        <UserSelector />
        
        <div className="w-full max-w-md relative my-4">
          <Carousel setApi={setApi} className="w-full" opts={{ align: 'center' }}>
            <CarouselContent>
              {users.map((user) => (
                <CarouselItem key={user.id} className="w-full">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full max-w-md mb-8">
                      <DosageButton />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {users.length > 1 && (
              <>
                <button
                  onClick={() => api?.scrollPrev()}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => api?.scrollNext()}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-md"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </Carousel>
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
