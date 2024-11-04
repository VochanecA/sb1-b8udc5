"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Flight } from '@/lib/types';
import { useSupabase } from '@/components/providers/supabase-provider';
import { format, differenceInMinutes } from 'date-fns';
import { Search } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface FlightBoardProps {
  airportCodes: string[];
}

// Define announcement schedule (minutes before departure)
const ANNOUNCEMENT_SCHEDULE = {
  '1st': 60,    // 60 minutes before
  '2nd': 40,    // 40 minutes before
  'Boarding': 30, // 30 minutes before
  'LastCall': 15  // 15 minutes before
};

export function FlightBoard({ airportCodes }: FlightBoardProps) {
  const [selectedAirport, setSelectedAirport] = useState(airportCodes[0]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const announcementQueueRef = useRef<{
    flightId: string;
    type: string;
    scheduledTime: Date;
  }[]>([]);
  const playedAnnouncementsRef = useRef<Set<string>>(new Set());

  const getAudioPath = (flight: Flight, callType: string) => {
    const airlineCode = flight.flight_number.slice(0, 2);
    const flightNumber = flight.flight_number;
    const destinationCode = flight.destination_airport;
    const path = `/mp3/DEP/${airlineCode}/${flightNumber}/${flightNumber}${destinationCode}DEP_${callType}_Gate${flight.gate}_sr_en.mp3`;
    return path;
  };

  const playAnnouncement = async (flight: Flight, type: string) => {
    const audioPath = getAudioPath(flight, type);
    const announcementKey = `${flight.id}-${type}`;

    if (playedAnnouncementsRef.current.has(announcementKey)) {
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioPath);
      await audioRef.current.play();

      // Record the announcement in the database
      await supabase.from('announcements').insert([{
        flight_id: flight.id,
        announcement_type: type,
        played_at: new Date().toISOString(),
        airport_code: selectedAirport
      }]);

      playedAnnouncementsRef.current.add(announcementKey);

      toast({
        title: "Announcement Playing",
        description: `${type} call for flight ${flight.flight_number}`,
      });
    } catch (error) {
      console.error('Error playing announcement:', error);
      toast({
        title: "Error",
        description: "Failed to play announcement",
        variant: "destructive",
      });
    }
  };

  const scheduleAnnouncements = (flight: Flight) => {
    const now = new Date();
    const departureTime = new Date(flight.scheduled_time);

    Object.entries(ANNOUNCEMENT_SCHEDULE).forEach(([type, minutesBefore]) => {
      const scheduledTime = new Date(departureTime.getTime() - minutesBefore * 60000);
      const announcementKey = `${flight.id}-${type}`;

      // Only schedule if it's in the future and hasn't been played
      if (scheduledTime > now && !playedAnnouncementsRef.current.has(announcementKey)) {
        const timeUntilAnnouncement = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
          playAnnouncement(flight, type);
        }, timeUntilAnnouncement);

        announcementQueueRef.current.push({
          flightId: flight.id,
          type,
          scheduledTime
        });
      }
    });
  };

  useEffect(() => {
    const fetchFlights = async () => {
      const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('airport_code', selectedAirport)
        .order('scheduled_time', { ascending: true });

      if (data && !error) {
        setFlights(data);
        // Schedule announcements for all flights
        data.forEach(scheduleAnnouncements);
      }
    };

    // Clear existing announcements when airport changes
    announcementQueueRef.current = [];
    playedAnnouncementsRef.current.clear();

    fetchFlights();

    const subscription = supabase
      .channel('flights')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'flights',
        filter: `airport_code=eq.${selectedAirport}`
      }, fetchFlights)
      .subscribe();

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [selectedAirport, supabase]);

  const filteredFlights = flights.filter(flight => 
    flight.flight_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.destination_airport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNextAnnouncement = (flight: Flight) => {
    const now = new Date();
    const departureTime = new Date(flight.scheduled_time);
    let nextAnnouncement = null;

    Object.entries(ANNOUNCEMENT_SCHEDULE).forEach(([type, minutesBefore]) => {
      const announcementTime = new Date(departureTime.getTime() - minutesBefore * 60000);
      const announcementKey = `${flight.id}-${type}`;

      if (announcementTime > now && !playedAnnouncementsRef.current.has(announcementKey)) {
        if (!nextAnnouncement || announcementTime < new Date(nextAnnouncement.time)) {
          nextAnnouncement = {
            type,
            time: announcementTime.toISOString()
          };
        }
      }
    });

    return nextAnnouncement;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>Flight Board</div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search flights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
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
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {filteredFlights.map(flight => {
            const nextAnnouncement = getNextAnnouncement(flight);
            return (
              <div
                key={flight.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="grid gap-1">
                  <div className="font-semibold">{flight.flight_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {flight.origin_airport} → {flight.destination_airport}
                  </div>
                  {nextAnnouncement && (
                    <div className="text-xs text-muted-foreground">
                      Next: {nextAnnouncement.type} call at {format(new Date(nextAnnouncement.time), 'HH:mm')}
                    </div>
                  )}
                </div>
                <div className="grid gap-1 text-right">
                  <div className="font-medium">
                    {format(new Date(flight.scheduled_time), 'HH:mm')}
                  </div>
                  <div className={`text-sm ${
                    flight.status === 'DELAYED' ? 'text-red-500' :
                    flight.status === 'BOARDING' ? 'text-green-500' :
                    'text-muted-foreground'
                  }`}>
                    {flight.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}