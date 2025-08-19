// @ts-check

function inspectReportConsole(
  recordsLoadedForThisTest,
  apiCallsInThisTest,
) {
  console.log('API call comparisons')
  apiCallsInThisTest.forEach((apiCall, k) => {
    console.group(
      `API call ${k + 1} ${apiCall.method} ${apiCall.url}`,
    )
    console.log(
      '🚨 \trequest\t%o\tresponse\t%o',
      apiCall.request,
      apiCall.response,
    )
    const previouslyRecorded = recordsLoadedForThisTest
      .map((recorded) => {
        return {
          testState: recorded.testState,
          call: recorded.apiCallsInThisTest[k],
        }
      })
      // remove previously recorded tests that do not have this API call
      .filter((r) => r.call)
      // arrange so that the most recent calls are first
      .reverse()
    // should we grab the last N calls?

    previouslyRecorded.forEach((r) => {
      console.log(
        `%s \trequest\t%o\tresponse\t%o`,
        r.testState === 'passed' ? '✅' : '🚨',
        r.call.request,
        r.call.response,
      )
    })

    console.groupEnd()
  })
}

function inspectReportTerminal(
  recordsLoadedForThisTest,
  apiCallsInThisTest,
) {
  let strings = ['API call comparisons']
  let hasFailures = false

  apiCallsInThisTest.forEach((apiCall, k) => {
    strings.push(`API call ${k + 1} ${apiCall.method} ${apiCall.url}`)
    strings.push(
      `🚨\trequest\t${JSON.stringify(apiCall.request)}\tresponse\t${JSON.stringify(apiCall.response)}`,
    )
    const previouslyRecorded = recordsLoadedForThisTest
      .map((recorded) => {
        return {
          testState: recorded.testState,
          call: recorded.apiCallsInThisTest[k],
        }
      })
      // remove previously recorded tests that do not have this API call
      .filter((r) => r.call)
      // arrange so that the most recent calls are first
      .reverse()
    // should we grab the last N calls?

    previouslyRecorded.forEach((r) => {
      // TODO: report the diff of the API calls
      const emoji = r.testState === 'passed' ? '✅' : '🚨'
      if (r.testState !== 'passed') {
        hasFailures = true
      }

      strings.push(
        `${emoji}\trequest\t${JSON.stringify(r.call.request)}\tresponse\t${JSON.stringify(r.call.response)}`,
      )
    })
  })
  const text = strings.join('\n')
  cy.task(
    'magic-backend:report',
    { failed: hasFailures, text },
    { log: false },
  )
}

module.exports = { inspectReportConsole, inspectReportTerminal }
