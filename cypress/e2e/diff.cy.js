import { diff } from '../support/diff'

it('compares strings', () => {
  expect(diff('foo', 'foo')).to.be.undefined
  expect(diff('foo', 'bar')).to.be.undefined
  expect(diff('foo', 42)).to.equal('string "foo" became number 42')
  expect(diff('foo', true)).to.equal(
    'string "foo" became boolean true',
  )
  expect(diff('foo', undefined)).to.equal(
    'string "foo" became undefined',
  )
})

it('compares numbers', () => {
  expect(diff(42, 42)).to.be.undefined
  expect(diff(42, 43)).to.be.undefined
  expect(diff(42, 'hello')).to.equal(
    'number 42 became string "hello"',
  )
})

it('compares objects with other types', () => {
  expect(diff({ foo: 'bar' }, 42)).to.equal('object became number 42')
  expect(diff({ foo: 'bar' }, 'hello')).to.equal(
    'object became string "hello"',
  )
  expect(diff({ foo: 'bar' }, '')).to.equal('object became string ""')
  expect(diff({ foo: 'bar' }, undefined)).to.equal(
    'object became undefined',
  )
  expect(diff({ foo: 'bar' }, null)).to.equal('object became null')
})

it('compares objects with keys', () => {
  expect(diff({ foo: 'bar' }, { foo: 'bar' })).to.be.undefined
  expect(diff({}, { foo: 1, bar: 2 })).to.equal(
    'object added keys "foo, bar"',
  )
  expect(diff({ foo: 'bar' }, {})).to.equal('object lost key "foo"')
  expect(diff({ foo: 'bar' }, { bar: 'baz' })).to.equal(
    'object added key "bar" and lost key "foo"',
  )
})

it('array changes to something else', () => {
  expect(diff([], 42)).to.equal('array became number 42')
  expect(diff([], 'hello')).to.equal('array became string "hello"')
  expect(diff([], {})).to.equal('array became object {}')
})

it('compares arrays', () => {
  expect(diff([], [])).to.be.undefined
  expect(diff([], [1])).to.equal(
    'array increased its length from 0 to 1',
  )
  expect(diff([1, 2], [1])).to.equal(
    'array decreased its length from 2 to 1',
  )
})

it('compares elements in the arrays', () => {
  expect(diff([1, 2], [1, 2]), 'values can change').to.be.undefined
  expect(
    diff([1, 2], ['1', '2']),
    'values cannot change type',
  ).to.equal('array element 0 changed: number 1 became string "1"')
  expect(
    diff([1, 2], [1, false]),
    'values cannot change type boolean',
  ).to.equal('array element 1 changed: number 2 became boolean false')

  expect(
    diff([{ foo: 'bar' }], [{ foo: 'baz', bar: 'quux' }]),
    'object changes keys',
  ).to.equal('array element 0 changed: object added key "bar"')
})
