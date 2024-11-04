"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Announcement } from '@/lib/types';

interface AnnouncementHistoryProps {
  airportCodes: string[];
}

export function AnnouncementHistory({ airportCodes }: AnnouncementHistoryProps) {
  const [selectedAirport, setSelectedAirport] = useState(airportCodes[0]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const { supabase } = useSupabase();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          flights (
            flight_number,
            destination_airport
          )
        `)
        .eq('airport_code', selectedAirport)
        .order('played_at', { ascending: false });

      if (data && !error) {
        setAnnouncements(data);
      }
    };

    fetchAnnouncements();

    const subscription = supabase
      .channel('announcements')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'announcements',
        filter: `airport_code=eq.${selectedAirport}`
      }, fetchAnnouncements)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedAirport, supabase]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>Announcement History</div>
          <Select value={selectedAirport} onValueChange={setSelectedAirport}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select airport" />
            </SelectTrigger>
            <SelectContent>
              {airportCodes.map(code => (
                <SelectItem key={code} value={code}>{code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {announcements.map(announcement => (
            <div
              key={announcement.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="grid gap-1">
                <div className="font-semibold">
                  {announcement.flights?.flight_number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {announcement.announcement_type} Call
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(announcement.played_at), 'dd MMM yyyy HH:mm')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}