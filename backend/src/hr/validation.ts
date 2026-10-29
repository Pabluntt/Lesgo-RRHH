import { BadRequestException } from '@nestjs/common'

export const managerRoles = ['Administrador', 'Jefe RRHH']

// Saldo inicial de demostración: sin devengo ni reinicio anual.
export const initialVacationDays = 15

export function email(value: unknown) {
  const normalized = text(value, 'Correo', 150).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new BadRequestException('Correo inválido')
  return normalized
}

export function text(value: unknown, label: string, max = 100): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new BadRequestException(`${label} es obligatorio (máximo ${max} caracteres)`)
  return value.trim()
}

export function rut(value: unknown) {
  const normalized = text(value, 'RUT', 15).replace(/\./g, '').toUpperCase()
  if (!/^\d{7,8}-[0-9K]$/.test(normalized)) throw new BadRequestException('RUT inválido: utiliza 12345678-5')
  const [body, check] = normalized.split('-')
  let sum = 0
  Array.from(body).reverse().forEach((digit, index) => { sum += Number(digit) * (2 + index % 6) })
  const remainder = 11 - sum % 11
  if (check !== (remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder))) throw new BadRequestException('RUT incorrecto')
  return normalized
}

export function date(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new BadRequestException('Fecha inválida')
  return value
}

// Calendario demo: lunes a viernes, sin feriados hasta integrar calendario empresarial.
export function businessDays(start: string, end: string) {
  date(start); date(end)
  if (end < start || (Date.parse(end) - Date.parse(start)) / 86400000 > 366) throw new BadRequestException('Rango de fechas inválido (máximo 366 días)')
  let days = 0
  for (let time = Date.parse(start); time <= Date.parse(end); time += 86400000) {
    const day = new Date(time).getUTCDay()
    if (day !== 0 && day !== 6) days++
  }
  return days
}
