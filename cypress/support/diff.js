function namedStringify(x) {
  if (x === null) {
    return 'null'
  }

  const t = typeof x
  if (t === 'undefined') {
    return 'undefined'
  }
  return `${t} ${JSON.stringify(x)}`
}

function diff(previous, current) {
  //
  // primitive types
  //
  if (typeof previous === 'string') {
    if (typeof current === 'string') {
      return
    }
    return `string "${previous}" became ${namedStringify(current)}`
  }

  if (typeof previous === 'number') {
    if (typeof current === 'number') {
      return
    }
    return `number ${previous} became ${namedStringify(current)}`
  }

  //
  // arrays
  //
  if (Array.isArray(previous)) {
    if (!Array.isArray(current)) {
      return `array became ${namedStringify(current)}`
    }

    if (previous.length < current.length) {
      return `array increased its length from ${previous.length} to ${current.length}`
    }

    if (previous.length > current.length) {
      return `array decreased its length from ${previous.length} to ${current.length}`
    }

    // compare each element inside the array
    for (let i = 0; i < previous.length; i++) {
      const diffResult = diff(previous[i], current[i])
      if (diffResult) {
        return `array element ${i} changed: ${diffResult}`
      }
    }
  }

  //
  // objects
  //
  if (typeof previous === 'object') {
    if (current === null) {
      return `object became null`
    }

    if (typeof current !== 'object') {
      return `object became ${namedStringify(current)}`
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
