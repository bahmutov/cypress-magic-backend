/// <reference types="cypress" />
// @ts-check

function formTestRecordingFilename(currentSpec, currentTest) {
  const specName = currentSpec.relative
  const title = currentTest.titlePath.join('_').replaceAll(' ', '_')
  return `cypress/magic-backend/${specName}_${title}_api_calls.json`
}

/**
 * Loads previously recorded API calls for the current test.
 * If the file does not exist, yields null.
 *
 * @type {MagicBackend.LoadRecord}
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
 * @type {MagicBackend.SaveRecord}
 */
function saveRecord(
  currentSpec,
  currentTest,
  pluginName,
  pluginVersion,
  apiCallsInThisTest,
) {
  const filename = formTestRecordingFilename(currentSpec, currentTest)
  /** @type {MagicBackend.TestApiRecordData} */
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
  loadRecord,
  saveRecord,
}
