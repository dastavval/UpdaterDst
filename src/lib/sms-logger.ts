export interface SmsLogEntry {
  id: string;
  to: string;
  text: string;
  patternId?: number | string | null;
  patternArgs?: string | null;
  apiType: string;
  mode: 'real' | 'demo';
  success: boolean;
  responseText: string;
  timestamp: string;
  source?: 'server' | 'client';
  errorCode?: string;
}

export async function fetchSmsHistory(): Promise<SmsLogEntry[]> {
  try {
    const res = await fetch('/api/sms/history');
    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  } catch (e) {
    console.error('Failed to fetch SMS history:', e);
    return [];
  }
}

export async function clearSmsHistory(): Promise<boolean> {
  try {
    const res = await fetch('/api/sms/history/clear', { method: 'POST' });
    return res.ok;
  } catch (e) {
    console.error('Failed to clear SMS history:', e);
    return false;
  }
}

export async function logClientSmsEvent(entry: Partial<SmsLogEntry>): Promise<void> {
  try {
    await fetch('/api/sms/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (e) {
    console.warn('Could not post client SMS log event:', e);
  }
}
