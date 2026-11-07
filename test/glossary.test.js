import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizePinyin, stripTones, matchesQuery, searchWords, hasDuplicate, validateWord,
  loadState, saveState, addGlossary, renameGlossary, deleteGlossary, addWord, updateWord, deleteWord,
} from '../glossary.js'

const memory = () => {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }
}
const w = { id: '1', hanzi: '你好', pinyin: 'nǐ hǎo', russian: 'привет, здравствуйте', example: '' }

test('normalizePinyin converts digits to tone marks', () => {
  assert.equal(normalizePinyin('ni3 hao3'), 'nǐ hǎo')
  assert.equal(normalizePinyin('lv4'), 'lǜ')
  assert.equal(normalizePinyin('gou3 hui2'), 'gǒu huí')
  assert.equal(normalizePinyin('liu2'), 'liú')
  assert.equal(normalizePinyin('nǐ  hǎo '), 'nǐ hǎo')
  assert.equal(normalizePinyin('ma5'), 'ma')
})

test('stripTones removes marks', () => {
  assert.equal(stripTones('Nǐ hǎo'), 'ni hao')
  assert.equal(stripTones('lǜ'), 'lv')
})

test('matchesQuery by hanzi, pinyin and russian', () => {
  assert.ok(matchesQuery(w, '你'))
  assert.ok(matchesQuery(w, 'nǐ hǎo'))
  assert.ok(matchesQuery(w, 'nihao'))
  assert.ok(matchesQuery(w, 'ni3hao3'))
  assert.ok(matchesQuery(w, 'ПРИВЕТ'))
  assert.ok(matchesQuery(w, ''))
  assert.ok(!matchesQuery(w, 'xyz'))
})

test('searchWords filters', () => {
  assert.equal(searchWords([w, { ...w, id: '2', hanzi: '谢谢', pinyin: 'xiè xie', russian: 'спасибо' }], 'xiexie').length, 1)
})

test('hasDuplicate and validateWord', () => {
  assert.ok(hasDuplicate([w], ' 你好 '))
  assert.ok(!hasDuplicate([w], '你好', '1'))
  assert.equal(validateWord([w], { hanzi: '', russian: 'x' }), 'Заполните китайское слово и перевод')
  assert.equal(validateWord([w], { hanzi: '你好', russian: 'x' }), 'Такое слово уже есть в этой сфере')
  assert.equal(validateWord([w], { hanzi: '谢谢', russian: 'x' }), null)
})

test('storage roundtrip and bad data', () => {
  const s = memory()
  assert.deepEqual(loadState(s), { glossaries: [] })
  s.setItem('zh-glossaries', 'not json')
  assert.deepEqual(loadState(s), { glossaries: [] })
  saveState(s, { glossaries: [{ id: 'a', name: 'x', words: [] }] })
  assert.equal(loadState(s).glossaries[0].name, 'x')
})

test('glossary add, rename, delete', () => {
  let r = addGlossary({ glossaries: [] }, ' Медицина ')
  assert.equal(r.state.glossaries[0].name, 'Медицина')
  assert.ok(addGlossary(r.state, 'медицина').error)
  assert.ok(addGlossary(r.state, ' ').error)
  const id = r.id
  const r2 = renameGlossary(r.state, id, 'IT')
  assert.equal(r2.state.glossaries[0].name, 'IT')
  assert.ok(renameGlossary(r2.state, id, '').error)
  assert.equal(deleteGlossary(r2.state, id).glossaries.length, 0)
})

test('word add, update, delete', () => {
  const { state, id } = addGlossary({ glossaries: [] }, 'Бизнес')
  let r = addWord(state, id, { hanzi: '公司', pinyin: 'gong1 si1', russian: 'компания', example: '' })
  assert.equal(r.state.glossaries[0].words[0].pinyin, 'gōng sī')
  r = addWord(r.state, id, { hanzi: '钱', pinyin: '', russian: 'деньги' })
  assert.equal(r.state.glossaries[0].words[0].hanzi, '钱')
  assert.ok(addWord(r.state, id, { hanzi: '钱', russian: 'x' }).error)
  const wid = r.state.glossaries[0].words[0].id
  const u = updateWord(r.state, id, wid, { hanzi: '钱', pinyin: 'qian2', russian: 'деньги, монета', example: 'a' })
  assert.equal(u.state.glossaries[0].words[0].pinyin, 'qián')
  assert.ok(updateWord(r.state, id, wid, { hanzi: '公司', russian: 'x' }).error)
  assert.equal(deleteWord(u.state, id, wid).glossaries[0].words.length, 1)
})
