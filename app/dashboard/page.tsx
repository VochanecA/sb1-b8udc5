"use client";

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlightBoard } from "@/components/dashboard/flight-board";
import { AnnouncementHistory } from "@/components/dashboard/announcement-history";
import { UserManagement } from "@/components/dashboard/user-management";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useSupabase } from '@/components/providers/supabase-provider';
import { User } from '@/lib/types';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const { supabase } = useSupabase();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setUser(data);
      }
    };
    getUser();
  }, [supabase]);

  if (!user) return null;

  return (
    <div className="container mx-auto py-6">
      <DashboardHeader user={user} />
      
      <Tabs defaultValue="flights" className="mt-6">
        <TabsList>
          <TabsTrigger value="flights">Flight Board</TabsTrigger>
          <TabsTrigger value="announcements">Announcement History</TabsTrigger>
          {user.role === 'admin' && (
            <TabsTrigger value="users">User Management</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="flights">
          <FlightBoard airportCodes={user.airport_codes} />
        </TabsContent>
        
        <TabsContent value="announcements">
          <AnnouncementHistory airportCodes={user.airport_codes} />
        </TabsContent>
        
        {user.role === 'admin' && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}