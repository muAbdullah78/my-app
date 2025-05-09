import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');

serve(async (req) => {
  try {
    const { token, title, body, data } = await req.json();

    if (!token || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXPO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send push notification');
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}); 