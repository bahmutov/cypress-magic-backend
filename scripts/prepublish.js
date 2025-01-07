console.log('removing scripts from package.json')

const fs = require('fs')
const path = require('path')

const rootFolder = path.join(__dirname, '..')
const packageFilename = path.join(rootFolder, 'package.json')
const pkg = JSON.parse(fs.readFileSync(packageFilename, 'utf8'))

delete pkg.scripts
fs.writeFileSync(packageFilename, JSON.stringify(pkg, null, 2))
