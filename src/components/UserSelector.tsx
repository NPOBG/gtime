
import React, { useState } from 'react';
import { useUser, User } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { UserPlus, Trash2, UserRound, Edit, Check, X } from 'lucide-react';
import { useDosage } from '@/contexts/DosageContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Array of animal avatars
const animalEmojis = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🦆", "🦅", "🦉",
  "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞"
];

// Array of colors for different users
const userColors = [
  "hsl(var(--safe))",
  "#9b87f5",
  "#7E69AB",
  "#0EA5E9",
  "#D946EF",
  "#F97316",
  "#10B981",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6"
];

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
  const { updateUser } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <div className="relative group">
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
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
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          
          <UserEditForm 
            user={user} 
            onSave={(updatedUser) => {
              updateUser(user.id, updatedUser);
              setIsEditDialogOpen(false);
              toast.success("User updated successfully");
            }}
          />
        </DialogContent>
      </Dialog>
      
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
      
      <button
        className="absolute -top-1 -left-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditDialogOpen(true);
        }}
      >
        <Edit className="h-3 w-3" />
      </button>
    </div>
  );
};

interface UserEditFormProps {
  user: User;
  onSave: (updatedUser: Partial<Omit<User, 'id'>>) => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({ user, onSave }) => {
  const [name, setName] = useState(user.name);
  const [selectedEmoji, setSelectedEmoji] = useState(user.emoji);
  const [selectedColor, setSelectedColor] = useState(user.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      emoji: selectedEmoji,
      color: selectedColor
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nickname</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a nickname"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>Choose an Avatar</Label>
        <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1">
          {animalEmojis.map((emoji, index) => (
            <button
              key={index}
              type="button"
              className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${
                selectedEmoji === emoji ? 'ring-2 ring-primary' : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Choose a Color</Label>
        <div className="grid grid-cols-5 gap-2">
          {userColors.map((color, index) => (
            <button
              key={index}
              type="button"
              className={`h-8 w-8 rounded-full ${
                selectedColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSave({ name: user.name, emoji: user.emoji, color: user.color })}
        >
          <X className="mr-1 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit">
          <Check className="mr-1 h-4 w-4" /> Save
        </Button>
      </div>
    </form>
  );
};

export default UserSelector;
