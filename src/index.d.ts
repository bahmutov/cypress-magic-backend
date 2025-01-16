// https://github.com/bahmutov/cypress-magic-backend

declare namespace MagicBackend {
  interface ApiCallRecord {
    method: string
    url: string
    request: string | object
    response: string | object
    duration: number
  }

  interface TestApiRecordData {
    pluginName: string
    pluginVersion: string
    specName: string
    testName: string
    apiCallsInThisTest: ApiCallRecord[]
  }

  type LoadRecord = (
    currentSpec: Cypress.Spec,
    currentTest: typeof Cypress.currentTest,
  ) => Cypress.Chainable<TestApiRecordData | null>

  type SaveRecord = (
    currentSpec: Cypress.Spec,
    currentTest: typeof Cypress.currentTest,
    pluginName: string,
    pluginVersion: string,
    apiCallsInThisTest: ApiCallRecord[],
  ) => Cypress.Chainable<null>

  interface UserConfig {
    mode:
      | 'record'
      | 'replay'
      | 'playback-only'
      | 'inspect'
      // aliases and synonyms
      | 'recording'
      | 'play'
      | 'playing'
      | 'playback'
      | 'inspecting'
      | 'observe'
      | 'observing'
    store: 'local' | 'remote'
  }
}

//
// Cypress ambient type extensions
//
declare namespace Cypress {
  // https://glebbahmutov.com/blog/cypress-env-types/
  interface Cypress {
    env(key: 'magicBackend'): Partial<UserConfig>
    env(key: 'magicBackend', value: Partial<UserConfig>): void
  }
}

// TODO: extend types to support "window.top" settings
