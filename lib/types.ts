export interface Flight {
  id: string;
  flight_number: string;
  airline_code: string;
  origin_airport: string;
  destination_airport: string;
  scheduled_time: string;
  actual_time?: string;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'DELAYED' | 'CANCELLED';
  gate: string;
  terminal: string;
  aircraft_type: string;
  airport_code: string;
}

export interface Announcement {
  id: string;
  flight_id: string;
  announcement_type: '1st' | '2nd' | 'Boarding' | 'LastCall';
  played_at: string;
  played_by: string;
  airport_code: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'operator';
  airport_codes: string[];
  created_at: string;
}