/**
 * A very small Markdown reader.
 *
 * The site carries no Markdown dependency and does not want one: the only
 * Markdown it renders is written in this repo, so the subset worth supporting
 * is the subset `resume.md` uses — headings, paragraphs, bullet lists one
 * level deep, rules, and four inline marks.
 *
 * It returns a block tree rather than a string of HTML, so the renderer stays
 * ordinary Svelte markup and nothing here ever reaches `{@html}`.
 */

export type Inline =
	| { kind: 'text' | 'strong' | 'em' | 'code'; text: string }
	| { kind: 'link'; text: string; href: string };

export interface ListItem {
	content: Inline[];
	children: ListItem[];
}

export type Heading = { type: 'heading'; level: number; content: Inline[] };

export type Block =
	| Heading
	| { type: 'paragraph'; content: Inline[] }
	| { type: 'list'; items: ListItem[] }
	| { type: 'rule' };

/** `**strong**`, `*emphasis*`, `` `code` ``, `[label](href)`. */
const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((\S+?)\)/g;

export function inline(source: string): Inline[] {
	const tokens: Inline[] = [];
	let cut = 0;

	for (const match of source.matchAll(INLINE)) {
		const at = match.index ?? 0;
		if (at > cut) tokens.push({ kind: 'text', text: source.slice(cut, at) });

		if (match[1] !== undefined) tokens.push({ kind: 'strong', text: match[1] });
		else if (match[2] !== undefined) tokens.push({ kind: 'em', text: match[2] });
		else if (match[3] !== undefined) tokens.push({ kind: 'code', text: match[3] });
		else tokens.push({ kind: 'link', text: match[4], href: match[5] });

		cut = at + match[0].length;
	}

	if (cut < source.length) tokens.push({ kind: 'text', text: source.slice(cut) });
	return tokens;
}

export function parse(source: string): Block[] {
	const blocks: Block[] = [];
	let paragraph: string[] = [];
	let list: ListItem[] | null = null;

	const closeParagraph = () => {
		if (!paragraph.length) return;
		blocks.push({ type: 'paragraph', content: inline(paragraph.join(' ')) });
		paragraph = [];
	};
	const closeList = () => {
		if (!list) return;
		blocks.push({ type: 'list', items: list });
		list = null;
	};
	const close = () => {
		closeParagraph();
		closeList();
	};

	for (const raw of source.replace(/\r\n/g, '\n').split('\n')) {
		const line = raw.trimEnd();

		if (!line.trim()) {
			close();
			continue;
		}

		const bullet = /^(\s*)[-*]\s+(.*)$/.exec(line);
		if (bullet) {
			closeParagraph();
			const item: ListItem = { content: inline(bullet[2]), children: [] };
			// Two spaces of indent hangs the item off the one above it. That is
			// the only nesting the documents use, so it is the only nesting read.
			if (list && bullet[1].length >= 2 && list.length) list[list.length - 1].children.push(item);
			else (list ??= []).push(item);
			continue;
		}

		const heading = /^(#{1,6})\s+(.*)$/.exec(line);
		if (heading) {
			close();
			blocks.push({ type: 'heading', level: heading[1].length, content: inline(heading[2]) });
			continue;
		}

		if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
			close();
			blocks.push({ type: 'rule' });
			continue;
		}

		closeList();
		paragraph.push(line.trim());
	}

	close();
	return blocks;
}

export interface Section {
	/** `null` for whatever comes before the first heading of that level. */
	heading: Heading | null;
	blocks: Block[];
}

/**
 * Cuts a parsed document into sections at every heading of `level`. A page
 * that wants to lay its sections out — rather than let them flow — needs them
 * as separate lists, and this keeps that grouping out of the markup.
 */
export function sections(blocks: Block[], level = 2): Section[] {
	const out: Section[] = [];
	let current: Section = { heading: null, blocks: [] };

	for (const block of blocks) {
		if (block.type === 'heading' && block.level === level) {
			if (current.heading || current.blocks.length) out.push(current);
			current = { heading: block, blocks: [] };
		} else {
			current.blocks.push(block);
		}
	}

	if (current.heading || current.blocks.length) out.push(current);
	return out;
}
