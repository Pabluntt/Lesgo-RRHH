import { FormEvent, useRef, useState } from 'react'
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
    <p>Registra nombre, apellido y correo aquí. El empleado iniciará sesión con su correo y completará teléfono, dirección y fecha de nacimiento la primera vez.</p>
    <label>Correo (usuario de acceso)<input name="email" type="email" required maxLength={150} autoComplete="off" /></label>
    <label>Contraseña inicial<input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" /></label>
    <label>Nombre del empleado<input name="name" required maxLength={100} /></label>
    <label>Apellido del empleado<input name="surname" required maxLength={100} autoComplete="family-name" /></label>
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
    <p>RUT: <strong>{employee.rut}</strong> · Correo: <strong>{employee.email}</strong></p>
    <label>Fecha de nacimiento<input name="birthDate" type="date" required max={new Date().toISOString().slice(0, 10)} /></label>
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

export function VacationForm({ token, employee, onSaved }: Props & { employee: Employee }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const days = daysBetween(start, end)
  const available = employee.vacationDays ?? 0
  const state = useSubmit(token, '/hr/vacations', async () => { await onSaved(); dialog.current?.close(); setStart(''); setEnd('') })
  return <>
    <button className="primary-button" onClick={() => dialog.current?.showModal()}>+ Solicitar vacaciones</button>
    <dialog ref={dialog} className="vacation-dialog" aria-labelledby="vacation-title">
      <form className="people-form" onSubmit={event => state.submit(event, { employeeId: employee.id, startDate: start, endDate: end })}>
        <h2 id="vacation-title">Nueva solicitud de vacaciones</h2>
        <p>Saldo disponible: <strong>{available} días hábiles</strong> (descontadas solicitudes pendientes y aprobadas).</p>
        <label>Inicio<input type="date" required min={new Date().toISOString().slice(0, 10)} value={start} onChange={event => setStart(event.target.value)} /></label>
        <label>Fin<input type="date" required min={start || new Date().toISOString().slice(0, 10)} value={end} onChange={event => setEnd(event.target.value)} /></label>
        <p>Días hábiles solicitados: <strong>{days}</strong>. Calendario de prueba: lunes a viernes, sin feriados.</p>
        {days > available && <p role="alert">La solicitud supera el saldo disponible.</p>}
        <FormStatus {...state} />
        <button className="primary-button" disabled={state.busy || days < 1 || days > available}>Enviar solicitud</button>
        <button className="reject-button" type="button" disabled={state.busy} onClick={() => dialog.current?.close()}>Cancelar</button>
      </form>
    </dialog>
  </>
}

function FormStatus({ error, success }: { error: string; success: string }) {
  return <>{error && <p role="alert" className="alert alert-error">{error}</p>}{success && <p role="status" className="alert alert-success">{success}</p>}</>
}
