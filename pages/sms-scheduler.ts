import type { NextApiRequest, NextApiResponse } from 'next'
import { scheduleSMSReminders } from '@/lib/sms-scheduler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await scheduleSMSReminders()
    res.status(200).json({ message: 'SMS scheduler ran successfully' })
  } catch (error) {
    console.error('Error running SMS scheduler:', error)
    res.status(500).json({ error: 'Failed to run SMS scheduler' })
  }
}