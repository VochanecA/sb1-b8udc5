import { User } from '@/lib/types';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage flights and announcements for {user.airport_codes.join(', ')}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user.email}</p>
          <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
        </div>
        <Avatar>
          <AvatarFallback>
            {user.email.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}