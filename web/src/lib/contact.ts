/**
 * The one inbox every contact path on the site writes to, and the drafts that
 * open on it.
 *
 * A `mailto:` link only works for a visitor whose computer has a mail app set
 * up, and webmail users mostly do not: the click does nothing. So every
 * contact path also offers the same draft in Gmail and Outlook on the web,
 * whose compose pages take the address, subject and body in the URL. Nothing
 * is posted or stored either way.
 */
export const CONTACT = 'jerrod@jerrodtanner.com';

export interface Drafts {
	mailto: string;
	gmail: string;
	outlook: string;
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
