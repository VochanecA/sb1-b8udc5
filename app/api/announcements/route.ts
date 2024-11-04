import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const data = await request.json();

  const { error } = await supabase
    .from('announcements')
    .insert([{
      flight_id: data.flightId,
      announcement_type: data.type,
      played_at: new Date().toISOString(),
      played_by: data.userId,
      airport_code: data.airportCode
    }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}