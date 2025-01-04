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

  if (typeof previous === 'object') {
    if (current === null) {
      return `object became null`
    }

    if (typeof current !== 'object') {
      const currentType = typeof current
      if (currentType === 'undefined') {
        return `object became undefined`
      }
      return `object became ${currentType} ${current}`
    }

    if (typeof current === 'object') {
      const previousKeys = Object.keys(previous)
      const currentKeys = Object.keys(current)
      const addedKeys = currentKeys.filter(
        (key) => !previousKeys.includes(key),
      )
      const lostKeys = previousKeys.filter(
        (key) => !currentKeys.includes(key),
      )
      if (addedKeys.length || lostKeys.length) {
        const changes = []
        if (addedKeys.length) {
          const label = addedKeys.length === 1 ? 'key' : 'keys'
          changes.push(`added ${label} "${addedKeys.join(', ')}"`)
        }
        if (lostKeys.length) {
          const label = lostKeys.length === 1 ? 'key' : 'keys'
          changes.push(`lost ${label} "${lostKeys.join(', ')}"`)
        }
        return `object ${changes.join(' and ')}`
      }
    }
  }
}

module.exports = { diff }
