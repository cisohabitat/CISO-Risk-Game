import base from './playwright.config'

/** Same setup as the test suite, but only the screenshot gallery. */
export default { ...base, testIgnore: undefined, testMatch: ['**/screenshots.spec.ts'] }
