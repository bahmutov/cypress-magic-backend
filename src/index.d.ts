// https://github.com/bahmutov/cypress-magic-backend
/// <reference types="cypress" />

declare namespace MagicBackend {
  // TODO: how to get the actual exported type?
  type RouteMatcher =
    import('cypress/types/net-stubbing.d.ts').RouteMatcher

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
    testState?: 'passed' | 'failed'
  }

  type LoadRecordFindInfo = {
    specName: string
    testName: string
  }

  type LoadRecord = (
    currentSpec: Cypress.Spec,
    currentTest: typeof Cypress.currentTest,
  ) =>
    | Cypress.Chainable<TestApiRecordData>
    | Cypress.Chainable<TestApiRecordData[]>
    | Cypress.Chainable<null>

  type SaveRecord = (
    currentSpec: Cypress.Spec,
    currentTest: typeof Cypress.currentTest,
    pluginName: string,
    pluginVersion: string,
    apiCallsInThisTest: ApiCallRecord[],
    testState?: 'passed' | 'failed',
  ) => Cypress.Chainable<null>

  type SaveLoadFunctions = {
    loadRecord: LoadRecord
    saveRecord: SaveRecord
  }

  type StorageMode = 'local' | 'remote'

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
    /**
     * Where should this plugin store recorded API calls? By default, it stores them
     * in the local file system. You can change this to "remote" to store them in the
     * cloud (for example, in the Magic Backend service).
     */
    store: StorageMode
    /**
     * When running in the "inspect" mode, the plugin will measure the difference
     * in duration between the recorded calls and the actual calls and warn about
     * every call that takes longer or is faster by this threshold (ms).
     */
    apiCallDurationDifferenceThreshold: number
    /**
     * Network requests that should be intercepted and recorded.
     * You can specify a single endpoint or a list of endpoints,
     * following the `cy.intercept` syntax.
     *
     * @example
     *    apiCallsToIntercept: { method: 'GET',  pathname: '/api/users' }
     */
    apiCallsToIntercept: RouteMatcher | RouteMatcher[]
  }
}

//
// Cypress ambient type extensions
//
declare namespace Cypress {
  // https://glebbahmutov.com/blog/cypress-env-types/
  interface Cypress {
    env(key: 'magicBackend'): Partial<MagicBackend.UserConfig>
    env(
      key: 'magicBackend',
      value: Partial<MagicBackend.UserConfig>,
    ): void
  }
}

// TODO: extend types to support "window.top" settings
