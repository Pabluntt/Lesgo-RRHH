const { test } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')

test('Usuarios, perfil inicial, permisos y reserva de días hábiles', async () => {
  const server = spawn(process.execPath, ['backend/dist/main.js'], { env: { ...process.env, PORT: '3109' }, stdio: ['ignore', 'ignore', 'inherit'] })
  const base = 'http://localhost:3109'
  async function api(path, token, body, status = 200) {
    const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined })
    const result = await response.json()
    assert.equal(response.status, status, JSON.stringify(result))
    return result
  }
  try {
    let ready = false
    for (let i = 0; i < 60; i++) {
      try { await fetch(base); ready = true; break } catch { await new Promise(resolve => setTimeout(resolve, 100)) }
    }
    assert.ok(ready, 'Backend iniciado')
    const admin = (await api('/auth/login', '', { username: 'admin', password: 'admin123' }, 201)).accessToken
    const payload = { username: 'prueba', password: 'Prueba123!', name: 'Prueba', surname: 'Apellido', rut: '12345678-5', role: 'Analista' }
    await api('/hr/users', admin, { ...payload, surname: '' }, 400)
    await api('/hr/users', admin, { ...payload, rut: '12345678-1' }, 400)
    const user = await api('/hr/users', admin, payload, 201)
    await api('/hr/users', admin, payload, 400)
    await api('/hr/users', admin, { ...payload, username: 'otro' }, 400)
    const token = (await api('/auth/login', '', { username: 'prueba', password: 'Prueba123!' }, 201)).accessToken
    let dashboard = await api('/hr/dashboard', token)
    assert.equal(dashboard.account.employee.profileComplete, false)
    assert.equal(dashboard.employees.length, 1)
    const vacation = { employeeId: user.employeeId, startDate: '2030-03-01', endDate: '2030-03-04' }
    await api('/hr/vacations', token, vacation, 403)
    await api('/hr/profile', token, { email: 'prueba@example.test', phone: '+56912345678', address: 'Calle de prueba 123', birthDate: '1990-01-01' }, 201)
    assert.equal((await api('/hr/dashboard', token)).account.employee.surname, 'Apellido')
    await api('/hr/users', token, { ...payload, username: 'ilegal' }, 403)
    await api('/hr/vacations', token, { ...vacation, employeeId: 1 }, 403)
    await api('/hr/vacations', token, { ...vacation, startDate: '2030-03-02', endDate: '2030-03-03' }, 400)
    await api('/hr/vacations', token, { ...vacation, startDate: '2030-02-30' }, 400)
    const created = await api('/hr/vacations', token, vacation, 201)
    assert.equal(created.days, 2, 'Viernes a lunes descuenta dos días')
    await api('/hr/vacations', token, vacation, 400)
    await api('/hr/vacations', token, { ...vacation, startDate: '2030-04-01', endDate: '2030-05-01' }, 400)
    dashboard = await api('/hr/dashboard', token)
    assert.equal(dashboard.employees[0].vacationDays, 13)
    await api(`/hr/requests/${created.id}/decision`, token, { decision: 'Aprobada' }, 403)
    await api(`/hr/requests/${created.id}/decision`, admin, { decision: 'Rechazada' }, 201)
    dashboard = await api('/hr/dashboard', token)
    assert.equal(dashboard.employees[0].vacationDays, 15)
    const approved = await api('/hr/vacations', token, vacation, 201)
    await api(`/hr/requests/${approved.id}/decision`, admin, { decision: 'Aprobada' }, 201)
    dashboard = await api('/hr/dashboard', token)
    assert.equal(dashboard.employees[0].vacationDays, 13, 'Aprobar no descuenta dos veces')
    assert.ok(dashboard.logs.some(log => log.action === 'Solicitó vacaciones' && log.employeeId === user.employeeId))
  } finally { server.kill() }
})
