import { supabase } from "./supabase"
import type { Medicine, ScheduleItem, Contact, User } from "./types"
import { incrementMissedReminder, resetMissedReminder } from "./reminder-tracker"

// Get current user
const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error("User not authenticated")
  return user
}

// Get user profile
export const getUserProfile = async (): Promise<User> => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    smsNotificationsEnabled: data.sms_notifications_enabled,
    smsReminderTime: data.sms_reminder_time,
    missedReminderThreshold: data.missed_reminder_threshold || 3,
    createdAt: data.created_at,
  }
}

// Update user profile
export const updateUserProfile = async (profile: Partial<User>): Promise<void> => {
  const user = await getCurrentUser()
  const { error } = await supabase
    .from("user_profiles")
    .update({
      name: profile.name,
      phone: profile.phone,
      sms_notifications_enabled: profile.smsNotificationsEnabled,
      sms_reminder_time: profile.smsReminderTime,
      missed_reminder_threshold: profile.missedReminderThreshold,
    })
    .eq("id", user.id)

  if (error) throw error
}

// Medicine functions
export const addMedicine = async (medicine: Omit<Medicine, "id" | "createdAt">): Promise<void> => {
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from("medicines")
    .insert({
      user_id: user.id,
      name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      times: medicine.times,
      instructions: medicine.instructions,
      active: medicine.active,
    })
    .select()
    .single()

  if (error) throw error

  // Generate schedule items for this medicine
  await generateScheduleItems(data)
}

export const getMedicines = async (): Promise<Medicine[]> => {
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    dosage: item.dosage,
    frequency: item.frequency as "daily" | "weekly",
    times: item.times,
    instructions: item.instructions || "",
    active: item.active,
    createdAt: item.created_at,
  }))
}

export const deleteMedicine = async (id: string): Promise<void> => {
  const user = await getCurrentUser()

  // Delete medicine and related schedule items (CASCADE will handle schedule)
  const { error } = await supabase.from("medicines").delete().eq("id", id).eq("user_id", user.id)

  if (error) throw error
}

export const toggleMedicineActive = async (id: string, active: boolean): Promise<void> => {
  const user = await getCurrentUser()

  const { error } = await supabase.from("medicines").update({ active }).eq("id", id).eq("user_id", user.id)

  if (error) throw error
}

// Schedule functions
const generateScheduleItems = async (medicine: any): Promise<void> => {
  if (!medicine.active) return

  const user = await getCurrentUser()
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 30) // Generate for next 30 days

  const scheduleItems = []

  for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
    if (medicine.frequency === "weekly" && date.getDay() !== today.getDay()) {
      continue // Only same day of week for weekly medicines
    }

    for (const time of medicine.times) {
      const [hours, minutes] = time.split(":").map(Number)
      const scheduledTime = new Date(date)
      scheduledTime.setHours(hours, minutes, 0, 0)

      // Don't create items for past times today
      if (scheduledTime <= new Date() && date.toDateString() === today.toDateString()) {
        continue
      }

      scheduleItems.push({
        user_id: user.id,
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        dosage: medicine.dosage,
        scheduled_time: scheduledTime.toISOString(),
        status: "pending" as const,
      })
    }
  }

  if (scheduleItems.length > 0) {
    const { error } = await supabase.from("schedule").insert(scheduleItems)

    if (error) throw error
  }
}

export const getTodaySchedule = async (): Promise<ScheduleItem[]> => {
  const user = await getCurrentUser()
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const { data, error } = await supabase
    .from("schedule")
    .select("*")
    .eq("user_id", user.id)
    .gte("scheduled_time", startOfDay.toISOString())
    .lt("scheduled_time", endOfDay.toISOString())
    .order("scheduled_time", { ascending: true })

  if (error) throw error

  return data.map((item) => ({
    id: item.id,
    medicineId: item.medicine_id,
    medicineName: item.medicine_name,
    dosage: item.dosage,
    scheduledTime: item.scheduled_time,
    status: item.status as "pending" | "taken" | "missed",
    takenTime: item.taken_time,
    createdAt: item.created_at,
  }))
}

export const getScheduleHistory = async (period: "week" | "month"): Promise<ScheduleItem[]> => {
  const user = await getCurrentUser()
  const today = new Date()
  const startDate = new Date(today)

  if (period === "week") {
    startDate.setDate(today.getDate() - 7)
  } else {
    startDate.setDate(today.getDate() - 30)
  }

  const endDate = new Date(today)
  endDate.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from("schedule")
    .select("*")
    .eq("user_id", user.id)
    .gte("scheduled_time", startDate.toISOString())
    .lte("scheduled_time", endDate.toISOString())
    .neq("status", "pending")
    .order("scheduled_time", { ascending: false })

  if (error) throw error

  return data.map((item) => ({
    id: item.id,
    medicineId: item.medicine_id,
    medicineName: item.medicine_name,
    dosage: item.dosage,
    scheduledTime: item.scheduled_time,
    status: item.status as "pending" | "taken" | "missed",
    takenTime: item.taken_time,
    createdAt: item.created_at,
  }))
}

export const markMedicineAsTaken = async (scheduleId: string): Promise<void> => {
  const user = await getCurrentUser()

  const { error } = await supabase
    .from("schedule")
    .update({
      status: "taken",
      taken_time: new Date().toISOString(),
    })
    .eq("id", scheduleId)
    .eq("user_id", user.id)

  if (error) throw error

  // Reset missed reminder count
  await resetMissedReminder(scheduleId, user.id)
}

export const markMedicineAsMissed = async (scheduleId: string): Promise<void> => {
  const user = await getCurrentUser()

  const { data: schedule, error: scheduleError } = await supabase
    .from("schedule")
    .update({
      status: "missed",
      taken_time: null,
    })
    .eq("id", scheduleId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (scheduleError) throw scheduleError

  // Increment missed reminder count
  await incrementMissedReminder(scheduleId, schedule.medicine_id, user.id)
}

// Contact functions
export const addContact = async (contact: Omit<Contact, "id" | "createdAt">): Promise<void> => {
  const user = await getCurrentUser()

  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    relationship: contact.relationship,
    is_primary: contact.primary,
  })

  if (error) throw error
}

export const getContacts = async (): Promise<Contact[]> => {
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false })

  if (error) throw error

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    phone: item.phone,
    email: item.email,
    relationship: item.relationship,
    primary: item.is_primary,
    createdAt: item.created_at,
  }))
}

export const deleteContact = async (id: string): Promise<void> => {
  const user = await getCurrentUser()

  const { error } = await supabase.from("contacts").delete().eq("id", id).eq("user_id", user.id)

  if (error) throw error
}