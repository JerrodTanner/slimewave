/**
 * The design examples: client pages first (screenshots in static/samples/),
 * then this site's own main menu in two of its styles (static/designs/,
 * captured from the site). Each says what the page was designed to do.
 *
 * Shown in two places, which is why it lives here: the UI/UX row's gallery
 * on the Bold front page (DesignBoard) and the "View sample pages" dialog on
 * /plan. Add a page by dropping its image in one of those folders and
 * listing it below, in the order it should be browsed.
 */
export interface Design {
	src: string;
	/** The project, or "This site · <style>". */
	project: string;
	title: string;
	/** What the page is designed for, in a sentence or two. */
	about: string;
}

export const DESIGNS: Design[] = [
	{
		src: '/samples/lk-front.jpg',
		project: 'LogKing',
		title: 'Front page',
		about: 'A leaderboard of top players up front, to build excitement and keep people coming back, with a quick-start guide and downloads beside it so a new user can upload their first log in minutes.'
	},
	{
		src: '/samples/lk-rankings.jpg',
		project: 'LogKing',
		title: 'Rankings',
		about: 'Filters for raid, boss, phase, class and spec, and a damage or healing switch, so every player can find exactly where they stand. A short note under the table explains how the score is worked out.'
	},
	{
		src: '/samples/lk-players.jpg',
		project: 'LogKing',
		title: 'Player profile',
		about: 'One player’s own page: their best result on every boss, with kill counts and fastest times, so progress across a season is easy to follow.'
	},
	{
		src: '/samples/ba-eventcheckin.png',
		project: 'Booking app',
		title: 'Event manifest and check-in',
		about: 'Built for front-desk staff on a busy day: checked-in, not-arrived and cancelled counts at the top, search by name, and a one-click check-in on every booking.'
	},
	{
		src: '/samples/redeemable.png',
		project: 'Vacation certificate',
		title: 'Customer receipt',
		about: 'A customer-facing receipt with the redemption details front and centre, branded for the resort, and every way to get in touch along the bottom.'
	},
	{
		src: '/designs/style-street.jpg',
		project: 'This site · Bold',
		title: 'Street',
		about: 'The default landing page: one bold headline, plenty of space, and a clear path down to the examples, for a business owner who has a few seconds to decide.'
	},
	{
		src: '/designs/style-glass.jpg',
		project: 'This site · Homey',
		title: 'Tile & Glass',
		about: 'The other side of the same site: warm, handmade furniture (majolica tile, leaded-glass doors) around a 3D hallway you can walk through to navigate.'
	}
];
