/**
 * The resume.
 *
 * The Markdown next door is the canonical text: it is what the page renders,
 * it is reviewed in a diff, and it does not depend on the database being
 * reachable. The PDF is the copy to send
 * along and is served straight off disk by Go.
 */
import source from './resume.md?raw';

export const RESUME_MD = source;

export const RESUME_PDF_URL = '/media/docs/Jerrod%20Tanner%20Resume.pdf';
