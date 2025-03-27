
import React from 'react';
import { useUser, User } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { UserPlus, Trash2, UserRound } from 'lucide-react';
import { useDosage } from '@/contexts/DosageContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const UserSelector: React.FC = () => {
  const { users, currentUser, addUser, removeUser, setCurrentUser } = useUser();
  const { riskLevel } = useDosage();

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-2 overflow-auto py-2 px-1 w-full">
        {users.map(user => (
          <UserAvatar
            key={user.id}
            user={user}
            isActive={user.id === currentUser.id}
            onSelect={() => setCurrentUser(user)}
            onRemove={users.length > 1 ? () => removeUser(user.id) : undefined}
          />
        ))}
        
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-12 w-12 flex-shrink-0 bg-background/80 backdrop-blur-sm"
          onClick={() => addUser()}
        >
          <UserPlus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

interface UserAvatarProps {
  user: User;
  isActive: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, isActive, onSelect, onRemove }) => {
  return (
    <div className="relative group">
      <Avatar 
        className={`h-12 w-12 cursor-pointer transition-all duration-200 ${
          isActive 
            ? 'ring-2 ring-primary ring-offset-2' 
            : 'opacity-70 hover:opacity-100'
        }`}
        style={{ backgroundColor: user.color }}
        onClick={onSelect}
      >
        <AvatarFallback className="text-lg">
          {user.emoji}
        </AvatarFallback>
      </Avatar>
      
      {onRemove && (
        <button
          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
      
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-background text-foreground px-2 py-0.5 rounded-full shadow-sm">
          {user.name.split(' ')[0]}
        </div>
      )}
    </div>
  );
};

export default UserSelector;
