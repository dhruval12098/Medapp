import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createTwilioClient } from '@/lib/twilio-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { userId, medicineName, dosage } = req.body;

  if (!userId || !medicineName || !dosage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('name, sms_notifications_enabled')
      .eq('id', userId)
      .single();

    if (userError || !user || !user.sms_notifications_enabled) {
      return res.status(400).json({ error: 'User not found or SMS notifications disabled' });
    }

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);

    if (contactsError || !contacts || contacts.length === 0) {
      return res.status(400).json({ error: 'No family contacts found' });
    }

    const client = createTwilioClient();
    const message = `Alert: ${user.name} has dismissed a reminder for ${medicineName} (${dosage}). Please check on them.`;

    for (const contact of contacts) {
      if (contact.phone) {
        const response = await client.messages.create({
          body: message,
          from: twilioPhoneNumber,
          to: contact.phone,
        });

        await supabase.from('sms_logs').insert({
          user_id: userId,
          message,
          status: 'sent',
          family_sms_type: 'family_notification',
          provider_response: JSON.stringify(response),
        });
      }
    }

    return res.status(200).json({ message: 'SMS sent successfully' });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    await supabase.from('sms_logs').insert({
      user_id: userId,
      message: `Failed to send SMS for ${medicineName}`,
      status: 'failed',
      family_sms_type: 'family_notification',
      provider_response: JSON.stringify(error),
    });
    return res.status(500).json({ error: 'Failed to send SMS', details: error.message || 'Unknown error' });
  }
}