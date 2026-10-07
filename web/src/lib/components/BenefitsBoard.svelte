<script lang="ts">
	import SplitSheet, { type Half } from './SplitSheet.svelte';

	/**
	 * The benefits row's work sample: two small tools, so one sheet split down
	 * the middle (SplitSheet) rather than the five-step WorkSheet.
	 */
	/** Stroked `d` strings on a 24×24 grid, the doorIcons convention. */
	const ICON = {
		match: [
			'M8 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6',
			'M2.5 20c0-3.2 2.4-5 5.5-5',
			'M16 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6',
			'M21.5 20c0-3.2-2.4-5-5.5-5',
			'M10 18h4'
		],
		merge: ['M3 5c5 0 6 7 11 7h7', 'M3 19c5 0 6-7 11-7', 'm18 9 3 3-3 3'],
		flag: ['M5 21V4', 'M5 4h13l-2.5 4 2.5 4H5'],
		calc: [
			'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z',
			'M8 6h8v3H8Z',
			'M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01'
		],
		compare: ['M12 3v17', 'M8 21h8', 'M4 7h16', 'M2 15l3-8 3 8a3 3 0 0 1-6 0Z', 'M16 15l3-8 3 8a3 3 0 0 1-6 0Z'],
		sheet: [
			'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
			'M3 9h18',
			'M9 9v12',
			'm12.5 15.5 2 2 4-4'
		]
	};

	const HALVES: Half[] = [
		{
			eyebrow: 'HR · benefits',
			title: 'Two HR systems, one list',
			problem: 'Employees were split between two HR systems, and some were in both, so every benefits review was cross-checked by hand.',
			steps: [
				{ name: 'Match', line: 'Find each person in both systems by name and date of birth.', icon: ICON.match },
				{ name: 'Merge', line: 'One row per employee, whichever system they came from.', icon: ICON.merge },
				{ name: 'Flag', line: 'Where the systems disagree, flag it for HR rather than guess.', icon: ICON.flag }
			],
			stat: '20 hours',
			unit: 'a week saved for HR',
			result: 'The merge replaced HR’s manual cross-check of the two systems, saving them 20 hours a week. They now report from a single Excel file.'
		},
		{
			eyebrow: 'Payroll · 401(k)',
			title: '401(k) matches, checked',
			problem: 'The plan matches what each employee puts in, up to a cap, but payroll was giving everyone the maximum.',
			steps: [
				{ name: 'Recalculate', line: 'Work out each match from the employee’s own contribution rate.', icon: ICON.calc },
				{ name: 'Compare', line: 'Set it against what payroll had been paying in.', icon: ICON.compare },
				{ name: 'Correct', line: 'Rework the matches in Excel and use the corrected version going forward.', icon: ICON.sheet }
			],
			stat: '$12k',
			unit: 'a month saved for the company',
			result: 'Employees below the cap had been matched as if they were at it. Reworking the matches and using the corrected calculation from then on saved the company $12k a month.'
		}
	];
</script>

<SplitSheet halves={HALVES} />
