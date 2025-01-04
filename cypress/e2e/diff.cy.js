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
