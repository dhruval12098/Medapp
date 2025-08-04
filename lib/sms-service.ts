import { supabase } from "./supabase";
import { User } from "./types";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export const sendSMS = async (
  user: User,
  message: string,
  familySmsType: "family_notification" | null = null
): Promise<void> => {
  // Only run Twilio code in a server environment
  if (typeof window !== "undefined") {
    console.warn("SMS sending is disabled in browser environment");
    return;
  }

  if (!user.phone || !user.smsNotificationsEnabled) {
    return;
  }

  try {
    const client = require("twilio")(accountSid, authToken);
    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: user.phone,
    });

    await supabase.from("sms_logs").insert({
      user_id: user.id,
      message,
      status: "sent",
      family_sms_type: familySmsType,
      provider_response: JSON.stringify(response),
    });
  } catch (error) {
    await supabase.from("sms_logs").insert({
      user_id: user.id,
      message,
      status: "failed",
      family_sms_type: familySmsType,
      provider_response: JSON.stringify(error),
    });
    throw error;
  }
};