<script lang="ts">
	import SplitSheet, { type Half } from './SplitSheet.svelte';

	/**
	 * The payment labeling row's work sample, split into what was built and
	 * what it should become. The build was the fix the circumstances allowed:
	 * a Python script whose regular expressions clean up mis-typed payment
	 * types in an Excel report. The other half is the fix at the source.
	 *
	 * The sample rows are invented, but they are the kind of entry the
	 * patterns had to catch.
	 */
	const ICON = {
		file: [
			'M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z',
			'M14 2v6h6',
			'M8 13h8',
			'M8 17h5'
		],
		pattern: ['M3 5h4', 'M3 12h4', 'M3 19h4', 'M10 5c4 0 4 7 8 7h3', 'M10 19c4 0 4-7 8-7', 'M10 12h11'],
		tag: [
			'M12 2H4a2 2 0 0 0-2 2v8l9.3 9.3a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8Z',
			'M7.5 7.5h.01'
		],
		pick: ['M4 4h16v5H4Z', 'M4 12h16', 'M4 16h16', 'M4 20h10', 'm15 6 1.5 1.5L19 5'],
		check: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', 'm8.5 12 2.5 2.5 4.5-5'],
		database: [
			'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3Z',
			'M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5',
			'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'
		]
	};

	const HALVES: Half[] = [
		{
			eyebrow: 'Accounts payable · delivered',
			title: 'Payment types, cleaned up',
			problem: 'Payment types were typed in by hand, so the same method appeared a dozen different ways and the report could not be totalled by type.',
			steps: [
				{ name: 'Read', line: 'A Python script opens the Excel report as it comes out.', icon: ICON.file },
				{ name: 'Recognise', line: 'Regular expressions match every common mis-type of each payment type.', icon: ICON.pattern },
				{ name: 'Relabel', line: 'Each row gets one clean label, and the corrected report is saved back to Excel.', icon: ICON.tag }
			],
			sample: {
				from: 'Typed in',
				to: 'Labeled as',
				rows: [
					['visa crd', 'Credit card'],
					['VSA', 'Credit card'],
					['amex cc', 'Credit card'],
					['a.c.h', 'ACH transfer'],
					['chk #4471', 'Check'],
					['wire xfer', 'Wire transfer']
				],
				typos: true
			},
			stat: '10 hours',
			unit: 'a week saved for accounts payable',
			result: 'Labeling that was done by hand now runs in seconds, and the consistent labels made auditing easier.'
		},
		{
			eyebrow: 'Accounts payable · recommended redesign',
			title: 'Fix it at the source',
			problem: 'The script corrects mistakes after they are made. With the scope to redesign how payments are recorded, I would prevent them at the point of entry.',
			steps: [
				{ name: 'Pick, don’t type', line: 'A small web app where staff choose the payment type from a list.', icon: ICON.pick },
				{ name: 'Check on entry', line: 'Amounts, dates and vendors are validated as they are entered.', icon: ICON.check },
				{ name: 'Store it properly', line: 'Every payment goes into a real database instead of a spreadsheet.', icon: ICON.database }
			],
			sample: {
				from: 'Field',
				to: 'Entered as',
				rows: [
					['Payment type', 'Picked from a list'],
					['Amount', 'Checked as it’s typed'],
					['Date', 'Chosen on a calendar'],
					['Vendor', 'Matched to the vendor list'],
					['Saved to', 'A database, not Excel']
				]
			},
			result: 'Faster, more precise entry, and reports that are right the first time.'
		}
	];
</script>

<SplitSheet halves={HALVES} />
