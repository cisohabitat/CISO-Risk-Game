import base from './playwright.config'

/** Same setup as the test suite, but only the player guide's screenshots. */
export default { ...base, testIgnore: undefined, testMatch: ['**/guide-shots.spec.ts'] }
