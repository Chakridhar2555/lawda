export interface ReminderEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: string;
  description: string;
  location?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export async function sendSMSReminder(event: ReminderEvent, phoneNumber: string) {
  try {
    const response = await fetch('/api/reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event, phoneNumber }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

export function scheduleReminder(event: ReminderEvent, phoneNumber: string) {
  const eventDateTime = new Date(`${event.date.toDateString()} ${event.time}`);
  const reminderTime = new Date(eventDateTime.getTime() - 15 * 60000); // 15 minutes before
  const now = new Date();

  if (reminderTime > now) {
    const timeoutMs = reminderTime.getTime() - now.getTime();
    setTimeout(() => {
      sendSMSReminder(event, phoneNumber);
    }, timeoutMs);

    return true;
  }

  return false;
} 