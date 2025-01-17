/// <reference path="./index.d.ts" />
// @ts-check

/**
 * @param {MagicBackend.StorageMode} mode
 * @return {MagicBackend.SaveLoadFunctions}
 */
function getSaveLoadFunctions(mode) {
  if (mode === 'local') {
    return require('./file-save')
  }
  if (mode === 'remote') {
    return require('./remote-storage')
  }
  throw new Error(`Invalid storage mode ${mode}`)
}

module.exports = getSaveLoadFunctions
