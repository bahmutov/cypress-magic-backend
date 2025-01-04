function diff(previous, current) {
  if (typeof previous === 'string') {
    if (typeof current === 'string') {
      return
    }

    const currentType = typeof current
    if (currentType === 'undefined') {
      return `string "${previous}" became undefined`
    }
    return `string "${previous}" became ${currentType} ${current}`
  }
}

module.exports = { diff }
