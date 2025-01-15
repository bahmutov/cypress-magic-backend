/// <reference types="cypress" />
// @ts-check

function formTestRecordingFilename(currentSpec, currentTest) {
  const specName = currentSpec.relative
  const title = currentTest.titlePath.join('_').replaceAll(' ', '_')
  return `cypress/magic-backend/${specName}_${title}_api_calls.json`
}

/**
 * @typedef { {
 *   method: string,
 *   url: string,
 *   request: string | object,
 *   response: string | object,
 *   duration: number
 * } } ApiCallRecord
 *
 * @typedef { {
 *  pluginName: string,
 *  pluginVersion: string,
 *  specName: string,
 *  testName: string,
 *  apiCallsInThisTest: ApiCallRecord[]
 * } } TestApiRecordData
 */

/**
 * Loads previously recorded API calls for the current test.
 * If the file does not exist, yields null.
 *
 * @param {Cypress.Spec} currentSpec
 * @param {typeof Cypress.currentTest} currentTest
 * @returns {Cypress.Chainable<TestApiRecordData | null>}
 */
function loadRecord(currentSpec, currentTest) {
  const filename = formTestRecordingFilename(
    Cypress.spec,
    Cypress.currentTest,
  )
  // for now assuming the file exists
  return cy.readFile(filename).should(Cypress._.noop)
}

/**
 * Saves the API calls made during the test to a file.
 *
 * @param {Cypress.Spec} currentSpec
 * @param {typeof Cypress.currentTest} currentTest
 * @param {string} pluginName The name of the plugin writing the file
 * @param {string} pluginVersion The version of the plugin writing the file
 * @param {Array<ApiCallRecord>} apiCallsInThisTest The API calls made during the test
 * @returns {Cypress.Chainable<null>}
 */
function saveRecord(
  currentSpec,
  currentTest,
  pluginName,
  pluginVersion,
  apiCallsInThisTest,
) {
  const filename = formTestRecordingFilename(currentSpec, currentTest)
  /** @type {TestApiRecordData} */
  const data = {
    pluginName: pluginName,
    pluginVersion: pluginVersion,
    specName: currentSpec.relative,
    testName: currentTest.titlePath.join(' / '),
    apiCallsInThisTest,
  }
  return cy.writeFile(filename, data)
}

module.exports = {
  formTestRecordingFilename,
  loadRecord,
  saveRecord,
}
