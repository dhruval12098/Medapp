import type { NextApiRequest, NextApiResponse } from "next";
import { scheduleSMSReminders } from "@/lib/sms-scheduler";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    await scheduleSMSReminders();
    return res.status(200).json({ message: "SMS scheduling triggered successfully" });
  } catch (error: any) {
    console.error("Error in test-sms API:", error.message || error);
    return res.status(500).json({ 
      error: "Failed to trigger SMS scheduling",
      details: error.message || "Unknown error"
    });
  }
}