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
  expect(diff(42, 'hello')).to.equal('number 42 became string hello')
})

it('compares objects with other types', () => {
  expect(diff({ foo: 'bar' }, 42)).to.equal('object became number 42')
  expect(diff({ foo: 'bar' }, 'hello')).to.equal(
    'object became string hello',
  )
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
  expect(diff({ foo: 'bar' }, {})).to.equal('object lost keys "foo"')
  expect(diff({ foo: 'bar' }, { bar: 'baz' })).to.equal(
    'object added keys "bar" and lost keys "foo"',
  )
})
