// slow down every API request by 1 second
// for json-server using this file as middleware
// in your package.json:
//  "start": "json-server --static . --watch data.json --middlewares ./slow"
module.exports = function jsonServerReset(req, res, next) {
  const defaultDelay = 1000
  // slow down certain api requests by custom timeouts
  const customSlowDowns = [
    // if you want to slow down creating new items
    // {
    //   method: 'POST',
    //   url: '/todos',
    //   delay: 2000,
    // },
  ]
  const customSlowDown = customSlowDowns.find(
    (item) => item.method === req.method && item.url === req.url,
  )
  const delay = customSlowDown?.delay || defaultDelay

  setTimeout(next, delay)
}
