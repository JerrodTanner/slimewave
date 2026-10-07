/**
 * The one inbox every contact path on the site writes to, and the ways a
 * message gets there.
 *
 * The first way is `send`, which posts to /api/contact: the server saves the
 * message and emails it on, so it works whatever mail setup the visitor has.
 * If that fails, the drafts below are the fallback. A `mailto:` link only
 * works for a visitor whose computer has a mail app set up, and webmail users
 * mostly do not, so the same draft is also offered in Gmail and Outlook on
 * the web, whose compose pages take the address, subject and body in the URL.
 */
export const CONTACT = 'jerrod@jerrodtanner.com';

/** What a contact form is doing, for its button and status line. */
export type SendState = 'idle' | 'sending' | 'sent' | 'failed';

/**
 * Close enough to what the server accepts to catch a typo before the round
 * trip: something, an @, something, a dot, something, and no spaces.
 */
export const isEmail = (value: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.trim());

/**
 * Posts a message or a project brief to the inbox. `website` is the
 * honeypot field, passed through as the form found it. Resolves to null on
 * success, or to a sentence the visitor can read on failure.
 */
export async function send(
	kind: 'message' | 'brief',
	email: string,
	message: string,
	website = ''
): Promise<string | null> {
	try {
		const res = await fetch('/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ kind, email: email.trim(), message: message.trim(), website })
		});
		if (res.ok) return null;
		const body = await res.json().catch(() => null);
		return body?.error ?? 'The message did not go through.';
	} catch {
		return 'The message did not go through. Check your connection.';
	}
}

export interface Drafts {
	mailto: string;
	gmail: string;
	outlook: string;
}

/**
 * A US phone number, in any of the ways people type one: bare digits, dashes,
 * dots, spaces, the area code in brackets, and an optional +1 or 1 in front.
 * The area code and the exchange can't start with 0 or 1, as in the real
 * numbering plan, so "123-456-7890" is turned away.
 */
const US_PHONE = /^\s*(?:\+?1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?[2-9]\d{2}[\s.-]?\d{4}\s*$/;

export const isUsPhone = (value: string) => US_PHONE.test(value);

/**
 * Formats a US number as it is typed: "5552345678" becomes "(555) 234-5678",
 * and a leading 1 becomes "+1 ". A US area code never starts with 1, so a
 * leading 1 is always the country code. Extra digits past ten are dropped.
 */
export function formatUsPhone(raw: string): string {
	let digits = raw.replace(/\D/g, '');
	let prefix = '';
	if (digits[0] === '1') {
		prefix = '+1 ';
		digits = digits.slice(1);
	}
	digits = digits.slice(0, 10);
	if (!digits) return prefix.trim();
	if (digits.length < 4) return `${prefix}(${digits}`;
	if (digits.length < 7) return `${prefix}(${digits.slice(0, 3)}) ${digits.slice(3)}`;
	return `${prefix}(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** A calendar invite to the inbox above, in Google Calendar or Outlook on the web. */
export interface Invites {
	google: string;
	outlook: string;
}

/**
 * The same meeting as a ready-made calendar event with CONTACT as the guest.
 * The visitor's calendar sends the invite, so a request needs no booking
 * service and no endpoint; `start` is in the visitor's own time zone.
 */
export function invites(start: Date, minutes: number, title: string, details: string): Invites {
	const end = new Date(start.getTime() + minutes * 60_000);
	// Google wants UTC in its compact form, Outlook an ISO string.
	const compact = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
	const t = encodeURIComponent(title);
	const de = encodeURIComponent(details);
	const to = encodeURIComponent(CONTACT);
	return {
		google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${t}&dates=${compact(start)}/${compact(end)}&details=${de}&add=${to}`,
		outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${t}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${de}&to=${to}`
	};
}

/** The same draft three ways: the mail app, Gmail, and Outlook on the web. */
export function drafts(subject: string, body: string): Drafts {
	const to = encodeURIComponent(CONTACT);
	const su = encodeURIComponent(subject);
	const bo = encodeURIComponent(body);
	return {
		mailto: `mailto:${CONTACT}?subject=${su}&body=${bo}`,
		gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bo}`,
		outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${su}&body=${bo}`
	};
}
