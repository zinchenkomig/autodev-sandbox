import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHECKLIST, pricePerM2, deviationPercent, verdict, isSuspiciouslyCheap, compare, checklistResult } from '../realty.js'

test('pricePerM2', () => {
  assert.equal(pricePerM2(50, 10000000), 200000)
  assert.equal(pricePerM2(0, 100), null)
  assert.equal(pricePerM2(50, -1), null)
  assert.equal(pricePerM2(NaN, 100), null)
  assert.equal(pricePerM2(Infinity, 100), null)
})

test('deviationPercent', () => {
  assert.equal(deviationPercent(110, 100), 10)
  assert.equal(deviationPercent(80, 100), -20)
})

test('verdict', () => {
  assert.equal(verdict(0), 'в рынке')
  assert.equal(verdict(5), 'в рынке')
  assert.equal(verdict(-5), 'в рынке')
  assert.equal(verdict(-12), 'дешевле рынка на 12%')
  assert.equal(verdict(18.2), 'дороже рынка на 18%')
})

test('isSuspiciouslyCheap', () => {
  assert.equal(isSuspiciouslyCheap(-31), true)
  assert.equal(isSuspiciouslyCheap(-30), false)
  assert.equal(isSuspiciouslyCheap(10), false)
})

test('compare', () => {
  assert.equal(compare('', 50, 1).error, 'Выберите район')
  assert.equal(compare('ЦАО', 0, 1).error, 'Введите площадь и цену больше нуля')
  const r = compare('ЦАО', 100, 45000000)
  assert.equal(r.perM2, 450000)
  assert.equal(r.verdict, 'в рынке')
  assert.equal(r.suspicious, false)
  assert.equal(compare('ЦАО', 100, 20000000).suspicious, true)
  assert.match(compare('ЦАО', 100, 60000000).verdict, /^дороже рынка на 33%$/)
})

test('checklistResult', () => {
  assert.deepEqual(checklistResult(CHECKLIST.map(() => true)), { ok: true, risks: [] })
  const r = checklistResult([true, false])
  assert.equal(r.ok, false)
  assert.equal(r.risks.length, CHECKLIST.length - 1)
  assert.equal(r.risks[0], CHECKLIST[1])
})
