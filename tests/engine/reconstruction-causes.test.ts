import { expect, it } from 'vitest'
import { testIndex } from './helpers'
import { newGame } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'
import { buildReconstruction } from '@/game/incidents/engine'

// Practitioner account, 14 November: the reconstruction did not say whether
// MFA was missing, bypassed or ineffective, and ransomware explained its
// cause far less than a data exposure did.
function portal(mfa: { coverage: number; exceptionRate: number }) {
  const index = testIndex()
  const state = newGame(index, { seed: 'reconstruction-causes' })
  Object.assign(state.controls.controls['ctl-mfa']!, mfa, { operationalEffectiveness: 0.5 })
  const incident = createIncident(state, index, { familyId: 'fam-data-breach', pathId: 'path-portal-credential' })!
  return buildReconstruction(state, index, incident).hurt.join(' | ')
}

it('says whether MFA was missing, bypassed or ineffective', () => {
  expect(portal({ coverage: 0.4, exceptionRate: 0.1 })).toContain('MFA was missing')
  expect(portal({ coverage: 0.65, exceptionRate: 0.3 })).toContain('MFA was bypassed')
  expect(portal({ coverage: 0.65, exceptionRate: 0.1 })).toContain('MFA was in place but ineffective')
})

it('names how ransomware ran and spread, without a generic line repeating it', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'reconstruction-causes' })
  state.controls.controls['ctl-edr']!.coverage = 0.3
  state.controls.controls['ctl-segmentation']!.coverage = 0.3
  const incident = createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-backup-ransom' })!
  const { hurt } = buildReconstruction(state, index, incident)
  expect(hurt).toContain('Encryption tooling that ran on servers where nothing was watching for it')
  expect(hurt).toContain('A flat network that let the encryption spread from the first server across the file and application estate')
  expect(hurt.some((line) => line.startsWith('Endpoint detection and response covered') || line.startsWith('Network segmentation covered'))).toBe(false)
})
