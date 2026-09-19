import base from './playwright.config'

/** Same setup as the test suite, but only the narrated playthrough. */
export default { ...base, testIgnore: undefined, testMatch: ['**/playthrough.spec.ts'] }
