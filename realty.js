export const PRICE_PER_M2 = {
  ЦАО: 450000, САО: 260000, СВАО: 245000, ВАО: 230000, ЮВАО: 215000, ЮАО: 235000,
  ЮЗАО: 285000, ЗАО: 310000, СЗАО: 280000, ЗелАО: 195000, НАО: 175000, ТАО: 165000,
}

export const CHECKLIST = [
  'Собственник из выписки ЕГРН совпадает с продавцом',
  'Паспорт продавца проверен',
  'Нет обременений, ареста и залога',
  'Нет прописанных несовершеннолетних',
  'Есть согласие супруга',
  'История переходов права не слишком частая (мало недавних сделок)',
  'Основание владения понятно (договор, наследство и т. п.)',
]

export function pricePerM2(area, price) {
  if (!(area > 0) || !(price > 0) || !Number.isFinite(area) || !Number.isFinite(price)) return null
  return price / area
}

export function deviationPercent(perM2, average) {
  return ((perM2 - average) / average) * 100
}

export function verdict(percent) {
  const p = Math.round(Math.abs(percent))
  if (Math.abs(percent) <= 5) return 'в рынке'
  return percent < 0 ? `дешевле рынка на ${p}%` : `дороже рынка на ${p}%`
}

export function isSuspiciouslyCheap(percent) {
  return percent < -30
}

export function compare(district, area, price) {
  const average = PRICE_PER_M2[district]
  if (average === undefined) return { error: 'Выберите район' }
  const perM2 = pricePerM2(area, price)
  if (perM2 === null) return { error: 'Введите площадь и цену больше нуля' }
  const percent = deviationPercent(perM2, average)
  return { perM2, average, percent, verdict: verdict(percent), suspicious: isSuspiciouslyCheap(percent) }
}

export function checklistResult(checked) {
  const risks = CHECKLIST.filter((_, i) => !checked[i])
  return { ok: risks.length === 0, risks }
}
