/**
 * The time savers: the jobs a business would hand over, each with an example
 * and a work sample that shows it done.
 *
 * Shown twice, which is why it lives here: as the rows on the Bold front page
 * (BoldHero, where a row opens its sample in a drawer) and as the rows of the
 * main menu tile under Clean and Homey (IndustriesTile, where a row scrolls
 * the window down to its sample in WorkPanel). The order is the order a
 * client should read them in, strongest first.
 *
 * A row's `name` is also its key: the tile asks WorkPanel for a sample by it.
 */

import type { Component } from 'svelte';
import CriticalResultsBoard from '$lib/components/CriticalResultsBoard.svelte';
import LogKingBoard from '$lib/components/LogKingBoard.svelte';
import TenantBillingBoard from '$lib/components/TenantBillingBoard.svelte';
import BenefitsBoard from '$lib/components/BenefitsBoard.svelte';
import PaymentLabelBoard from '$lib/components/PaymentLabelBoard.svelte';
import KpiBoard from '$lib/components/KpiBoard.svelte';
import DesignBoard from '$lib/components/DesignBoard.svelte';

/** A plain stroke, or the icon's body (tinted) or its accent (solid pop). */
export type Stroke = string | { d: string; tone: 'body' | 'pop' };

export interface Job {
	name: string;
	proof: string;
	tag: 'Reporting' | 'Databases' | 'Workflows' | 'Design';
	icon: Stroke[];
	/** Its work sample: a drawer under the Bold row, a sheet in the Clean and Homey window. */
	infographic?: Component;
}

export const JOBS: Job[] = [
	{
		name: 'Customer history & automated billing',
		proof: 'Example: Tracking tenant and business-name history across leased office space, and automating the rent invoices.',
		tag: 'Databases',
		infographic: TenantBillingBoard,
		icon: [
			{ d: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', tone: 'body' },
			'M11 10a2 2 0 1 1-4 0a2 2 0 1 1 4 0',
			'M5.5 16.5a3.5 3.5 0 0 1 7 0',
			'M15 9h4',
			'M15 12.5h4',
			'M15 16h2.5'
		]
	},
	{
		name: 'Reconciliation & error checks',
		proof: 'Example: Catching 401k matching errors, and reconciling insurance benefits for HR.',
		tag: 'Reporting',
		infographic: BenefitsBoard,
		icon: [
			{ d: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', tone: 'body' },
			'm7.5 8 1.5 1.5L12 6.5',
			'M14 8h3',
			'm7.5 13 1.5 1.5 3-3',
			'M14 13h3',
			'm7.5 18 1.5 1.5 3-3',
			'M14 18h3'
		]
	},
	{
		name: 'Business & customer notifications',
		proof: 'Example: Flagging critical CT findings, like strokes, and alerting hospital staff right away inside their EHR.',
		tag: 'Workflows',
		infographic: CriticalResultsBoard,
		icon: [
			{ d: 'M6 9a6 6 0 0 1 12 0c0 6 3 8 3 8H3s3-2 3-8', tone: 'body' },
			'M10.3 21a1.94 1.94 0 0 0 3.4 0',
			'M2 7.5a10 10 0 0 1 2.2-4.5',
			'M22 7.5A10 10 0 0 0 19.8 3',
			{ d: 'M20.5 11a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0', tone: 'pop' }
		]
	},
	{
		name: 'Payment & expense labeling',
		proof: 'Example: Auto-labeling payment types.',
		tag: 'Workflows',
		infographic: PaymentLabelBoard,
		icon: [
			{ d: 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', tone: 'body' },
			'M2 7.5h20',
			'M5.5 11.5h4',
			{ d: 'M13 16h6l3 2.75-3 2.75h-6Z', tone: 'pop' }
		]
	},
	{
		name: 'KPI reporting at a glance',
		proof: 'Example: Building Epic SlicerDicer reports for department managers, doctors and nurses.',
		tag: 'Reporting',
		infographic: KpiBoard,
		icon: [
			{ d: 'M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', tone: 'body' },
			'M2 7.5h20',
			'M11 14a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
			{ d: 'M8 11a3 3 0 0 1 3 3H8Z', tone: 'pop' },
			'M14.5 18v-3',
			'M18 18v-6'
		]
	},
	{
		name: 'UI/UX design',
		proof: 'Example: Booking check-in, customer receipts and reporting dashboards.',
		tag: 'Design',
		infographic: DesignBoard,
		icon: [
			{ d: 'M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z', tone: 'body' },
			'M2 8.5h20',
			'M5.5 12.5h6',
			'M5.5 16h4',
			{ d: 'M14.5 12h4.5v4.5h-4.5Z', tone: 'pop' }
		]
	},
	{
		name: 'Full-stack hosting, data tracking & styled reports',
		proof: 'Example: Designing, building and running LogKing on my own: a live product with automatic uploads, a database, leaderboards and shareable reports.',
		tag: 'Reporting',
		infographic: LogKingBoard,
		icon: [
			{ d: 'M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', tone: 'body' },
			'M7 7h6',
			'M7 11h8',
			'M7 15h4',
			{ d: 'M20 17.5a3 3 0 1 1-6 0a3 3 0 1 1 6 0', tone: 'pop' },
			'm19.2 19.7 2.3 2.3'
		]
	}
];
