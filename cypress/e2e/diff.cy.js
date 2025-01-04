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

it('compares objects with keys', () => {
  expect(diff({ foo: 'bar' }, { foo: 'bar' })).to.be.undefined
  expect(diff({ foo: 'bar' }, {})).to.equal('object lost keys "foo"')
  expect(diff({ foo: 'bar' }, { bar: 'baz' })).to.equal(
    'object added keys "bar" and lost keys "foo"',
  )
})
