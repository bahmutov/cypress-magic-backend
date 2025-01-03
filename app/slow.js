// slow down every API request by 1 second
// for json-server using this file as middleware
// in your package.json:
//  "start": "json-server --static . --watch data.json --middlewares ./slow"
module.exports = function jsonServerReset(req, res, next) {
  setTimeout(next, 1000)
}
