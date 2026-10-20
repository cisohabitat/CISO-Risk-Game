import type { CameBackItem } from '@/store/selectors'

/** One set of public labels for the Briefing and correspondence reader. */
export const MESSAGE_RETURN_LABEL: Record<CameBackItem['kind'], string> = {
  result: 'Enquiry returned',
  consequence: 'Follow-up to a choice',
  lapse: 'Decided for you',
  acceptance: 'Acceptance ran out',
  stopped: 'Work pulled back',
  incident: 'Incident update',
}
