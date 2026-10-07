<script lang="ts">
	import WorkSheet from './WorkSheet.svelte';

	/**
	 * The tenant billing work sample: leased office space, a tenant database,
	 * and a monthly script that builds and emails every rent invoice. The
	 * twist that earns the mock-up is the cheque signed by a tenant's parent
	 * company, which still has to land on the right tenant.
	 *
	 * The accent is brass, for money, where the other sheets use crimson and
	 * teal.
	 */
	const STEPS = [
		{
			name: 'Tenants are on record',
			line: 'Each tenant’s company, suite, rent and contacts live in one SQL Server database.',
			note: 'SQL Server',
			hot: false
		},
		{
			name: 'Invoices go out monthly',
			line: 'Once a month a Python script builds an invoice for every active tenant and emails it to them.',
			note: 'Python · email',
			hot: false
		},
		{
			name: 'Tenants pay online',
			line: 'An online rent-payment portal takes card and bank payments, and each one is recorded against that tenant’s month automatically.',
			note: 'Online payment portal',
			hot: true
		},
		{
			name: 'The office confirms cheques',
			line: 'An internal web app lets staff mark any tenant paid for any month when a cheque comes in.',
			note: 'Internal web app',
			hot: false
		},
		{
			name: 'Payments find the tenant',
			line: 'Some cheques came from a tenant’s parent company. Every name a tenant pays under is stored, so each cheque is credited to the right account.',
			note: 'Parent-company names',
			hot: true
		}
	];

	/**
	 * One month's payments, standing in for the real ledger. Invented tenants
	 * and companies: the point is the shape of the match, not anybody's rent.
	 * `via` is why a payment from another name still found its tenant, and
	 * `method` is how it arrived: the portal records itself, a cheque is
	 * confirmed by the office.
	 */
	type Method = 'portal' | 'cheque' | null;

	const PAYMENTS: {
		from: string | null;
		tenant: string;
		via: string | null;
		suite: string;
		amount: number;
		method: Method;
		hot: boolean;
	}[] = [
		{ from: 'Brightline Dental PC', tenant: 'Brightline Dental', via: null, suite: '210', amount: 3450, method: 'portal', hot: false },
		{ from: 'Northgate Holdings LLC', tenant: 'Cedar & Pine Accounting', via: 'Parent company', suite: '214', amount: 2980, method: 'cheque', hot: true },
		{ from: 'Lumen Physical Therapy', tenant: 'Lumen Physical Therapy', via: null, suite: '118', amount: 4120, method: 'portal', hot: false },
		{ from: 'Alvarez Family Trust', tenant: 'Alvarez Law Office', via: 'Owner’s trust', suite: '305', amount: 1875, method: 'cheque', hot: false },
		{ from: 'Summit Staffing Inc.', tenant: 'Summit Staffing', via: null, suite: '220', amount: 2640, method: 'portal', hot: false },
		{ from: null, tenant: 'Keystone Insurance', via: null, suite: '302', amount: 2210, method: null, hot: false }
	];

	const PAID_VIA: Record<NonNullable<Method>, string> = { portal: 'Online portal', cheque: 'Cheque' };
	const STATUS: Record<NonNullable<Method>, string> = { portal: 'Auto-recorded', cheque: 'Confirmed by office' };

	const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

	/** "How it was done", one string per paragraph. */
	const STORY = [
		'My team was tasked with holding the tenants of our leased office space accountable for rent. We moved tenant information into a SQL Server database and wrote a Python script that, each month it runs, builds an invoice for every active tenant and emails it to them automatically. Tenants could pay through an online rent-payment portal, which recorded each month’s payment on its own, and we built an internal web app where the office could confirm cheque payments by month.',
		'The difficulty was matching payments: some cheques were written by a tenant’s parent company rather than the tenant itself. So we added a way to store every additional name a tenant and its companies pay under, and each cheque could be credited to the right tenant whoever signed it. With every tenant billed, tracked and held to an accurate record, the company brought in an extra $1 million a year.'
	];
</script>

<!-- The five drawings, on the same 48 grid and duotone as the other sheets. -->
{#snippet stepIcon(i: number)}
	<svg viewBox="0 0 48 48" fill="none" stroke="#1C1A17" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#if i === 0}
			<ellipse cx="20" cy="9" rx="14" ry="5" fill="#DCE6E2" />
			<path d="M6 9v24c0 2.8 6.3 5 14 5s14-2.2 14-5V9" fill="#F6F1E7" />
			<path d="M6 17c0 2.8 6.3 5 14 5s14-2.2 14-5" />
			<path d="M6 25c0 2.8 6.3 5 14 5s14-2.2 14-5" />
			<circle cx="37" cy="33" r="6" fill="#17564F" stroke="none" />
			<path d="M29.5 45c0-4.4 3.4-6.5 7.5-6.5s7.5 2.1 7.5 6.5" fill="#6E9E96" />
		{:else if i === 1}
			<rect x="6" y="9" width="36" height="33" rx="3" fill="#F6F1E7" />
			<path d="M6 17h36" />
			<rect x="6" y="9" width="36" height="8" rx="3" fill="#DCE6E2" />
			<path d="M15 5v8M33 5v8" />
			<path d="M13 24h4M22 24h4M31 24h4M13 31h4M22 31h4" />
			<rect x="30" y="29" width="6" height="5" rx="1" fill="#17564F" stroke="none" />
		{:else if i === 2}
			<!-- The tenant's payment page: a card, and the amount going through. -->
			<rect x="3" y="6" width="42" height="34" rx="3" fill="#F6F1E7" />
			<path d="M3 13h42" />
			<rect x="3" y="6" width="42" height="7" rx="3" fill="#DCE6E2" />
			<circle cx="8" cy="9.5" r="1" fill="#1C1A17" stroke="none" />
			<rect x="9" y="18" width="20" height="13" rx="2" fill="#DCE6E2" />
			<path d="M9 22.5h20" stroke-width="2.2" />
			<path d="M12 27.5h6" />
			<circle cx="37" cy="33" r="8" fill="#8A5A12" stroke="none" />
			<path d="M33.4 33.2l2.6 2.6 4.6-5" stroke="#F6F1E7" stroke-width="2.2" />
		{:else if i === 3}
			<!-- The office's own app: a month of tenants, ticked off by hand. -->
			<rect x="3" y="6" width="42" height="34" rx="3" fill="#F6F1E7" />
			<path d="M3 13h42" />
			<rect x="3" y="6" width="42" height="7" rx="3" fill="#DCE6E2" />
			<rect x="9" y="18" width="5" height="5" rx="1" fill="#17564F" stroke="none" />
			<path d="M18 20.5h12" />
			<rect x="9" y="27" width="5" height="5" rx="1" fill="#17564F" stroke="none" />
			<path d="M18 29.5h16" />
			<path d="M24 40v5M18 45h12" />
			<path d="M10.2 20.6l1.2 1.2 2-2.2M10.2 29.6l1.2 1.2 2-2.2" stroke="#F6F1E7" stroke-width="1.2" />
		{:else}
			<rect x="3" y="7" width="30" height="16" rx="2" fill="#F6F1E7" />
			<path d="M7 12h10M7 17.5h14" />
			<path d="M24 17.5h5" stroke="#8A5A12" stroke-width="2.2" />
			<path d="M18 23v6c0 3 2 5 5 5h4" stroke="#8A5A12" stroke-width="2" />
			<path d="M24 31l3 3-3 3" stroke="#8A5A12" stroke-width="2" />
			<rect x="28" y="24" width="17" height="20" rx="1.5" fill="#DCE6E2" />
			<path d="M32 29h3M38 29h3M32 34h3M38 34h3" />
			<path d="M34.5 44v-5h4v5" fill="#F6F1E7" />
		{/if}
	</svg>
{/snippet}

<WorkSheet
	eyebrow="Property management · tenant billing"
	title="Rent invoices that send themselves"
	deck="Leased office space needed every tenant billed each month and every payment credited to the right tenant. Tenant records moved into a database: one script builds and emails every invoice, online payments record themselves, and the office confirms cheques in a small web app. Billing every tenant accurately, every month, brought the company an extra $1 million a year."
	steps={STEPS}
	icon={stepIcon}
	accent={{ ink: '#8A5A12', rule: '#E6D3B0' }}
	seenTitle="What the office sees"
	story={STORY}
>
	{#snippet seen()}
		<!-- Invented tenants: the columns a rent ledger really has, drawn here. -->
		<div class="screen">
			<div class="chrome">
				<span>Rent received · March</span>
				<span class="chrome-right">6 tenants · 3 online · 2 by cheque</span>
			</div>
			<table class="list">
				<thead>
					<tr>
						<th scope="col">Paid by</th>
						<th scope="col">Credited to</th>
						<th scope="col" class="c-suite">Suite</th>
						<th scope="col" class="c-num">Amount</th>
						<th scope="col" class="c-method">Paid via</th>
						<th scope="col" class="c-status">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each PAYMENTS as row (row.tenant)}
						<tr class:hotrow={row.hot}>
							<td class:none={!row.from}>{row.from ?? 'No payment yet'}</td>
							<td class="c-tenant">
								{row.tenant}
								{#if row.via}<span class="via">{row.via}</span>{/if}
							</td>
							<td class="c-suite">{row.suite}</td>
							<td class="c-num">{money(row.amount)}</td>
							<td class="c-method">{row.method ? PAID_VIA[row.method] : '—'}</td>
							<td class="c-status">
								<span class="status" class:due={!row.method} class:manual={row.method === 'cheque'}>
									{row.method ? STATUS[row.method] : 'Invoice sent'}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<aside class="callout">
			<p class="calloutlabel">The hard part</p>
			<p class="calloutline">A cheque signed by a parent company still lands on the right tenant.</p>
			<p class="calloutsub">
				Every other name a tenant pays under is stored beside it, so the match doesn’t depend on
				who wrote the cheque.
			</p>
		</aside>
	{/snippet}
</WorkSheet>

<style>
	/* The ledger, in the sheet's stock: #C9BFAC and #D9D0BF rules, #EFE9DC
	   chrome, and brass (#8A5A12) for the one match worth pointing at. */
	.chrome,
	.calloutlabel,
	.list thead th,
	.c-num,
	.via,
	.status {
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
	}

	.screen {
		border: 1px solid #C9BFAC;
		border-radius: 6px;
		overflow: hidden;
		background-color: #FFFFFF;
		box-shadow: 0 10px 28px rgba(28, 26, 23, 0.1);
	}

	.chrome {
		display: flex;
		gap: 0.75rem;
		padding: clamp(0.5rem, 0.6cqw, 0.75rem) clamp(0.6rem, 0.9cqw, 1.125rem);
		border-bottom: 1px solid #D9D0BF;
		background-color: #EFE9DC;
		font-size: clamp(0.625rem, 0.65cqw, 0.8125rem);
		letter-spacing: 0.06em;
		color: #4C463C;
	}

	.chrome-right {
		margin-left: auto;
		color: #8A7F6E;
		text-align: right;
	}

	.list {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		text-align: left;
		font-size: clamp(0.75rem, 0.75cqw, 0.9375rem);
	}

	.list th,
	.list td {
		padding: clamp(0.4rem, 0.55cqw, 0.7rem) clamp(0.6rem, 0.9cqw, 1.125rem);
		border-top: 1px solid #EDE6D9;
		vertical-align: middle;
		color: #4C463C;
	}

	.list thead th {
		border-top: 0;
		border-bottom: 1px solid #D9D0BF;
		background-color: #FAF7F0;
		font-size: clamp(0.5rem, 0.575cqw, 0.71875rem);
		font-weight: 400;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #6E6558;
	}

	.c-tenant {
		font-weight: 600;
	}

	.list .c-tenant {
		color: #1C1A17;
	}

	.list .none {
		font-style: italic;
		color: #8A7F6E;
	}

	.c-num {
		text-align: right;
		white-space: nowrap;
	}

	.via {
		display: inline-block;
		margin-left: 0.5em;
		padding: 0.1em 0.5em;
		border-radius: 3px;
		font-size: 0.75em;
		font-weight: 500;
		letter-spacing: 0.04em;
		background-color: #F1E6D2;
		color: #8A5A12;
	}

	.status {
		font-size: 0.8em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #17564F;
	}

	.status.due {
		color: #8A7F6E;
	}

	.status.manual {
		color: #8A5A12;
	}

	.hotrow {
		background-color: #FBF3E4;
	}

	.hotrow td {
		border-top-color: #E6D3B0;
	}

	.hotrow .via {
		background-color: #8A5A12;
		color: #FBF3E4;
	}

	/* Narrow, the suite, the method and the status go first; who paid and
	   who got the credit carry the point. */
	.c-suite,
	.c-method,
	.c-status {
		display: none;
	}

	@container (min-width: 40rem) {
		.c-status {
			display: table-cell;
		}
	}

	/* The suite and the method only once there is room beside the rest. */
	@container (min-width: 60rem) {
		.c-suite,
		.c-method {
			display: table-cell;
		}
	}

	.calloutlabel {
		margin: 0;
		font-size: clamp(0.5625rem, 0.6cqw, 0.75rem);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--hot);
	}

	.calloutline {
		margin: clamp(0.5rem, 0.6cqw, 0.75rem) 0 0;
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-size: clamp(1.0625rem, 1.35cqw, 1.6875rem);
		font-weight: 700;
		line-height: 1.22;
	}

	.calloutsub {
		margin: clamp(0.6rem, 0.8cqw, 1rem) 0 0;
		font-size: clamp(0.8125rem, 0.85cqw, 1.0625rem);
		line-height: 1.5;
		color: #6E6558;
	}
</style>
