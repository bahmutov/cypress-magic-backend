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

  if (typeof previous === 'number') {
    if (typeof current === 'number') {
      return
    }

    const currentType = typeof current
    if (currentType === 'undefined') {
      return `number ${previous} became undefined`
    }
    return `number ${previous} became ${currentType} ${current}`
  }
}

module.exports = { diff }
