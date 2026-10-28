import { FormEvent, useEffect, useRef, useState } from 'react'
import { Employee, request } from './api'

type Props = { token: string; onSaved: () => Promise<void> }

function useSubmit(token: string, path: string, onSaved: () => Promise<void>) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>, body?: object) {
    event.preventDefault()
    const form = event.currentTarget
    setBusy(true); setError(''); setSuccess('')
    try {
      await request(path, token, { method: 'POST', body: JSON.stringify(body ?? Object.fromEntries(new FormData(form))) })
      await onSaved()
      form.reset()
      setSuccess('Guardado correctamente.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally { setBusy(false) }
  }
  return { busy, error, success, submit }
}

export function UserForm({ token, roles, onSaved }: Props & { roles: string[] }) {
  const state = useSubmit(token, '/hr/users', onSaved)
  return <form className="people-form data-card" onSubmit={event => state.submit(event)}>
    <h2>Crear usuario y empleado asociado</h2>
    <p>El empleado completará su apellido y datos personales al iniciar sesión por primera vez.</p>
    <label>Nombre de usuario<input name="username" required maxLength={50} pattern="[a-zA-Z0-9._\-]+" autoComplete="off" /></label>
    <label>Contraseña inicial<input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" /></label>
    <label>Nombre del empleado<input name="name" required maxLength={100} /></label>
    <label>RUT<input name="rut" placeholder="12345678-5" required maxLength={15} /></label>
    <label>Rol<select name="role" required defaultValue=""><option value="" disabled>Selecciona un rol</option>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
    <FormStatus {...state} />
    <button className="primary-button" disabled={state.busy}>Crear usuario</button>
  </form>
}

export function ProfileForm({ token, employee, onSaved, onLogout }: Props & { employee: Employee; onLogout: () => void }) {
  const state = useSubmit(token, '/hr/profile', onSaved)
  return <main className="onboarding"><form className="people-form data-card" onSubmit={event => state.submit(event)}>
    <h1>Completa tu perfil</h1><p>Hola, {employee.name}. Completa estos datos para acceder al módulo.</p>
    <p>RUT: <strong>{employee.rut}</strong></p>
    <label>Apellido<input name="surname" required maxLength={100} autoComplete="family-name" /></label>
    <label>Fecha de nacimiento<input name="birthDate" type="date" required max={new Date().toISOString().slice(0, 10)} /></label>
    <label>Correo<input name="email" type="email" required maxLength={150} autoComplete="email" /></label>
    <label>Teléfono<input name="phone" type="tel" required maxLength={30} autoComplete="tel" /></label>
    <label>Dirección<input name="address" required maxLength={255} autoComplete="street-address" /></label>
    <FormStatus {...state} /><button className="primary-button" disabled={state.busy}>Guardar y continuar</button>
    <button type="button" className="reject-button" onClick={onLogout}>Cerrar sesión</button>
  </form></main>
}

function daysBetween(start: string, end: string) {
  if (!start || !end || end < start || Date.parse(end) - Date.parse(start) > 366 * 86400000) return 0
  let days = 0
  for (let time = Date.parse(start); time <= Date.parse(end); time += 86400000) {
    if (![0, 6].includes(new Date(time).getUTCDay())) days++
  }
  return days
}

export function VacationForm({ token, employees, onSaved }: Props & { employees: Employee[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [rut, setRut] = useState('')
  const [id, setId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const filtered = employees.filter(employee => employee.name.toLocaleLowerCase().includes(name.toLocaleLowerCase()) && (employee.rut ?? '').replace(/\./g, '').toUpperCase().includes(rut.replace(/\./g, '').toUpperCase()))
  const employee = filtered.find(item => item.id === Number(id))
  const days = daysBetween(start, end)
  const state = useSubmit(token, '/hr/vacations', async () => { await onSaved(); dialog.current?.close(); setStart(''); setEnd('') })
  useEffect(() => { if (!filtered.some(item => item.id === Number(id))) setId('') }, [name, rut, id, filtered])
  return <div className="vacation-toolbar">
    <button className="primary-button" onClick={() => dialog.current?.showModal()}>+ Solicitar vacaciones</button>
    <dialog ref={dialog} className="vacation-dialog" aria-labelledby="vacation-title">
      <form className="people-form" onSubmit={event => state.submit(event, { employeeId: Number(id), startDate: start, endDate: end })}>
        <h2 id="vacation-title">Nueva solicitud de vacaciones</h2>
        <label>Buscar por nombre<input value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Buscar por RUT<input value={rut} onChange={event => setRut(event.target.value)} placeholder="12345678-5" /></label>
        <label>Empleado<select required value={id} onChange={event => setId(event.target.value)}><option value="">Selecciona un empleado</option>{filtered.map(item => <option key={item.id} value={item.id}>{item.name} — {item.rut}</option>)}</select></label>
        {!filtered.length && <p>No hay empleados que coincidan con la búsqueda.</p>}
        {employee && <p>Saldo disponible: <strong>{employee.vacationDays} días hábiles</strong> (descontadas solicitudes pendientes y aprobadas).</p>}
        <label>Inicio<input type="date" required min={new Date().toISOString().slice(0, 10)} value={start} onChange={event => setStart(event.target.value)} /></label>
        <label>Fin<input type="date" required min={start || new Date().toISOString().slice(0, 10)} value={end} onChange={event => setEnd(event.target.value)} /></label>
        <p>Días hábiles solicitados: <strong>{days}</strong>. Calendario de prueba: lunes a viernes, sin feriados.</p>
        {employee && days > (employee.vacationDays ?? 0) && <p role="alert">La solicitud supera el saldo disponible.</p>}
        <FormStatus {...state} />
        <button className="primary-button" disabled={state.busy || !employee || days < 1 || days > (employee.vacationDays ?? 0)}>Enviar solicitud</button>
        <button className="reject-button" type="button" disabled={state.busy} onClick={() => dialog.current?.close()}>Cancelar</button>
      </form>
    </dialog>
  </div>
}

function FormStatus({ error, success }: { error: string; success: string }) {
  return <>{error && <p role="alert" className="alert alert-error">{error}</p>}{success && <p role="status" className="alert alert-success">{success}</p>}</>
}
