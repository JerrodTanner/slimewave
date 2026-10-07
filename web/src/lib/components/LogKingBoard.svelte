<script lang="ts">
	import WorkSheet from './WorkSheet.svelte';
	/**
	 * The LogKing work sample, set as the same printed sheet as the critical
	 * results one: how a night of play gets from the game to a report anyone in
	 * the guild can open.
	 *
	 * It is CriticalResultsBoard's stock, type and layout on purpose, so the two
	 * read as a set when they sit in the Bold rows. The one change is the accent:
	 * teal from the drawings rather than the crimson, because nothing here is an
	 * alarm. The same reasoning keeps it outside the theme tokens.
	 *
	 * The copy is written for a business owner, not a player: "in-game activity
	 * logs" and "player performance reports", never "combat log" or "raid".
	 */
	const STEPS = [
		{
			name: 'The game records it',
			line: 'An in-game add-on writes down every action as it happens and splits the night into separate attempts.',
			note: 'In-game add-on',
			hot: false
		},
		{
			name: 'It uploads itself',
			line: 'A small desktop app uploads the saved file automatically while you play, and keeps the in-game add-on up to date on its own, so fixes arrive without a reinstall.',
			note: 'Auto-upload · auto-update',
			hot: false
		},
		{
			name: 'It is checked and stored',
			line: 'The server reads the file, confirms the character and guild against the game’s public records, and saves it.',
			note: 'Go · SQLite',
			hot: false
		},
		{
			name: 'Uploads are stitched together',
			line: 'Several players can upload the same night. Their files join into one record, keeping the most complete copy of each attempt.',
			note: 'One night, one record',
			hot: true
		},
		{
			name: 'A report for every player',
			line: 'Damage, healing and deaths per player, per attempt, down to each ability.',
			note: 'Complete encounter tracking',
			hot: true
		}
	];

	/**
	 * A small working copy of the site. The numbers are lifted from the live
	 * one (logking.duckdns.org): one Patchwerk kill for the Reports tab and
	 * the top of each leaderboard for Rankings. Names that would not belong on
	 * a business page are swapped for generic ones, and so is the guild.
	 */
	type Metric = 'damage' | 'healing';

	/** [spell, amount, share %, hits, crit %] */
	type Spell = [string, number, number, number, number];

	interface Player {
		name: string;
		spec: string;
		deaths: number;
		/** parse, per second, total, share % */
		stats: Partial<Record<Metric, { parse: number; rate: number; total: number; share: number }>>;
		spells: Partial<Record<Metric, Spell[]>>;
	}

	const PULL: Player[] = [
		{
			name: 'Namo', spec: 'Frost', deaths: 0,
			stats: { damage: { parse: 86, rate: 8747.6, total: 1_071_007, share: 31.7 } },
			spells: {
				damage: [
					['Melee', 323_335, 30.2, 433, 29.8],
					['Frost Strike', 197_670, 18.5, 31, 74.2],
					['Obliterate', 184_936, 17.3, 25, 68.0],
					['Frost Strike (off-hand)', 132_573, 12.4, 31, 83.9],
					['Obliterate (off-hand)', 123_835, 11.6, 25, 76.0],
					['Frost Fever', 30_554, 2.9, 35, 0]
				]
			}
		},
		{
			name: 'Equalizer', spec: 'Combat', deaths: 0,
			stats: { damage: { parse: 100, rate: 8073.6, total: 988_480, share: 29.3 } },
			spells: {
				damage: [
					['Melee', 359_811, 36.4, 274, 62.4],
					['Instant Poison IX', 260_146, 26.3, 172, 27.9],
					['Sinister Strike', 168_720, 17.1, 48, 56.2],
					['Rupture', 85_049, 8.6, 51, 52.9],
					['Deadly Poison IX', 63_737, 6.4, 39, 0],
					['Killing Spree', 24_384, 2.5, 10, 50.0]
				]
			}
		},
		{
			name: 'Spanelus', spec: 'Affliction', deaths: 0,
			stats: {
				damage: { parse: 12, rate: 6337.8, total: 775_963, share: 23.0 },
				healing: { parse: 75, rate: 78.1, total: 9_571, share: 1.4 }
			},
			spells: {
				damage: [
					['Shadow Bolt', 222_014, 28.6, 35, 37.1],
					['Corruption', 188_430, 24.3, 57, 42.1],
					['Drain Soul', 105_200, 13.6, 8, 0],
					['Unstable Affliction', 86_632, 11.2, 35, 28.6],
					['Shadow Bite (pet)', 53_291, 6.9, 59, 10.2],
					['Curse of Agony', 49_276, 6.4, 54, 0]
				],
				healing: [
					['Siphon Life', 7_535, 78.7, 57, 0],
					['Haunt', 2_000, 20.9, 8, 0],
					['Fel Armor', 36, 0.4, 24, 0]
				]
			}
		},
		{
			name: 'Ironbark', spec: 'Feral (Tank)', deaths: 1,
			stats: {
				damage: { parse: 100, rate: 3328.5, total: 407_523, share: 12.1 },
				healing: { parse: 0, rate: 863.3, total: 105_706, share: 15.6 }
			},
			spells: {
				damage: [
					['Maul', 263_163, 64.6, 61, 52.5],
					['Lacerate', 67_579, 16.6, 61, 60.7],
					['Mangle (Bear)', 56_605, 13.9, 21, 47.6],
					['Swipe (Bear)', 18_338, 4.5, 18, 50.0],
					['Faerie Fire (Feral)', 1_060, 0.3, 1, 0]
				],
				healing: [
					['Savage Defense', 83_422, 78.9, 35, 0],
					['Improved Leader of the Pack', 22_284, 21.1, 89, 0]
				]
			}
		},
		{
			name: 'Rehgarmvp', spec: 'Restoration', deaths: 0,
			stats: {
				damage: { parse: 57, rate: 1067.7, total: 130_731, share: 3.9 },
				healing: { parse: 100, rate: 4595.7, total: 562_669, share: 83.0 }
			},
			spells: {
				damage: [
					['Melee (Fire Elemental)', 89_991, 68.8, 51, 13.7],
					['Flame Shock', 14_139, 10.8, 21, 38.1],
					['Fire Nova', 11_711, 9.0, 7, 14.3],
					['Fire Blast', 11_173, 8.5, 13, 15.4],
					['Fire Shield', 3_717, 2.8, 31, 22.6]
				],
				healing: [
					['Healing Wave', 327_109, 58.1, 26, 42.3],
					['Earth Shield', 114_566, 20.4, 30, 40.0],
					['Lesser Healing Wave', 69_852, 12.4, 13, 30.8],
					['Ancestral Awakening', 22_983, 4.1, 8, 0],
					['Earthliving', 17_938, 3.2, 26, 0],
					['Riptide', 7_994, 1.4, 6, 0]
				]
			}
		}
	];

	/** The raid's totals for the pull, as the live page footers them. */
	const PULL_TOTAL: Record<Metric, { rate: number; total: number }> = {
		damage: { rate: 27_555.5, total: 3_373_704 },
		healing: { rate: 5_537.2, total: 677_946 }
	};

	/** [player, spec, parse or null, value, best kill or null] */
	type Rank = [string, string, number | null, number, string | null];

	/**
	 * The first key is the Leaderboard tab's board, which ranks across every
	 * boss by LogKing's own score; the rest are the Rankings tab, one boss each.
	 */
	const RANKINGS: Record<string, Record<Metric, Rank[]>> = {
		'All bosses': {
			damage: [
				['Screwloose', 'Destruction', null, 1700, null],
				['Slime', 'Protection', null, 1694, null],
				['Wildclaw', 'Feral (DPS)', null, 1694, null],
				['Spoon', 'Affliction', null, 1685, null],
				['Emberly', 'Fire', null, 1666, null],
				['Marvels', 'Balance', null, 1662, null],
				['Healbot', 'Unholy', null, 1635, null],
				['Clegain', 'Protection', null, 1612, null]
			],
			healing: [
				['Spoon', 'Affliction', null, 1617, null],
				['Hozay', 'Survival', null, 1606, null],
				['Firecrackers', 'Holy', null, 1585, null],
				['Screwloose', 'Destruction', null, 1550, null],
				['Paladb', 'Protection', null, 1546, null],
				['Spoondk', 'Frost', null, 1542, null],
				['Sset', 'Shadow', null, 1503, null],
				['Skoomi', 'Enhancement', null, 1480, null]
			]
		},
		Patchwerk: {
			damage: [
				['Wildclaw', 'Feral (DPS)', 100, 10898.7, '1:47.8'],
				['Skoomi', 'Enhancement', 100, 10473.9, '1:33.7'],
				['Cosmiccow', 'Feral (DPS)', 97, 10105.3, '1:39.2'],
				['Shameris', 'Enhancement', 90, 9635.9, '1:37.1'],
				['Primei', 'Elemental', 100, 9444.6, '1:52.0'],
				['Healbot', 'Unholy', 100, 9432.0, '1:37.1'],
				['Watchmetank', 'Affliction', 100, 9406.8, '1:44.5'],
				['Kinetiq', 'Enhancement', 76, 9278.4, '2:11.7']
			],
			healing: [
				['Cow', 'Restoration', 100, 5544.8, '1:47.8'],
				['Priestick', 'Discipline', 100, 5298.8, '2:13.7'],
				['Bread', 'Restoration', 95, 5291.3, '2:38.2'],
				['Cptdps', 'Holy', 100, 5126.0, '2:25.9'],
				['Polydru', 'Restoration', 91, 5090.0, '2:22.4'],
				['Treestick', 'Restoration', 87, 5031.0, '2:40.5'],
				['Flora', 'Restoration', 83, 4785.4, '2:18.9'],
				['Tracitus', 'Holy', 92, 4728.2, '2:28.8']
			]
		},
		Loatheb: {
			damage: [
				['Spoon', 'Affliction', 100, 10430.2, '4:04.9'],
				['Wildclaw', 'Feral (DPS)', 100, 9954.5, '4:47.6'],
				['Shuvel', 'Affliction', 83, 9487.8, '4:12.2'],
				['Cosmiccow', 'Feral (DPS)', 87, 9286.6, '3:58.8'],
				['Sqrviel', 'Shadow', 100, 8947.1, '4:38.3'],
				['Emberly', 'Fire', 100, 8725.5, '3:44.3'],
				['Yeets', 'Combat', 100, 8658.4, '3:54.9'],
				['Clegane', 'Frost', 100, 8555.4, '3:22.9']
			],
			healing: [
				['Dominic', 'Restoration', 100, 2025.0, '4:39.8'],
				['Priestick', 'Discipline', 100, 1972.0, '4:54.5'],
				['Firecrackers', 'Discipline', 94, 1970.4, '3:44.3'],
				['Lux', 'Holy', 100, 1885.9, '6:31.8'],
				['Cow', 'Restoration', 92, 1883.7, '3:35.6'],
				['Polydru', 'Restoration', 85, 1856.9, '4:51.7'],
				['Jared', 'Holy', 83, 1801.4, '4:32.8'],
				['Noimiiscat', 'Holy', 66, 1793.5, '4:48.9']
			]
		},
		Sapphiron: {
			damage: [
				['Wildclaw', 'Feral (DPS)', 100, 9073.2, '3:36.0'],
				['Spoon', 'Affliction', 100, 8404.3, '4:24.6'],
				['Gameslock', 'Affliction', 96, 8012.7, '4:34.8'],
				['Cosmiccow', 'Feral (DPS)', 85, 7794.6, '3:30.6'],
				['Shameris', 'Enhancement', 100, 7683.5, '3:40.4'],
				['Watchmetank', 'Affliction', 90, 7662.8, '3:54.7'],
				['Frankthelock', 'Affliction', 84, 7224.6, '4:37.0'],
				['Miasma', 'Affliction', 81, 7183.4, '4:19.3']
			],
			healing: [
				['Vitalis', 'Restoration', 100, 5049.9, '5:50.5'],
				['Dominic', 'Restoration', 96, 5025.2, '5:28.3'],
				['Priestick', 'Holy', 100, 4923.9, '2:21.5'],
				['Firecrackers', 'Holy', 92, 4819.6, '3:52.1'],
				['Solenne', 'Discipline', 100, 4712.1, '4:29.4'],
				['Treestick', 'Restoration', 92, 4671.9, '4:34.8'],
				['Cow', 'Restoration', 88, 4669.5, '3:36.0'],
				['Lac', 'Holy', 100, 4652.1, '6:13.4']
			]
		},
		"Kel'Thuzad": {
			damage: [
				['Wildclaw', 'Feral (DPS)', 100, 6773.8, '7:21.9'],
				['Kuro', 'Survival', 100, 6371.9, '6:25.8'],
				['Spoondk', 'Frost', 100, 5889.0, '6:33.5'],
				['Spoon', 'Affliction', 100, 5867.6, '6:50.6'],
				['Shuvel', 'Affliction', 90, 5800.5, '6:31.6'],
				['Cosmiccow', 'Feral (DPS)', 76, 5687.4, '6:12.5'],
				['Habobi', 'Survival', 92, 5630.6, '7:01.3'],
				['Hozay', 'Survival', 89, 5605.6, '7:56.7']
			],
			healing: [
				['Noxtree', 'Restoration', 100, 3106.8, '8:02.2'],
				['Peacefield', 'Restoration', 100, 3081.9, '6:40.0'],
				['Kunigunda', 'Holy', 100, 3014.1, '7:43.9'],
				['Polydru', 'Restoration', 95, 2890.5, '7:38.3'],
				['Lac', 'Holy', 93, 2866.8, '7:42.4'],
				['Riverleaf', 'Restoration', 90, 2851.0, '7:04.8'],
				['Kurro', 'Holy', 87, 2837.4, '6:21.5'],
				['Lux', 'Holy', 75, 2722.0, '7:23.9']
			]
		}
	};
	const BOSSES = Object.keys(RANKINGS).slice(1);

	const TABS = [
		['leaderboard', 'Leaderboard'],
		['rankings', 'Rankings'],
		['reports', 'Reports']
	] as const;

	const METRICS: Metric[] = ['damage', 'healing'];
	const label = (m: Metric) => (m === 'damage' ? 'Damage' : 'Healing');
	const fmt = (n: number, digits = 0) =>
		n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

	/** The live site's parse colours, darkened enough to read on the cream. */
	function parseTier(n: number) {
		if (n >= 100) return 'p-gold';
		if (n >= 95) return 'p-pink';
		if (n >= 75) return 'p-purple';
		if (n >= 50) return 'p-blue';
		if (n >= 25) return 'p-green';
		return 'p-grey';
	}

	let tab = $state<'leaderboard' | 'rankings' | 'reports'>('leaderboard');
	let metric = $state<Metric>('damage');
	let open = $state<string | null>(null);
	let boss = $state('Patchwerk');
	let rankMetric = $state<Metric>('damage');

	const rows = $derived(
		PULL.filter((p) => p.stats[metric]).sort((a, b) => b.stats[metric]!.total - a.stats[metric]!.total)
	);
	const overall = $derived(tab === 'leaderboard');
	const board = $derived(RANKINGS[overall ? 'All bosses' : boss][rankMetric]);
	/** "How it was done", one string per paragraph. */
	const STORY = [
		'LogKing is my own rebuild of Warcraft Logs, the reporting and rankings site the World of Warcraft community runs on — a full company’s product, rebuilt solo for private servers it doesn’t support. With no access to the server itself, everything is built from the player’s side: an in-game add-on captures the activity, and the website does the rest.',
		'I built and host the whole stack: one Go program serving the pages, a SQLite database, and a small cloud server behind automatic HTTPS, with nightly backups. Uploads from different players merge into one record, so a team sees one night, not six copies of it.'
	];
</script>

<!-- The five drawings, on the same 48 grid and duotone as the critical results sheet. -->
{#snippet stepIcon(i: number)}
	<svg class="art" viewBox="0 0 48 48" fill="none" stroke="#1C1A17" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#if i === 0}
			<rect x="4" y="6" width="40" height="28" rx="3" fill="#F6F1E7" />
			<rect x="8" y="10" width="32" height="20" rx="2" fill="#1C1A17" stroke="none" />
			<path d="M12 15h14" stroke="#6E9E96" />
			<path d="M12 19.5h18" stroke="#6E9E96" />
			<path d="M12 24h10" stroke="#6E9E96" />
			<circle cx="34" cy="15" r="2.4" fill="#17564F" stroke="#DCE6E2" stroke-width="1" />
			<path d="M24 34v5" />
			<path d="M15 43h18" />
			<path d="M18 39h12l1 4H17z" fill="#DCE6E2" />
		{:else if i === 1}
			<path d="M10 4h18l10 10v30H10z" fill="#F6F1E7" />
			<path d="M28 4v10h10" fill="#DCE6E2" />
			<path d="M15 21h12" />
			<path d="M15 25.5h8" />
			<circle cx="31" cy="35" r="9" fill="#17564F" stroke="none" />
			<path d="M31 39.5v-9" stroke="#F6F1E7" stroke-width="2.2" />
			<path d="M27 34l4-4 4 4" stroke="#F6F1E7" stroke-width="2.2" />
		{:else if i === 2}
			<rect x="6" y="6" width="28" height="10" rx="2.5" fill="#F6F1E7" />
			<rect x="6" y="19" width="28" height="10" rx="2.5" fill="#DCE6E2" />
			<rect x="6" y="32" width="28" height="10" rx="2.5" fill="#F6F1E7" />
			<circle cx="12" cy="11" r="1.4" fill="#17564F" stroke="none" />
			<circle cx="12" cy="24" r="1.4" fill="#17564F" stroke="none" />
			<circle cx="12" cy="37" r="1.4" fill="#17564F" stroke="none" />
			<path d="M18 11h11" />
			<path d="M18 24h11" />
			<path d="M18 37h11" />
			<circle cx="37" cy="31" r="8" fill="#6E9E96" stroke="none" />
			<path d="M33.4 31.2l2.6 2.6 4.6-5" stroke="#F6F1E7" stroke-width="2.2" />
		{:else if i === 3}
			<rect x="3" y="4" width="14" height="17" rx="2" fill="#F6F1E7" />
			<rect x="3" y="27" width="14" height="17" rx="2" fill="#F6F1E7" />
			<path d="M6.5 10h7M6.5 14h5" />
			<path d="M6.5 33h7M6.5 37h5" />
			<path d="M17 12.5c6 0 6 11.5 11 11.5" stroke="#17564F" stroke-width="2" />
			<path d="M17 35.5c6 0 6-11.5 11-11.5" stroke="#17564F" stroke-width="2" />
			<rect x="28" y="12" width="17" height="24" rx="2.5" fill="#DCE6E2" />
			<path d="M32 18.5h9M32 23h9M32 27.5h9M32 32h5" />
		{:else}
			<rect x="5" y="5" width="30" height="38" rx="3" fill="#F6F1E7" />
			<path d="M10 12h16" />
			<rect x="10" y="18" width="18" height="4" rx="1" fill="#17564F" stroke="none" />
			<rect x="10" y="25" width="14" height="4" rx="1" fill="#6E9E96" stroke="none" />
			<rect x="10" y="32" width="9" height="4" rx="1" fill="#DCE6E2" stroke="none" />
			<rect x="30" y="31" width="14" height="7" rx="3.5" fill="#F6F1E7" stroke="#17564F" stroke-width="2" />
			<rect x="26" y="36" width="14" height="7" rx="3.5" fill="#F6F1E7" stroke="#17564F" stroke-width="2" />
		{/if}
	</svg>
{/snippet}

{#snippet pills(current: Metric, pick: (m: Metric) => void)}
	<div class="pills" role="group" aria-label="Metric">
		{#each METRICS as m (m)}
			<button class:on={current === m} aria-pressed={current === m} onclick={() => pick(m)}>{label(m)}</button>
		{/each}
	</div>
{/snippet}

<WorkSheet
	eyebrow="Game data · player reports"
	site="https://logking.duckdns.org"
	title="Player performance reports from in-game activity logs"
	deck="A night of play becomes a report the whole team can open. The game writes the log, a desktop app uploads it automatically while you play, and the server checks it, stores it, and turns it into a page per player."
	steps={STEPS}
	icon={stepIcon}
	accent={{ ink: '#17564F', rule: '#C3D9D3' }}
	seenTitle="What the team sees"
	story={STORY}
>
	{#snippet seen()}
		<!-- A working miniature of the site, not a screenshot of it. -->
		<div class="screen">
			<div class="chrome">
				<span class="brand">LogKing</span>
				<div class="tabs" role="tablist" aria-label="Sample site">
					{#each TABS as [key, name] (key)}
						<button role="tab" aria-selected={tab === key} class:on={tab === key} onclick={() => (tab = key)}>{name}</button>
					{/each}
				</div>
			</div>

			{#if tab === 'reports'}
				<div class="toolbar">
					<div>
						<p class="fight">Patchwerk <span class="kill">Kill</span></p>
						<p class="fightmeta">25 heroic · 2:02.4 · 1 Oct 2026 · Night Shift</p>
					</div>
					{@render pills(metric, (m) => { metric = m; open = null; })}
				</div>
				<table class="list">
					<thead>
						<tr>
							<th scope="col" class="c-rank">#</th>
							<th scope="col">Player</th>
							<th scope="col" class="c-num c-parse">Parse</th>
							<th scope="col" class="c-num">{label(metric)} per second</th>
							<th scope="col" class="c-share">Share</th>
							<th scope="col" class="c-num c-deaths">Deaths</th>
						</tr>
					</thead>
					<tbody>
						{#each rows as p, i (p.name)}
							{@const st = p.stats[metric]!}
							<tr class="prow" class:hotrow={open === p.name}>
								<td class="c-rank">{i + 1}</td>
								<td class="c-name">
									<button class="rowbtn" aria-expanded={open === p.name} onclick={() => (open = open === p.name ? null : p.name)}>
										<span class="caret" aria-hidden="true">▸</span>{p.name}
									</button>
									<span class="spec">{p.spec}</span>
								</td>
								<td class="c-num c-parse {parseTier(st.parse)}">{st.parse}</td>
								<td class="c-num">{fmt(st.rate, 1)}</td>
								<td class="c-share">
									<span class="bar"><span style:width="{st.share}%"></span></span>
									<span class="amt">{fmt(st.total)}</span>
									<span class="pct">{st.share.toFixed(1)}%</span>
								</td>
								<td class="c-num c-deaths">{p.deaths}</td>
							</tr>
							{#if open === p.name}
								<tr class="detail">
									<td colspan="6">
										<p class="detail-head">{p.name} — {metric} by spell · {fmt(st.total)} total</p>
										<table class="spells">
											<thead>
												<tr>
													<th scope="col">Spell</th>
													<th scope="col" class="c-num">Amount</th>
													<th scope="col" class="c-sshare">Share</th>
													<th scope="col" class="c-num c-hits">Hits</th>
													<th scope="col" class="c-num c-hits">Crit %</th>
												</tr>
											</thead>
											<tbody>
												{#each p.spells[metric] ?? [] as [spell, amount, share, hits, crit] (spell)}
													<tr>
														<td>{spell}</td>
														<td class="c-num">{fmt(amount)}</td>
														<td class="c-sshare">
															<span class="bar"><span style:width="{share}%"></span></span>
															<span class="pct">{share.toFixed(1)}%</span>
														</td>
														<td class="c-num c-hits">{hits}</td>
														<td class="c-num c-hits">{crit.toFixed(1)}%</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</td>
								</tr>
							{/if}
						{/each}
						<tr class="raidrow">
							<td></td>
							<td class="c-name">Raid</td>
							<td class="c-parse"></td>
							<td class="c-num">{fmt(PULL_TOTAL[metric].rate, 1)}</td>
							<td class="c-share">
								<span class="bar ghost"></span>
								<span class="amt">{fmt(PULL_TOTAL[metric].total)}</span>
							</td>
							<td class="c-deaths"></td>
						</tr>
					</tbody>
				</table>
				<p class="hint">Click a player for their breakdown by spell.</p>
			{:else}
				<div class="toolbar">
					{#if overall}
						<div>
							<p class="fight">Top players</p>
							<p class="fightmeta">LK Score across every boss</p>
						</div>
					{:else}
						<label class="pick">
							<span>Boss</span>
							<select bind:value={boss}>
								{#each BOSSES as name (name)}<option value={name}>{name}</option>{/each}
							</select>
						</label>
					{/if}
					{@render pills(rankMetric, (m) => (rankMetric = m))}
				</div>
				<table class="list">
					<thead>
						<tr>
							<th scope="col" class="c-rank">#</th>
							<th scope="col">Player</th>
							{#if overall}
								<th scope="col" class="c-num">LK Score</th>
							{:else}
								<th scope="col" class="c-num c-parse">Parse</th>
								<th scope="col" class="c-num">Best {rankMetric} per second</th>
								<th scope="col" class="c-num c-deaths">Best kill</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#each board as [name, spec, parse, value, kill], i (i)}
							<tr class:hotrow={i === 0}>
								<td class="c-rank">{i + 1}</td>
								<td class="c-name">{name} <span class="spec">{spec}</span></td>
								{#if overall}
									<td class="c-num">{fmt(value)}</td>
								{:else}
									<td class="c-num c-parse {parseTier(parse ?? 0)}">{parse}</td>
									<td class="c-num">{fmt(value, 1)}</td>
									<td class="c-num c-deaths">{kill}</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

		<aside class="callout">
			<p class="calloutlabel">Click around</p>
			<p class="calloutline">
				See the top players overall, pick a boss in Rankings, or open a player in Reports for their
				breakdown by spell.
			</p>
			<p class="calloutsub">
				Numbers from the live site. There, every view has its own
				link, so a report pasted into the team chat opens on the same numbers.
			</p>
		</aside>
	{/snippet}
</WorkSheet>

<style>
	.chrome,
	.calloutlabel,
	.list thead th,
	.c-num,
	.pct {
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
	}

	.calloutline {
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-weight: 700;
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
		align-items: center;
		gap: 0.75rem;
		padding: clamp(0.5rem, 0.6cqw, 0.75rem) clamp(0.6rem, 0.9cqw, 1.125rem);
		border-bottom: 1px solid #D9D0BF;
		background-color: #EFE9DC;
		font-size: clamp(0.625rem, 0.65cqw, 0.8125rem);
		letter-spacing: 0.06em;
		color: #4C463C;
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

	.list td {
		color: #4C463C;
	}

	.c-name {
		font-weight: 600;
		color: #1C1A17;
	}

	.c-num {
		text-align: right;
		white-space: nowrap;
	}

	/* --- the miniature site ------------------------------------------------ */

	button,
	select {
		font: inherit;
		color: inherit;
	}

	.brand {
		font-weight: 700;
		letter-spacing: 0.04em;
		color: #1C1A17;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		margin-left: auto;
	}

	.tabs button {
		padding: 0.25em 0.75em;
		border: 0;
		border-bottom: 2px solid transparent;
		background: none;
		cursor: pointer;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8A7F6E;
	}

	.tabs button.on {
		border-bottom-color: #17564F;
		color: #1C1A17;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 1rem;
		padding: clamp(0.5rem, 0.7cqw, 0.85rem) clamp(0.6rem, 0.9cqw, 1.125rem);
		border-bottom: 1px solid #EDE6D9;
		font-size: clamp(0.75rem, 0.75cqw, 0.9375rem);
	}

	.fight {
		margin: 0;
		font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		font-weight: 700;
		color: #1C1A17;
	}

	.pills {
		display: flex;
		margin-left: auto;
		border: 1px solid #C9BFAC;
		border-radius: 999px;
		overflow: hidden;
	}

	.pills button {
		padding: 0.2em 0.9em;
		border: 0;
		background: none;
		cursor: pointer;
		font-size: 0.9em;
	}

	.pills button.on {
		background-color: #17564F;
		color: #F6F1E7;
	}

	.pick {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: #6E6558;
	}

	.pick select {
		padding: 0.2em 0.5em;
		border: 1px solid #C9BFAC;
		border-radius: 4px;
		background-color: #FFFFFF;
		color: #1C1A17;
	}

	.c-rank {
		width: 2.5rem;
		color: #8A7F6E;
	}

	.c-share {
		width: 34%;
		white-space: nowrap;
	}

	.bar {
		display: inline-block;
		width: calc(100% - 3.5em);
		height: 0.6em;
		vertical-align: middle;
		background-color: #EFE9DC;
	}

	.bar span {
		display: block;
		height: 100%;
		background-color: #6E9E96;
	}

	.pct {
		display: inline-block;
		width: 3.5em;
		text-align: right;
		font-size: 0.85em;
	}

	/* The whole row opens the breakdown: the name's button is stretched over
	   it, so the row is one big target and still a real button for keyboards. */

	.prow {
		position: relative;
	}

	.rowbtn {
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		font-weight: 600;
		text-align: left;
	}

	.rowbtn::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.prow:hover {
		background-color: #FAF7F0;
	}

	.caret {
		display: inline-block;
		width: 1.1em;
		color: #8A7F6E;
		transition: transform 0.15s ease;
	}

	.rowbtn[aria-expanded='true'] .caret {
		transform: rotate(90deg);
		color: #17564F;
	}

	/* Narrow, the role and the rate go first; the total and share carry the point. */

	.c-parse,
	.c-deaths,
	.c-hits,
	.spec {
		display: none;
	}

	@container (min-width: 40rem) {

		.c-parse,
		.c-deaths,
		.c-hits {
			display: table-cell;
		}

		.spec {
			display: inline;
		}
	}

	.hotrow,
	.hotrow:hover {
		background-color: #E9F1EE;
	}

	.hotrow td {
		border-top-color: #C3D9D3;
		font-weight: 600;
		color: #1C1A17;
	}

	.hotrow .bar span {
		background-color: #17564F;
	}

	.detail td {
		padding-top: 0.4rem;
		padding-bottom: 0.9rem;
		border-top: 0;
		background-color: #F4F8F6;
	}

	.detail-head {
		margin: 0 0 0.5rem;
		font-size: 0.8em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #17564F;
	}

	.spells {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95em;
	}

	.spells th,
	.spells td {
		padding: 0.3rem 0.5rem;
		border-top: 1px solid #DCE6E2;
	}

	.spells thead th {
		border-top: 0;
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.75em;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #6E6558;
		text-align: left;
	}

	.spells thead th.c-num {
		text-align: right;
	}

	.c-sshare {
		width: 30%;
		white-space: nowrap;
	}

	.spec {
		margin-left: 0.4em;
		font-size: 0.85em;
		font-weight: 400;
		color: #8A7F6E;
	}

	/* The pull's share cell carries the amount as well as the percentage. */

	.list .c-share .bar {
		width: calc(100% - 9.5em);
	}

	.ghost {
		visibility: hidden;
	}

	.list .c-deaths {
		padding-left: 1.25rem;
	}

	.amt {
		display: inline-block;
		width: 5.5em;
		text-align: right;
		font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.85em;
	}

	.raidrow td {
		border-top: 1px solid #D9D0BF;
		font-weight: 700;
		color: #1C1A17;
	}

	.hint {
		margin: 0;
		padding: 0.5rem clamp(0.6rem, 0.9cqw, 1.125rem);
		border-top: 1px solid #EDE6D9;
		font-size: clamp(0.6875rem, 0.7cqw, 0.875rem);
		color: #8A7F6E;
	}

	.kill {
		margin-left: 0.35em;
		padding: 0.05em 0.45em;
		border-radius: 3px;
		font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif;
		font-size: 0.7em;
		font-weight: 600;
		vertical-align: middle;
		background-color: #E9F1EE;
		color: #17564F;
	}

	.fightmeta {
		margin: 0.1rem 0 0;
		font-size: 0.85em;
		color: #8A7F6E;
	}

	/* The live site's parse colours, each darkened to hold up on cream. */

	.list .p-gold { color: #A86F00; }

	.list .p-pink { color: #B0407A; }

	.list .p-purple { color: #6A3FA0; }

	.list .p-blue { color: #2F5FA8; }

	.list .p-green { color: #3C7D3A; }

	.list .p-grey { color: #8A7F6E; }

	.c-parse {
		font-weight: 700;
	}

	.calloutsub {
		margin: clamp(0.6rem, 0.8cqw, 1rem) 0 0;
		font-size: clamp(0.8125rem, 0.85cqw, 1.0625rem);
		line-height: 1.5;
		color: #6E6558;
	}

	@media (prefers-reduced-motion: reduce) {

		.caret {
			transition: none;
		}
	}

	.callout {
		position: relative;
	}

	.calloutlabel {
		margin: 0;
		font-size: clamp(0.5625rem, 0.6cqw, 0.75rem);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #17564F;
	}

	.calloutline {
		margin: clamp(0.5rem, 0.6cqw, 0.75rem) 0 0;
		font-size: clamp(1.0625rem, 1.35cqw, 1.6875rem);
		line-height: 1.22;
	}
</style>
