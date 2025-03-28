import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDosage } from '@/contexts/DosageContext';
import { Button } from '@/components/ui/button';
import { Settings, Clock } from 'lucide-react';
const NavBar: React.FC = () => {
  const location = useLocation();
  const {
    resetSession,
    activeSession
  } = useDosage();
  return <div className="sticky top-0 z-10 w-full glass-panel border-b border-border/40 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Clock className="w-6 h-6 mr-2 text-primary" />
            <span className="font-semibold text-lg">G-time</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          {activeSession && location.pathname === '/' && <Button variant="outline" size="sm" onClick={resetSession} className="text-xs">Reset Application</Button>}
          
          <Link to={location.pathname === '/settings' ? '/' : '/settings'}>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              {location.pathname === '/settings' ? <Clock className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
            </Button>
          </Link>
        </div>
      </div>
    </div>;
};
export default NavBar;