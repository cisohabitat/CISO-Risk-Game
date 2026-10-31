import { version } from '../../package.json'

export const APP_VERSION = version
export const RELEASE_NOTES_URL = '/release-notes'

export const APP_REVISION = typeof __APP_REVISION__ === 'undefined' ? 'local' : __APP_REVISION__
