//  "start": "json-server --static . --watch data.json --middlewares ./reflect"
module.exports = function jsonServerReflect(req, res, next) {
  if (req.method === 'POST' && req.url === '/reflect') {
    console.log('reflecting back', req.body)

    // special rule for a single sent number
    // always send the absolute value back
    if ('num' in req.body) {
      const x = Number(req.body.num)
      res.json({ num: Math.abs(x) })
      return
    }

    res.json(req.body)
    return
  }

  return next(req, res)
}
