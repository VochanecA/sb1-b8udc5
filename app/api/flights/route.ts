import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  
  const airport = searchParams.get('airport');
  const date = searchParams.get('date');
  
  const { data: flights, error } = await supabase
    .from('flights')
    .select('*')
    .eq('airport_code', airport)
    .gte('scheduled_time', date ? `${date}T00:00:00` : new Date().toISOString())
    .lte('scheduled_time', date ? `${date}T23:59:59` : new Date(Date.now() + 86400000).toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(flights);
}