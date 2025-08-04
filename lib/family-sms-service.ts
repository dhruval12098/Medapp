import { supabase } from "./supabase";
import { createTwilioClient } from "./twilio-client";
import { Contact } from "./types";

export const sendInstantSMS = async (
  userId: string,
  medicineName: string,
  dosage: string
): Promise<void> => {
  const { data: user, error: userError } = await supabase
    .from("user_profiles")
    .select("name, sms_notifications_enabled")
    .eq("id", userId)
    .single();

  if (userError || !user || !user.sms_notifications_enabled) {
    console.error("User not found or SMS notifications disabled:", userError);
    return;
  }

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId);

  if (contactsError || !contacts || contacts.length === 0) {
    console.error("No contacts found:", contactsError);
    return;
  }

  const client = createTwilioClient();
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const message = `Alert: ${user.name} has dismissed a reminder for ${medicineName} (${dosage}). Please check on them.`;

  for (const contact of contacts) {
    if (!contact.phone) continue;

    try {
      const response = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: contact.phone,
      });

      await supabase.from("sms_logs").insert({
        user_id: userId,
        message,
        status: "sent",
        family_sms_type: "family_notification",
        provider_response: JSON.stringify(response),
      });
    } catch (error) {
      console.error("Error sending instant SMS:", error);
      await supabase.from("sms_logs").insert({
        user_id: userId,
        message,
        status: "failed",
        family_sms_type: "family_notification",
        provider_response: JSON.stringify(error),
      });
    }
  }
};