import { supabase } from "./supabase";
import { createTwilioClient } from "./twilio-client";
import { Contact } from "./types";

export const scheduleSMSReminders = async (): Promise<void> => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Fetch users with SMS notifications enabled
  const { data: users, error: userError } = await supabase
    .from("user_profiles")
    .select("id, name, sms_notifications_enabled, missed_reminder_threshold")
    .eq("sms_notifications_enabled", true);

  if (userError) {
    console.error("Error fetching users:", userError);
    throw userError;
  }

  const client = createTwilioClient();
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  for (const user of users) {
    // Use user's custom threshold or default to 3
    const threshold = user.missed_reminder_threshold || 3;

    // Fetch today's scheduled medicines for the user
    const { data: schedules, error: scheduleError } = await supabase
      .from("schedule")
      .select("id, medicine_name, dosage, scheduled_time, missed_count")
      .eq("user_id", user.id)
      .gte("scheduled_time", fiveMinutesAgo.toISOString())
      .lte("scheduled_time", now.toISOString());

    if (scheduleError) {
      console.error("Error fetching schedules for user:", user.id, scheduleError);
      continue;
    }

    // Filter schedules where missed_count meets or exceeds threshold
    const missedReminders = schedules.filter(
      (schedule) => schedule.missed_count >= threshold
    );

    if (missedReminders.length === 0) continue;

    // Fetch family contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id);

    if (contactsError || !contacts || contacts.length === 0) {
      console.error("No contacts found for user:", user.id, contactsError);
      continue;
    }

    for (const reminder of missedReminders) {
      const message = `Alert: ${user.name} has missed ${reminder.missed_count} doses of ${reminder.medicine_name} (${reminder.dosage}). Please check on them.`;

      for (const contact of contacts) {
        if (!contact.phone) continue;

        try {
          const response = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: contact.phone,
          });

          await supabase.from("sms_logs").insert({
            user_id: user.id,
            message,
            status: "sent",
            family_sms_type: "family_notification",
            provider_response: JSON.stringify(response),
          });
        } catch (error) {
          console.error("Error sending SMS to contact:", contact.phone, error);
          await supabase.from("sms_logs").insert({
            user_id: user.id,
            message,
            status: "failed",
            family_sms_type: "family_notification",
            provider_response: JSON.stringify(error),
          });
        }
      }
    }
  }
};