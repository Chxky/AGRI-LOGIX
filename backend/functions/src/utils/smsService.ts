import * as functions from 'firebase-functions';
import { defineString } from 'firebase-functions/params';

const AT_API_URL = 'https://api.africastalking.com/version1/messaging';
const SENDER_ID = 'AgriLogix';

const atUsername = defineString('AT_USERNAME', { default: '' });
const atApiKey = defineString('AT_API_KEY', { default: '' });

function getConfig(): { username: string; apiKey: string } | null {
  const username = atUsername.value() || process.env.AT_USERNAME || '';
  const apiKey = atApiKey.value() || process.env.AT_API_KEY || '';
  if (username && apiKey) return { username, apiKey };
  return null;
}

function formatPhone(phone: string): string {
  let p = phone.replace(/[^+\d]/g, '');
  if (p.startsWith('0')) p = '+263' + p.slice(1);
  if (p.startsWith('263') && !p.startsWith('+')) p = '+' + p;
  if (p.startsWith('+263') && p.length === 13) return p;
  return phone;
}

export async function sendSms(to: string, message: string): Promise<boolean> {
  const config = getConfig();
  if (!config) {
    functions.logger.warn('Africa\'s Talking not configured — SMS not sent', { to });
    return false;
  }

  try {
    const recipient = formatPhone(to);
    const body = new URLSearchParams({
      username: config.username,
      to: recipient,
      message,
      from: SENDER_ID,
    });

    const response = await fetch(AT_API_URL, {
      method: 'POST',
      headers: {
        apiKey: config.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const result = await response.json() as any;

    if (result.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
      functions.logger.info('SMS sent', { to: recipient, messageId: result.SMSMessageData.Recipients[0].messageId });
      return true;
    }

    functions.logger.warn('SMS send returned non-success', { to: recipient, result });
    return false;
  } catch (error) {
    functions.logger.error('SMS send error', { to, error });
    return false;
  }
}

export async function sendBulkSms(recipients: string[], message: string): Promise<number> {
  let sent = 0;
  for (const to of recipients) {
    const ok = await sendSms(to, message);
    if (ok) sent++;
  }
  return sent;
}

export function buildRedemptionSms(farmerName: string, bagId: string, variety: string): string {
  return `Pfumvudza Confirmed: Bag ${bagId} (${variety}) redeemed successfully. Thank you for participating in the Pfumvudza Input Scheme. -AgriLogix`;
}

export function buildDistributionSms(district: string, bagCount: number): string {
  return `Alert: ${bagCount} seed bags dispatched to ${district}. Visit your nearest distribution point to collect. -AgriLogix`;
}

export function buildFlaggedSms(bagId: string, reason: string): string {
  return `ALERT: Bag ${bagId} flagged as counterfeit. Reason: ${reason}. Immediate investigation required. -AgriLogix`;
}

export function buildRegistrationSms(name: string): string {
  return `Welcome to Pfumvudza, ${name}! You are now registered. Dial *123# to redeem your seed bags. -AgriLogix`;
}
