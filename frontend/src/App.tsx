import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AbsenceRequest,
  AuditLog,
  DashboardData,
  Employee,
  EmploymentContract,
  decideRequest,
  getDashboard,
  login,
  renewContract,
  terminateContract,
} from './api'

type Section = 'Plantilla' | 'Licencias' | 'Vacaciones' | 'Mi Cuenta' | 'Contratos' | 'Desvinculaciones'

const navItems: { name: Section; icon: string; group: string }[] = [
  { name: 'Plantilla', icon: '◉', group: 'PERSONAS' },
  { name: 'Licencias', icon: '▤', group: 'PERSONAS' },
  { name: 'Vacaciones', icon: '◷', group: 'PERSONAS' },
  { name: 'Contratos', icon: '▣', group: 'GESTIÓN' },
  { name: 'Desvinculaciones', icon: '↗', group: 'GESTIÓN' },
  { name: 'Mi Cuenta', icon: '○', group: 'CUENTA' },
]

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('lesgo-token'))
  const [section, setSection] = useState<Section>('Plantilla')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async (activeToken: string) => {
    const data = await getDashboard(activeToken)
    setDashboard(data)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    refresh(token)
      .catch(() => {
        localStorage.removeItem('lesgo-token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token, refresh])

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    if (!token) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      await refresh(token)
      setNotice(success)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Ocurrió un error')
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('lesgo-token')
    setToken(null)
    setDashboard(null)
    setSection('Plantilla')
  }

  if (loading) return <div className="loading-screen"><span className="spinner" />Cargando espacio de trabajo…</div>
  if (!token || !dashboard) {
    return <LoginScreen onLogin={(newToken) => { localStorage.setItem('lesgo-token', newToken); setLoading(true); setToken(newToken) }} />
  }

  const employee = dashboard.account.employee
  const pendingCount = dashboard.requests.filter((request) => request.status === 'Pendiente').length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">l</span><span>Lesgo</span></div>
        <div className="workspace-switch"><span className="workspace-avatar">L</span><span><b>Lesgo Company</b><small>Workspace de empresa</small></span><span className="chevron">⌄</span></div>
        <div className="nav-list">
          {navItems.map((item, index) => (
            <div key={item.group}>
              {(index === 0 || navItems[index - 1].group !== item.group) && <p className="nav-label">{item.group}</p>}
              <button className={`nav-item ${section === item.name ? 'active' : ''}`} onClick={() => { setSection(item.name); setNotice(''); setError('') }}>
                <span className="nav-icon">{item.icon}</span>{item.name}
                {item.name === 'Licencias' && pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}
              </button>
            </div>
          ))}
        </div>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">?</span><div><b>¿Necesitas ayuda?</b><small>Contacta con soporte</small></div><span>↗</span></div><div className="profile-mini"><div className="avatar avatar-indigo">{initials(employee?.name ?? 'AR')}</div><div className="profile-copy"><b>{employee?.name ?? 'Admin'}</b><small>{dashboard.account.role}</small></div><button className="logout-icon" title="Cerrar sesión" onClick={handleLogout}>↪</button></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumbs"><span>Recursos Humanos</span><span className="crumb-divider">/</span><b>{section}</b></div><div className="topbar-actions"><span className="today-label">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span><button className="icon-button notification-button" aria-label="Notificaciones">♧<i /></button><div className="avatar avatar-indigo small-avatar">{initials(employee?.name ?? 'AR')}</div></div></header>
        <div className="content-wrap">
          <div className="page-heading"><div><p className="eyebrow">ESPACIO DE TRABAJO</p><h1>{section}</h1><p className="subtitle">{sectionDescription(section)}</p></div><div className="heading-actions"><span className="live-indicator"><i /> Datos de demostración</span></div></div>
          {error && <div className="alert alert-error">{error}<button onClick={() => setError('')}>×</button></div>}
          {notice && <div className="alert alert-success">{notice}<button onClick={() => setNotice('')}>×</button></div>}
          {section === 'Plantilla' && <PeopleView employees={dashboard.employees} requests={dashboard.requests} contracts={dashboard.contracts} />}
          {section === 'Licencias' && <RequestsView kind="Licencia médica" requests={dashboard.requests} employees={dashboard.employees} busy={busy} onDecision={(id, decision) => runAction(() => decideRequest(token, id, decision), `Solicitud ${decision.toLowerCase()}.`)} />}
          {section === 'Vacaciones' && <RequestsView kind="Vacaciones" requests={dashboard.requests} employees={dashboard.employees} busy={busy} onDecision={(id, decision) => runAction(() => decideRequest(token, id, decision), `Solicitud ${decision.toLowerCase()}.`)} />}
          {section === 'Contratos' && <ContractsView contracts={dashboard.contracts} employees={dashboard.employees} busy={busy} onRenew={(id) => runAction(() => renewContract(token, id), 'Contrato renovado por un año.')} onTerminate={(id) => runAction(() => terminateContract(token, id), 'Contrato terminado anticipadamente.')} />}
          {section === 'Mi Cuenta' && <AccountView account={dashboard.account} logs={dashboard.logs} />}
          {section === 'Desvinculaciones' && <TerminationView employees={dashboard.employees} />}
          <footer className="page-footer"><span>Lesgo People <span className="footer-dot">·</span> Gestión de talento</span><span>Panel de Recursos Humanos</span></footer>
        </div>
      </main>
    </div>
  )
}

function sectionDescription(section: Section) {
  const descriptions: Record<Section, string> = {
    Plantilla: 'Conoce a las personas que hacen crecer al equipo.',
    Licencias: 'Gestiona las licencias médicas y permisos del equipo.',
    Vacaciones: 'Revisa y administra las solicitudes de vacaciones.',
    'Mi Cuenta': 'Consulta la información de tu cuenta y perfil.',
    Contratos: 'Administra vigencias, renovaciones y alertas contractuales.',
    Desvinculaciones: 'Registro de procesos de salida y finiquitos.',
  }
  return descriptions[section]
}

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await login(username, password)
      onLogin(result.accessToken)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="login-layout"><div className="login-art"><div className="login-brand"><span className="brand-mark">l</span><span>Lesgo</span></div><div className="art-copy"><span className="art-tag">PERSONAS QUE HACEN</span><h1>El trabajo,<br />más humano.</h1><p>Todo lo que necesitas para cuidar y hacer crecer a tu equipo, en un solo lugar.</p></div><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-bottom">LESGO · PEOPLE FIRST</div></div><div className="login-panel"><form className="login-form" onSubmit={submit}><div className="login-symbol">✳</div><p className="eyebrow">BIENVENIDO DE NUEVO</p><h2>Inicia sesión</h2><p className="login-subtitle">Ingresa tus credenciales para acceder al espacio de RRHH.</p>{error && <div className="alert alert-error">{error}</div>}<label htmlFor="username">Usuario</label><div className="input-wrap"><span>◎</span><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="Tu usuario" required /></div><label htmlFor="password">Contraseña</label><div className="input-wrap"><span>⌑</span><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Tu contraseña" required /></div><button className="primary-button login-submit" disabled={submitting}>{submitting ? 'Ingresando…' : 'Iniciar sesión'}<span>→</span></button><p className="demo-hint"><span>ⓘ</span> Entorno de prueba: usuario <b>admin</b> · contraseña <b>admin123</b></p></form><div className="login-footer">© 2026 Lesgo People <span>Privacidad&nbsp;&nbsp; · &nbsp;&nbsp;Ayuda</span></div></div></main>
}

function PeopleView({ employees, requests, contracts }: { employees: Employee[]; requests: AbsenceRequest[]; contracts: EmploymentContract[] }) {
  const groups = useMemo(() => employees.reduce<Record<string, Employee[]>>((result, person) => {
    ;(result[person.role] ??= []).push(person)
    return result
  }, {}), [employees])
  const present = employees.filter((employee) => employee.status === 'Presente').length
  const pending = requests.filter((request) => request.status === 'Pendiente').length
  const upcoming = contracts.filter((contract) => {
    const remaining = (new Date(`${contract.endDate}T00:00:00`).getTime() - Date.now()) / 86400000
    return contract.status === 'Vigente' && remaining >= 0 && remaining <= 30
  }).length

  return <>
    <div className="stats-grid"><StatCard label="Personas en plantilla" value={employees.length} detail="En todos los equipos" icon="♙" tone="purple" /><StatCard label="Presentes hoy" value={present} detail={`${Math.round((present / employees.length) * 100)}% de la plantilla`} icon="✓" tone="green" /><StatCard label="Solicitudes pendientes" value={pending} detail="Requieren revisión" icon="◷" tone="orange" /><StatCard label="Contratos por vencer" value={upcoming} detail="En los próximos 30 días" icon="▣" tone="blue" /></div>
    <div className="section-title-row"><div><h2>Equipos por rol</h2><p>Personas agrupadas según su rol en la organización</p></div><span className="soft-chip">{Object.keys(groups).length} equipos</span></div>
    <div className="team-grid">{Object.entries(groups).map(([role, team]) => <section className="team-card" key={role}><div className="team-header"><div><h3>{role}</h3><p>{team.length} {team.length === 1 ? 'persona' : 'personas'}</p></div><span className="team-arrow">↗</span></div><div className="team-members">{team.map((person) => <div className="team-member" key={person.id}><div className={`avatar ${person.id % 2 ? 'avatar-peach' : 'avatar-lilac'}`}>{initials(person.name)}</div><div className="member-data"><b>{person.name}</b><small>{person.jobTitle} · {person.department}</small></div><StatusBadge status={person.status} /></div>)}</div></section>)}</div>
  </>
}

function StatCard({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: string; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><p>{label}</p><div className="stat-value">{value}</div><span>{detail}</span></div>
}

function RequestsView({ kind, requests, employees, busy, onDecision }: { kind: 'Licencia médica' | 'Vacaciones'; requests: AbsenceRequest[]; employees: Employee[]; busy: boolean; onDecision: (id: number, decision: 'Aprobada' | 'Rechazada') => void }) {
  const visible = requests.filter((request) => kind === 'Vacaciones' ? request.type === 'Vacaciones' : request.type !== 'Vacaciones')
  return <div className="data-card"><div className="data-card-heading"><div><h2>Solicitudes de {kind === 'Vacaciones' ? 'vacaciones' : 'licencias y permisos'}</h2><p>Revisa el detalle antes de tomar una decisión.</p></div><span className="soft-chip">{visible.filter((item) => item.status === 'Pendiente').length} pendientes</span></div>{visible.length ? <div className="table-scroll"><table><thead><tr><th>PERSONA</th><th>TIPO</th><th>PERÍODO</th><th>DÍAS</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead><tbody>{visible.map((item) => { const person = employees.find((employee) => employee.id === item.employeeId); return <tr key={item.id}><td><div className="table-person"><div className="avatar avatar-lilac">{initials(person?.name ?? '?')}</div><div><b>{person?.name}</b><small>{person?.department}</small></div></div></td><td>{item.type}<small className="table-secondary">{item.reason}</small></td><td>{formatDate(item.startDate)}<small className="table-secondary">hasta {formatDate(item.endDate)}</small></td><td>{item.days} días</td><td><StatusBadge status={item.status} /></td><td>{item.status === 'Pendiente' ? <div className="row-actions"><button className="approve-button" disabled={busy} onClick={() => onDecision(item.id, 'Aprobada')}>Aprobar</button><button className="reject-button" disabled={busy} onClick={() => onDecision(item.id, 'Rechazada')}>Rechazar</button></div> : <span className="muted">Resuelta</span>}</td></tr> })}</tbody></table></div> : <EmptyState title="No hay solicitudes" text="Las nuevas solicitudes aparecerán aquí." />}</div>
}

function ContractsView({ contracts, employees, busy, onRenew, onTerminate }: { contracts: EmploymentContract[]; employees: Employee[]; busy: boolean; onRenew: (id: number) => void; onTerminate: (id: number) => void }) {
  const today = new Date()
  const nearExpiry = contracts.filter((contract) => contract.status === 'Vigente' && (new Date(`${contract.endDate}T00:00:00`).getTime() - today.getTime()) / 86400000 <= 30 && new Date(`${contract.endDate}T00:00:00`) >= today)
  return <><div className="contract-alert"><div className="alert-symbol">!</div><div><b>{nearExpiry.length ? `${nearExpiry.length} contrato${nearExpiry.length === 1 ? '' : 's'} próximo${nearExpiry.length === 1 ? '' : 's'} a vencer` : 'Alertas de contratos'}</b><p>{nearExpiry.length ? 'Revisa las fechas de término y gestiona las renovaciones a tiempo.' : 'No hay contratos por vencer en los próximos 30 días.'}</p></div></div><div className="data-card"><div className="data-card-heading"><div><h2>Contratos del equipo</h2><p>Vigencia y estado de los acuerdos laborales.</p></div><span className="soft-chip">{contracts.length} contratos</span></div><div className="table-scroll"><table><thead><tr><th>PERSONA</th><th>TIPO</th><th>VIGENCIA</th><th>SUELDO BASE</th><th>ESTADO</th><th>GESTIÓN</th></tr></thead><tbody>{contracts.map((contract) => { const person = employees.find((employee) => employee.id === contract.employeeId); const days = Math.ceil((new Date(`${contract.endDate}T00:00:00`).getTime() - today.getTime()) / 86400000); return <tr key={contract.id}><td><div className="table-person"><div className="avatar avatar-peach">{initials(person?.name ?? '?')}</div><div><b>{person?.name}</b><small>{person?.jobTitle}</small></div></div></td><td>{contract.type}</td><td>{formatDate(contract.startDate)}<small className="table-secondary">hasta {formatDate(contract.endDate)}</small></td><td>${contract.salary.toLocaleString('es-ES')}</td><td>{days <= 30 && days >= 0 && contract.status === 'Vigente' ? <span className="status-badge status-warning">Vence en {days} días</span> : <StatusBadge status={contract.status} />}</td><td>{contract.status === 'Vigente' ? <div className="row-actions"><button className="approve-button" disabled={busy} onClick={() => onRenew(contract.id)}>Renovar</button><button className="reject-button" disabled={busy} onClick={() => onTerminate(contract.id)}>Terminar</button></div> : <span className="muted">—</span>}</td></tr> })}</tbody></table></div></div></>
}

function AccountView({ account, logs }: { account: DashboardData['account']; logs: AuditLog[] }) {
  const employee = account.employee
  return <div className="account-grid"><section className="account-card account-hero"><div className="avatar avatar-indigo account-avatar">{initials(employee?.name ?? account.username)}</div><h2>{employee?.name ?? account.username}</h2><p>{employee?.jobTitle ?? account.role}</p><span className="soft-chip">Cuenta del ERP vinculada</span></section><div className="account-column"><section className="account-card"><div className="data-card-heading"><div><h2>Información de la cuenta</h2><p>Identidad de acceso asociada al perfil de empleado.</p></div></div><div className="account-fields"><AccountField label="Usuario ERP" value={account.username} /><AccountField label="Rol de acceso" value={account.role} /><AccountField label="ID de usuario" value={String(account.id)} /><AccountField label="ID de empleado asociado" value={String(account.employeeId)} /><AccountField label="Correo" value={employee?.email ?? '—'} /><AccountField label="Departamento" value={employee?.department ?? '—'} /></div></section><section className="account-card activity-card"><div className="data-card-heading"><div><h2>Actividad reciente</h2><p>Acciones atribuidas a tu usuario del ERP.</p></div></div>{logs.length ? logs.slice(0, 5).map((log) => <div className="activity-row" key={log.id}><span className="activity-dot" /><div><b>{log.action}</b><small>{log.details}</small></div><time>{new Date(log.occurredAt).toLocaleString('es-ES')}</time></div>) : <p className="activity-empty">Todavía no hay acciones registradas en esta sesión de demostración.</p>}</section></div></div>
}

function AccountField({ label, value }: { label: string; value: string }) {
  return <div className="account-field"><span>{label}</span><b>{value}</b></div>
}

function TerminationView({ employees }: { employees: Employee[] }) {
  return <div className="data-card"><div className="data-card-heading"><div><h2>Procesos de desvinculación</h2><p>Registro de salidas y finiquitos del personal.</p></div><button className="primary-button" disabled title="Disponible cuando se conecte la base de datos">+ Nuevo proceso</button></div><EmptyState title="Aún no hay desvinculaciones registradas" text={`La tabla del MER está pendiente de definición. ${employees.length} empleados disponibles para iniciar un proceso cuando se conecte la base de datos.`} /></div>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon">⌁</div><h3>{title}</h3><p>{text}</p></div>
}

function StatusBadge({ status }: { status: string }) {
  const className = status === 'Presente' || status === 'Aprobada' || status === 'Vigente' ? 'status-good' : status === 'Ausente' || status === 'Pendiente' ? 'status-warning' : status === 'Remoto' ? 'status-info' : 'status-muted'
  return <span className={`status-badge ${className}`}><i />{status}</span>
}

export default App
