import { ReminderEvent, sendSMSReminder } from './reminder-service';

interface StoredReminder {
  eventId: string;
  phoneNumber: string;
  reminderTime: string;
  event: ReminderEvent;
  sent: boolean;
}

class ReminderManager {
  private static instance: ReminderManager;
  private reminders: StoredReminder[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadReminders();
    this.startChecking();
  }

  public static getInstance(): ReminderManager {
    if (!ReminderManager.instance) {
      ReminderManager.instance = new ReminderManager();
    }
    return ReminderManager.instance;
  }

  private loadReminders() {
    const stored = localStorage.getItem('scheduled_reminders');
    if (stored) {
      this.reminders = JSON.parse(stored).map((reminder: StoredReminder) => ({
        ...reminder,
        reminderTime: new Date(reminder.reminderTime).toISOString(),
        event: {
          ...reminder.event,
          date: new Date(reminder.event.date)
        }
      }));
    }
  }

  private saveReminders() {
    localStorage.setItem('scheduled_reminders', JSON.stringify(this.reminders));
  }

  private startChecking() {
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 60000);
  }

  private async checkReminders() {
    const now = new Date();
    const pendingReminders = this.reminders.filter(
      reminder => !reminder.sent && new Date(reminder.reminderTime) <= now
    );

    for (const reminder of pendingReminders) {
      const success = await sendSMSReminder(reminder.event, reminder.phoneNumber);
      if (success) {
        reminder.sent = true;
        this.saveReminders();
      }
    }

    // Clean up old reminders (keep for 24 hours after event)
    this.reminders = this.reminders.filter(reminder => {
      const eventTime = new Date(`${reminder.event.date.toDateString()} ${reminder.event.time}`);
      return now.getTime() - eventTime.getTime() < 24 * 60 * 60 * 1000;
    });
    this.saveReminders();
  }

  public scheduleReminder(event: ReminderEvent, phoneNumber: string): boolean {
    const eventDateTime = new Date(`${event.date.toDateString()} ${event.time}`);
    const reminderTime = new Date(eventDateTime.getTime() - 15 * 60000); // 15 minutes before
    const now = new Date();

    if (reminderTime > now) {
      this.reminders.push({
        eventId: event.id,
        phoneNumber,
        reminderTime: reminderTime.toISOString(),
        event,
        sent: false
      });
      this.saveReminders();
      return true;
    }

    return false;
  }

  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

export const reminderManager = ReminderManager.getInstance(); 