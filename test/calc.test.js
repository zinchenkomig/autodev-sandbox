import { test } from 'node:test'
import assert from 'node:assert/strict'
import { add, multiply } from '../calc.js'

test('add', () => {
  assert.equal(add(2, 3), 5)
})

test('multiply', () => {
  assert.equal(multiply(2, 3), 6)
  assert.equal(multiply(-4, 5), -20)
  assert.equal(multiply(7, 0), 0)
})
