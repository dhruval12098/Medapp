import { supabase } from "./supabase";

// Define the expected type for the medicines join
interface ReminderAttempt {
  medicine_id: string;
  missed_count: number;
  medicines: { name: string } | null; // Single object, not an array
}

export const incrementMissedReminder = async (
  scheduleId: string,
  medicineId: string,
  userId: string
): Promise<void> => {
  try {
    const { data: existingAttempt, error: fetchError } = await supabase
      .from("reminder_attempts")
      .select("*")
      .eq("schedule_id", scheduleId)
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching reminder attempt:", fetchError);
      throw new Error(`Failed to fetch reminder attempt: ${fetchError.message}`);
    }

    if (existingAttempt) {
      const { error: updateError } = await supabase
        .from("reminder_attempts")
        .update({
          missed_count: existingAttempt.missed_count + 1,
          last_missed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAttempt.id);

      if (updateError) {
        console.error("Error updating reminder attempt:", updateError);
        throw new Error(`Failed to update reminder attempt: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await supabase.from("reminder_attempts").insert({
        user_id: userId,
        medicine_id: medicineId,
        schedule_id: scheduleId,
        missed_count: 1,
        last_missed_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Error inserting reminder attempt:", insertError);
        throw new Error(`Failed to insert reminder attempt: ${insertError.message}`);
      }
    }
  } catch (error) {
    console.error("Error in incrementMissedReminder:", error);
    throw error;
  }
};

export const resetMissedReminder = async (
  scheduleId: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("reminder_attempts")
      .update({
        missed_count: 0,
        last_missed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("schedule_id", scheduleId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error resetting reminder attempt:", error);
      throw new Error(`Failed to reset reminder attempt: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in resetMissedReminder:", error);
    throw error;
  }
};

export const getMissedReminders = async (
  userId: string,
  threshold: number = 3
): Promise<
  Array<{
    medicine_id: string;
    missed_count: number;
    medicine_name: string;
  }>
> => {
  try {
    const { data, error } = await supabase
      .from("reminder_attempts")
      .select(`
        medicine_id,
        missed_count,
        medicines!inner (
          name
        )
      `)
      .eq("user_id", userId)
      .gte("missed_count", threshold)
      .returns<ReminderAttempt[]>();

    if (error) {
      console.error("Error fetching missed reminders:", error);
      throw new Error(`Failed to fetch missed reminders: ${error.message}`);
    }

    return data.map((item) => ({
      medicine_id: item.medicine_id,
      missed_count: item.missed_count,
      medicine_name: item.medicines?.name ?? "Unknown Medicine",
    }));
  } catch (error) {
    console.error("Error in getMissedReminders:", error);
    throw error;
  }
};