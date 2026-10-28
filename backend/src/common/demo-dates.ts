export const demoToday = new Date()

export function asDate(offsetDays: number) {
  const date = new Date(demoToday)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}
