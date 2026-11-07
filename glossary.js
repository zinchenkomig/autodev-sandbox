const STORAGE_KEY = 'zh-glossaries'

const TONES = {
  a: 'āáǎàa', e: 'ēéěèe', i: 'īíǐìi', o: 'ōóǒòo', u: 'ūúǔùu', 'ü': 'ǖǘǚǜü',
}

function markSyllable(base, tone) {
  const s = base.replace(/u:|v/gi, (m) => (m === m.toUpperCase() && m !== 'u:' ? 'Ü' : 'ü'))
  const lower = s.toLowerCase()
  let idx = lower.search(/[ae]/)
  if (idx < 0) idx = lower.includes('ou') ? lower.indexOf('o') : -1
  if (idx < 0) {
    for (let i = lower.length - 1; i >= 0; i--) {
      if ('iouü'.includes(lower[i])) { idx = i; break }
    }
  }
  if (idx < 0) return s
  const ch = s[idx]
  const marked = TONES[ch.toLowerCase()][tone - 1]
  return s.slice(0, idx) + (ch === ch.toUpperCase() ? marked.toUpperCase() : marked) + s.slice(idx + 1)
}

export function normalizePinyin(text) {
  return String(text ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/([a-zA-Zü]+(?::)?)([1-5])/g, (_, base, tone) => markSyllable(base, Number(tone)))
}

export function stripTones(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/ü/g, 'v')
    .replace(/Ü/g, 'V')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function pinyinKey(text) {
  return stripTones(normalizePinyin(text)).replace(/\s+/g, '')
}

export function matchesQuery(word, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true
  if (word.hanzi.toLowerCase().includes(q)) return true
  if (word.russian.toLowerCase().includes(q)) return true
  const pq = pinyinKey(q)
  return pq !== '' && pinyinKey(word.pinyin).includes(pq)
}

export function searchWords(words, query) {
  return words.filter((w) => matchesQuery(w, query))
}

export function hasDuplicate(words, hanzi, exceptId = null) {
  const h = String(hanzi ?? '').trim()
  return words.some((w) => w.id !== exceptId && w.hanzi === h)
}

export function validateWord(words, input, exceptId = null) {
  const hanzi = String(input.hanzi ?? '').trim()
  const russian = String(input.russian ?? '').trim()
  if (!hanzi || !russian) return 'Заполните китайское слово и перевод'
  if (hasDuplicate(words, hanzi, exceptId)) return 'Такое слово уже есть в этой сфере'
  return null
}

function cleanWord(input) {
  return {
    hanzi: String(input.hanzi).trim(),
    pinyin: normalizePinyin(input.pinyin),
    russian: String(input.russian).trim(),
    example: String(input.example ?? '').trim(),
  }
}

let counter = 0
function newId() {
  counter += 1
  return Date.now().toString(36) + counter.toString(36) + Math.random().toString(36).slice(2, 6)
}

export function loadState(storage) {
  try {
    const data = JSON.parse(storage.getItem(STORAGE_KEY))
    if (data && Array.isArray(data.glossaries)) return data
  } catch {}
  return { glossaries: [] }
}

export function saveState(storage, state) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function addGlossary(state, name) {
  const n = String(name ?? '').trim()
  if (!n) return { state, error: 'Введите название сферы' }
  if (state.glossaries.some((g) => g.name.toLowerCase() === n.toLowerCase())) {
    return { state, error: 'Такая сфера уже есть' }
  }
  const glossary = { id: newId(), name: n, words: [] }
  return { state: { glossaries: [...state.glossaries, glossary] }, id: glossary.id }
}

export function renameGlossary(state, id, name) {
  const n = String(name ?? '').trim()
  if (!n) return { state, error: 'Введите название сферы' }
  if (state.glossaries.some((g) => g.id !== id && g.name.toLowerCase() === n.toLowerCase())) {
    return { state, error: 'Такая сфера уже есть' }
  }
  return { state: { glossaries: state.glossaries.map((g) => (g.id === id ? { ...g, name: n } : g)) } }
}

export function deleteGlossary(state, id) {
  return { glossaries: state.glossaries.filter((g) => g.id !== id) }
}

function updateGlossary(state, id, fn) {
  return { glossaries: state.glossaries.map((g) => (g.id === id ? fn(g) : g)) }
}

export function addWord(state, glossaryId, input) {
  const g = state.glossaries.find((x) => x.id === glossaryId)
  if (!g) return { state, error: 'Сфера не найдена' }
  const error = validateWord(g.words, input)
  if (error) return { state, error }
  const word = { id: newId(), ...cleanWord(input) }
  return { state: updateGlossary(state, glossaryId, (x) => ({ ...x, words: [word, ...x.words] })) }
}

export function updateWord(state, glossaryId, wordId, input) {
  const g = state.glossaries.find((x) => x.id === glossaryId)
  if (!g) return { state, error: 'Сфера не найдена' }
  const error = validateWord(g.words, input, wordId)
  if (error) return { state, error }
  const clean = cleanWord(input)
  return {
    state: updateGlossary(state, glossaryId, (x) => ({
      ...x, words: x.words.map((w) => (w.id === wordId ? { ...w, ...clean } : w)),
    })),
  }
}

export function deleteWord(state, glossaryId, wordId) {
  return updateGlossary(state, glossaryId, (g) => ({ ...g, words: g.words.filter((w) => w.id !== wordId) }))
}
