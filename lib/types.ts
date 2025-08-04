export interface User {
  id: string;
  name: string;
  phone?: string;
  smsNotificationsEnabled: boolean;
  smsReminderTime?: string;
  missedReminderThreshold?: number;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: "daily" | "weekly";
  times: string[];
  instructions?: string;
  active: boolean;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  status: "pending" | "taken" | "missed";
  takenTime?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  primary: boolean;
  createdAt: string;
}