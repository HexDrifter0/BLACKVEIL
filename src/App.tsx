import { useMemo, useState } from 'react'
import {
  Activity, ArrowUpRight, Bell, ChevronDown, ChevronRight, CircleDot, Command,
  Crosshair, Database, FileSearch, Fingerprint, FlaskConical, LayoutDashboard,
  LockKeyhole, Menu, Network, Radar, Search, Settings2, Shield, ShieldAlert,
  ShieldCheck, Terminal, X, Zap
} from 'lucide-react'
import Academy from './Academy'
import './styles.css'

type Profile = 'White Hat' | 'Black Hat' | 'Red Hat' | 'Blue Hat' | 'Purple Hat'
type ToolItem = { name: string; description: string; category: string; icon: typeof Shield; status: string }
const profiles: { name: Profile; short: string; description: string; color: string }[] = [
  { name: 'White Hat', short: 'WH', description: 'Auditoría ética y evaluación', color: '#73d6b0' },
  { name: 'Black Hat', short: 'BH', description: 'Simulación adversaria en laboratorio', color: '#c18cff' },
  { name: 'Red Hat', short: 'RH', description: 'Operaciones ofensivas autorizadas', color: '#ff777d' },
  { name: 'Blue Hat', short: 'BH', description: 'Defensa, detección y respuesta', color: '#7aaeff' },
  { name: 'Purple Hat', short: 'PH', description: 'Validación colaborativa', color: '#c0a0ff' }
]
const tools: ToolItem[] = [
  { name: 'Network mapper', description: 'Calculadora IPv4, CIDR y rangos de red', category: 'Network', icon: Network, status: 'READY' },
  { name: 'Hash laboratory', description: 'SHA-256 de texto y archivos en local', category: 'Forensics', icon: Fingerprint, status: 'READY' },
  { name: 'IOC extractor', description: 'Extrae IPs, dominios, URLs y hashes', category: 'Threat intel', icon: FileSearch, status: 'READY' },
  { name: 'Log analyzer', description: 'Inspección rápida de eventos y logs', category: 'Blue team', icon: Terminal, status: 'READY' },
  { name: 'Attack surface', description: 'Inventario de activos con alcance definido', category: 'Recon', icon: Radar, status: 'PLANNED' },
  { name: 'Sandbox lab', description: 'Entornos de práctica aislados y desechables', category: 'Training', icon: FlaskConical, status: 'PLANNED' }
]
const nav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Operations', icon: Crosshair },
  { label: 'Toolbox', icon: Terminal },
  { label: 'Academy', icon: BookOpen },
  { label: 'Threat intelligence', icon: Radar },
  { label: 'Laboratories', icon: FlaskConical },
  { label: 'Devices', icon: Database }
]
function App() {
  const [profile, setProfile] = useState<Profile>('Purple Hat')
  const [section, setSection] = useState('Overview')
  const [query, setQuery] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const filteredTools = useMemo(() => tools.filter(t => (t.name + t.description + t.category).toLowerCase().includes(query.toLowerCase())), [query])
  const chooseSection = (label: string) => { setSection(label); setMobileNav(false); setActiveTool(null) }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Shield size={19} strokeWidth={2.2}/></div><div><b>BLACKVEIL</b><span>SECURITY WORKSPACE</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <div className="workspace-card"><div className="workspace-icon"><Command size={16}/></div><div><b>Personal workspace</b><span>Local environment</span></div><span className="online-dot"/></div>
      <div className="nav-label">PLATFORM</div>
      <nav>{nav.map(item => <button key={item.label} className={`nav-item ${section === item.label ? 'active' : ''}`} onClick={() => chooseSection(item.label)}><item.icon size={17}/><span>{item.label}</span>{item.label === 'Devices' && <small>0</small>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="security-status"><div className="status-icon"><LockKeyhole size={15}/></div><div><b>Security status</b><span>Local-only · No agent paired</span></div></div><button className="nav-item" onClick={() => chooseSection('Settings')}><Settings2 size={17}/><span>Settings</span></button><div className="user-row"><div className="avatar">BV</div><div><b>Operator</b><span>Standard access</span></div><ChevronDown size={15}/></div></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar"><div className="top-left"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={19}/></button><div className="breadcrumb">Workspace <ChevronRight size={13}/> <b>{section}</b></div></div><div className="top-actions"><div className="system-pill"><span className="online-dot"/> SYSTEM OPERATIONAL</div><button className="icon-btn" aria-label="Notifications" onClick={() => setNotice('No tienes notificaciones nuevas.')}><Bell size={17}/></button><div className="top-avatar">OP</div></div></header>
      <div className="page-content">
        {section === 'Overview' ? <><div className="page-heading"><div><div className="eyebrow"><span/> SECURITY OPERATIONS CENTER</div><h1>Command overview<span className="heading-dot">.</span></h1><p>Tu espacio de trabajo para operaciones de ciberseguridad.</p></div><button className="date-chip"><Activity size={15}/> LIVE ENVIRONMENT</button></div>
          <section className="hero-panel"><div className="hero-grid"/><div className="hero-content"><div className="hero-kicker"><Zap size={13}/> OPERATIONAL PROFILE</div><h2>Think like an attacker.<br/><em>Defend like a strategist.</em></h2><p>Un entorno unificado para analizar, aprender y proteger sistemas con control y trazabilidad.</p><div className="hero-buttons"><button className="primary-btn" onClick={() => chooseSection('Toolbox')}>Explore toolbox <ArrowUpRight size={16}/></button><button className="ghost-btn" onClick={() => chooseSection('Laboratories')}>Open laboratories <ChevronRight size={15}/></button></div></div><div className="hero-orb"><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><div className="orb-core"><ShieldCheck size={37}/></div><span className="orb-caption">CONTROLLED<br/>ENVIRONMENT</span></div><div className="hero-index">BV / 001 — FIELD CONSOLE</div></section>
          <section className="profile-section"><div className="section-heading"><div><div className="eyebrow">01 / WORKING CONTEXT</div><h3>Operational profiles</h3></div><span className="muted-tag">SELECT A MODE</span></div><div className="profile-grid">{profiles.map(p => <button key={p.name} onClick={() => {setProfile(p.name);setShowProfiles(false)}} className={`profile-card ${profile === p.name ? 'profile-selected' : ''}`} style={{'--profile-color':p.color} as React.CSSProperties}><div className="profile-top"><span className="profile-code">{p.short}</span>{profile === p.name ? <span className="selected-indicator"><CircleDot size={14}/> ACTIVE</span> : <ChevronRight size={15}/>}</div><b>{p.name}</b><span>{p.description}</span></button>)}</div></section>
          <section className="stats-grid"><div className="stat-card"><div className="stat-top"><span>ACTIVE SESSIONS</span><Activity size={16}/></div><div className="stat-value">01 <small className="stat-neutral">LOCAL</small></div><div className="stat-foot">This browser session</div></div><div className="stat-card"><div className="stat-top"><span>CONNECTED DEVICES</span><Database size={16}/></div><div className="stat-value">00 <small className="stat-neutral">PAIRED</small></div><div className="stat-foot">No remote agents connected</div></div><div className="stat-card"><div className="stat-top"><span>AVAILABLE TOOLS</span><Terminal size={16}/></div><div className="stat-value">04 <small className="stat-up"><ArrowUpRight size={12}/> LOCAL</small></div><div className="stat-foot">Ready to use in this browser</div></div><div className="stat-card"><div className="stat-top"><span>SECURITY EVENTS</span><ShieldAlert size={16}/></div><div className="stat-value">00 <small className="stat-neutral">TODAY</small></div><div className="stat-foot">No events recorded yet</div></div></section>
          <section className="lower-grid"><div className="panel"><div className="panel-heading"><div><div className="eyebrow">02 / QUICK ACCESS</div><h3>Toolbox highlights</h3></div><button className="text-link" onClick={() => chooseSection('Toolbox')}>View all <ArrowUpRight size={14}/></button></div><div className="quick-tools">{tools.slice(0,3).map(t => <button className="quick-tool" key={t.name} onClick={() => {setSection('Toolbox');setActiveTool(t.name)}}><div className="tool-icon"><t.icon size={17}/></div><div><b>{t.name}</b><span>{t.description}</span></div><ChevronRight size={15}/></button>)}</div></div><div className="panel activity-panel"><div className="panel-heading"><div><div className="eyebrow">03 / AUDIT TRAIL</div><h3>Recent activity</h3></div><span className="live-label"><span/> LIVE</span></div><div className="empty-activity"><div className="empty-icon"><Activity size={20}/></div><b>All quiet on the wire</b><span>Las acciones realizadas aparecerán aquí.</span></div></div></section>
        </> : section === 'Academy' ? <Academy /> : <><div className="page-heading compact-heading"><div><div className="eyebrow">BLACKVEIL / MODULE</div><h1>{section}<span className="heading-dot">.</span></h1><p>{section === 'Toolbox' ? 'Herramientas locales de análisis y diagnóstico.' : 'Módulo preparado para la siguiente fase de integración.'}</p></div><span className="date-chip"><CircleDot size={14}/> {section === 'Toolbox' ? '4 TOOLS READY' : 'MODULE PREVIEW'}</span></div>
          {section === 'Toolbox' ? <><div className="search-bar"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tools, categories..." /><kbd>⌘ K</kbd></div><div className="tool-grid">{filteredTools.map(t => <button key={t.name} className="tool-card" onClick={() => setActiveTool(t.name)}><div className="tool-card-top"><div className="tool-icon large"><t.icon size={20}/></div><span className={t.status === 'READY' ? 'ready-tag' : 'planned-tag'}>{t.status}</span></div><h3>{t.name}</h3><p>{t.description}</p><div className="tool-card-foot"><span>{t.category}</span><ArrowUpRight size={15}/></div></button>)}</div></> : <div className="module-placeholder"><div className="placeholder-icon"><Shield size={28}/></div><h2>{section} module</h2><p>Este módulo se conectará a servicios reales en próximas iteraciones. No se mostrarán datos simulados como si fueran operaciones reales.</p><button className="primary-btn" onClick={() => chooseSection('Toolbox')}>Use available tools <ArrowUpRight size={15}/></button></div>}
        </>}
      </div>
      <footer className="footer"><span>BLACKVEIL <i>v0.1.0 / FOUNDATION</i></span><span><span className="online-dot"/> ALL SYSTEMS NOMINAL</span></footer>
    </main>
    {activeTool && <ToolModal name={activeTool} onClose={() => setActiveTool(null)}/>}
    {notice && <div className="toast" onClick={() => setNotice('')}>{notice}<X size={14}/></div>}
  </div>
}

function ToolModal({ name, onClose }: { name: string; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true); setResult('')
    try {
      if (name === 'Hash laboratory') {
        const bytes = new TextEncoder().encode(input)
        const digest = await crypto.subtle.digest('SHA-256', bytes)
        setResult(Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join(''))
      } else if (name === 'IOC extractor') {
        const patterns = [
          ['IPv4', /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g],
          ['URL', /https?:\/\/[^\s"'<>]+/gi],
          ['Domain', /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|dev|info|co|es|uk|de|ru|cn)\b/gi],
          ['MD5/SHA', /\b(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})\b/gi]
        ]
        const found = patterns.flatMap(([label, regex]) => [...new Set(input.match(regex as RegExp) ?? [])].map(value => `${label}: ${value}`))
        setResult(found.length ? found.join('\n') : 'No se encontraron indicadores con los patrones básicos.')
      } else if (name === 'Network mapper') {
        const match = input.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d|[12]\d|3[0-2])$/)
        if (!match) throw new Error('Formato requerido: 192.168.1.0/24')
        const octets = match[1].split('.').map(Number)
        if (octets.some(n => n > 255)) throw new Error('Dirección IPv4 no válida.')
        const ip = octets.reduce((a,n) => ((a << 8) | n) >>> 0, 0)
        const prefix = Number(match[2]); const mask = prefix === 0 ? 0 : (0xffffffff << (32-prefix)) >>> 0
        const network = (ip & mask) >>> 0; const broadcast = (network | (~mask >>> 0)) >>> 0
        const fmt = (n:number) => [n>>>24,(n>>>16)&255,(n>>>8)&255,n&255].join('.')
        setResult(`Network: ${fmt(network)}\nNetmask: ${fmt(mask)}\nBroadcast: ${fmt(broadcast)}\nTotal addresses: ${2**(32-prefix)}\nUsable hosts: ${prefix >= 31 ? 2**(32-prefix) : Math.max(0,2**(32-prefix)-2)}`)
      } else if (name === 'Log analyzer') {
        const lines = input.split(/\r?\n/).filter(Boolean)
        const errors = lines.filter(l => /error|critical|fatal|denied|failed/i.test(l))
        const warnings = lines.filter(l => /warn|warning/i.test(l))
        setResult(`Total lines: ${lines.length}\nPotential errors: ${errors.length}\nWarnings: ${warnings.length}\n\n${errors.slice(0,30).join('\n') || 'No matching error lines.'}`)
      }
    } catch (e) { setResult(e instanceof Error ? e.message : 'Error inesperado.') }
    finally { setBusy(false) }
  }
  const ready = ['Network mapper','Hash laboratory','IOC extractor','Log analyzer'].includes(name)
  return <div className="modal-backdrop" onMouseDown={e => {if(e.target === e.currentTarget) onClose()}}><div className="tool-modal"><div className="modal-head"><div><div className="eyebrow">LOCAL TOOL / BROWSER EXECUTION</div><h2>{name}</h2></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{ready ? <><label className="field-label">{name === 'Network mapper' ? 'IPv4 / CIDR' : name === 'Hash laboratory' ? 'TEXT TO HASH (SHA-256)' : name === 'IOC extractor' ? 'TEXT / INDICATORS TO INSPECT' : 'LOG CONTENT'}</label><textarea value={input} onChange={e => setInput(e.target.value)} placeholder={name === 'Network mapper' ? '192.168.1.0/24' : name === 'Hash laboratory' ? 'Enter text to calculate its SHA-256 digest...' : 'Paste text to analyze...'} rows={6}/><button className="primary-btn run-btn" disabled={!input.trim() || busy} onClick={run}>{busy ? 'Processing…' : 'Run locally'} <ArrowUpRight size={15}/></button>{result && <div className="result-box"><div className="result-head">OUTPUT <button onClick={() => navigator.clipboard?.writeText(result)}>Copy</button></div><pre>{result}</pre></div>}<p className="privacy-note"><LockKeyhole size={13}/> Processing happens in this browser. Input is not uploaded.</p></> : <div className="module-placeholder"><FlaskConical size={28}/><h3>Not available yet</h3><p>This capability is not implemented. No fake scan or remote action will be executed.</p></div>}</div></div>
}
export default App
