/**
 * Booking times for the free call. Jerrod takes calls from 7 AM to 9 PM
 * Eastern, every day but the US federal holidays. The visitor picks from
 * those hours shown on their own clock, and the email gives the time in
 * Eastern first, with theirs beside it.
 *
 * Days are 'YYYY-MM-DD' strings and mean the date in Eastern time, since
 * that is the calendar the call lands on. Times are 'HH:MM' in Eastern.
 */

export const EASTERN = 'America/New_York';

const FIRST_HOUR = 7;
const LAST_HOUR = 21;

export interface Slot {
	/** The Eastern time, 'HH:MM'. */
	value: string;
	/** The same moment on the visitor's clock, with a weekday when the date differs. */
	label: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** How far `timeZone` is ahead of UTC at `at`, in milliseconds. */
function offset(at: Date, timeZone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	}).formatToParts(at);
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
	const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
	return wall - Math.floor(at.getTime() / 60_000) * 60_000;
}

/**
 * The moment a wall-clock time in Eastern falls on. The offset is taken
 * twice so a time near a daylight-saving change settles on the right side.
 */
export function easternInstant(day: string, time: string): Date {
	const [y, m, d] = day.split('-').map(Number);
	const [h, mi] = time.split(':').map(Number);
	const wall = Date.UTC(y, m - 1, d, h, mi);
	const first = wall - offset(new Date(wall), EASTERN);
	return new Date(wall - offset(new Date(first), EASTERN));
}

/**
 * The zone as people say it ("Pacific Time", "Central European Time"),
 * rather than its database city, which is often not where the visitor
 * lives. Zones with no common name come back as an offset, like "GMT+3".
 */
export function zoneName(zone: string): string {
	return (
		new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longGeneric' })
			.formatToParts(new Date())
			.find((p) => p.type === 'timeZoneName')?.value ?? zone
	);
}

/** Today's date in Eastern, 'YYYY-MM-DD'. */
export function easternToday(): string {
	const now = new Date(Date.now() + offset(new Date(), EASTERN));
	return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

/** A date as words, read in UTC so the visitor's zone can't shift it a day. */
function longDate(day: string): string {
	return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', {
		timeZone: 'UTC',
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Every half hour of Jerrod's day on `day` (today when no day is picked),
 * labelled in the visitor's zone. On today itself, times already gone are
 * left out.
 */
export function callSlots(day: string, zone: string): Slot[] {
	const today = easternToday();
	const on = day || today;
	const now = Date.now();
	const slots: Slot[] = [];
	for (let minutes = FIRST_HOUR * 60; minutes <= LAST_HOUR * 60; minutes += 30) {
		const value = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
		const at = easternInstant(on, value);
		if (day === today && at.getTime() <= now) continue;
		const time = at.toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' });
		// A visitor far enough east or west sees some of the day on another date.
		const theirDay = at.toLocaleDateString('en-CA', { timeZone: zone });
		const label = theirDay === on ? time : `${time} (${at.toLocaleDateString('en-US', { timeZone: zone, weekday: 'short' })})`;
		slots.push({ value, label });
	}
	return slots;
}

function nthWeekday(year: number, month: number, weekday: number, n: number): number {
	const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
	return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
}

function lastWeekday(year: number, month: number, weekday: number): number {
	const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	const last = new Date(Date.UTC(year, month, days)).getUTCDay();
	return days - ((last - weekday + 7) % 7);
}

/** The US federal holiday on `day`, by name, or null. Fixed-date ones fall on the date itself. */
export function holiday(day: string): string | null {
	const [y, m, d] = day.split('-').map(Number);
	const month = m - 1;
	const list: [number, number, string][] = [
		[0, 1, "New Year's Day"],
		[0, nthWeekday(y, 0, 1, 3), 'Martin Luther King Jr. Day'],
		[1, nthWeekday(y, 1, 1, 3), "Presidents' Day"],
		[4, lastWeekday(y, 4, 1), 'Memorial Day'],
		[5, 19, 'Juneteenth'],
		[6, 4, 'Independence Day'],
		[8, nthWeekday(y, 8, 1, 1), 'Labor Day'],
		[9, nthWeekday(y, 9, 1, 2), 'Columbus Day'],
		[10, 11, 'Veterans Day'],
		[10, nthWeekday(y, 10, 4, 4), 'Thanksgiving'],
		[11, 25, 'Christmas Day']
	];
	return list.find(([hm, hd]) => hm === month && hd === d)?.[2] ?? null;
}

/** The pick as the email says it: Eastern first, the visitor's clock beside it. */
export function describeCall(day: string, time: string, zone: string): string {
	if (!time) return day ? `${longDate(day)}, any time` : '';
	const at = easternInstant(day || easternToday(), time);
	const clock = (timeZone: string, withDay: boolean) =>
		at.toLocaleString('en-US', {
			timeZone,
			...(withDay ? { weekday: 'long', month: 'long', day: 'numeric' } : {}),
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'short'
		});
	const eastern = clock(EASTERN, !!day);
	// A visitor whose clock reads the same as Eastern needs no second time.
	if (offset(at, zone) === offset(at, EASTERN)) return day ? eastern : `any day at ${eastern}`;
	// Their date is repeated only when the hours between zones put the call
	// on a different day for them.
	const sameDay = at.toLocaleDateString('en-CA', { timeZone: EASTERN }) === at.toLocaleDateString('en-CA', { timeZone: zone });
	const when = `${eastern} (${clock(zone, !!day && !sameDay)} their time)`;
	return day ? when : `any day at ${when}`;
}
