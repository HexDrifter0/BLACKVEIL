import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  Activity, ArrowUpRight, Bell, BookOpen, ChevronDown, ChevronRight, CircleDot, Command,
  Crosshair, Database, FileSearch, Fingerprint, FlaskConical, LayoutDashboard, Bug, Globe, Server,
  LockKeyhole, Menu, Network, Radar, Search, Settings2, Shield, ShieldAlert, UserRound,
  ShieldCheck, Terminal, X, Zap
} from 'lucide-react'
import Academy from './Academy'
import Operations from './Operations'
import AuthPanel from './AuthPanel'
import Profile from './Profile'
import MissionModules from './MissionModules'
import InternetRecon from './InternetRecon'
import { getSupabaseClient } from './lib/supabase'
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
  { name: 'DNS resolver', description: 'Consultas DNS A, AAAA, MX, TXT, NS y CNAME', category: 'Network', icon: Globe, status: 'READY' },
  { name: 'RDAP lookup', description: 'Consulta registro y asignación IP/dominio', category: 'Recon', icon: Database, status: 'READY' },
  { name: 'CVE search', description: 'Busca vulnerabilidades en el catálogo NVD', category: 'Vulnerability intel', icon: Bug, status: 'READY' },
  { name: 'HTTP headers audit', description: 'Inspecciona cabeceras HTTP expuestas por el navegador', category: 'Web security', icon: Server, status: 'READY' },
  { name: 'Hash laboratory', description: 'SHA-256 de texto y archivos en local', category: 'Forensics', icon: Fingerprint, status: 'READY' },
  { name: 'IOC extractor', description: 'Extrae IPs, dominios, URLs y hashes', category: 'Threat intel', icon: FileSearch, status: 'READY' },
  { name: 'Log analyzer', description: 'Inspección rápida de eventos y logs', category: 'Blue team', icon: Terminal, status: 'READY' },
  { name: 'Base64 workbench', description: 'Codifica y decodifica texto Base64', category: 'Encoding', icon: Database, status: 'READY' },
  { name: 'JWT inspector', description: 'Decodifica header y payload JWT sin verificar firmas', category: 'Web security', icon: LockKeyhole, status: 'READY' },
  { name: 'Password auditor', description: 'Evalúa entropía estimada y patrones débiles localmente', category: 'Identity', icon: ShieldCheck, status: 'READY' },
  { name: 'URL inspector', description: 'Descompone URL, parámetros y componentes', category: 'Web', icon: Search, status: 'READY' },
  { name: 'Regex workbench', description: 'Prueba expresiones regulares sobre texto', category: 'Developer', icon: FileSearch, status: 'READY' },
]
const nav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Operations', icon: Crosshair },
  { label: 'Internet intelligence', icon: Globe },
  { label: 'Toolbox', icon: Terminal },
  { label: 'Academy', icon: BookOpen },
  { label: 'Threat intelligence', icon: Radar },
  { label: 'Laboratories', icon: FlaskConical },
  { label: 'Devices', icon: Database },
  { label: 'Profile', icon: UserRound }
]
function App() {
  const [profile, setProfile] = useState<Profile>('Purple Hat')
  const [section, setSection] = useState('Overview')
  const [query, setQuery] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const filteredTools = useMemo(() => tools.filter(t => (t.name + t.description + t.category).toLowerCase().includes(query.toLowerCase())), [query])
  const chooseSection = (label: string) => { setSection(label); setMobileNav(false); setActiveTool(null) }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Shield size={19} strokeWidth={2.2}/></div><div><b>BLACKVEIL</b><span>SECURITY WORKSPACE</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <div className="workspace-card"><div className="workspace-icon"><Command size={16}/></div><div><b>Personal workspace</b><span>Cloud-connected workspace</span></div><span className="online-dot"/></div>
      <div className="nav-label">PLATFORM</div>
      <nav>{nav.map(item => <button key={item.label} className={`nav-item ${section === item.label ? 'active' : ''}`} onClick={() => chooseSection(item.label)}><item.icon size={17}/><span>{item.label}</span>{item.label === 'Devices' && <small>0</small>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="security-status"><div className="status-icon"><LockKeyhole size={15}/></div><div><b>Security status</b><span>Local-only · No agent paired</span></div></div><button className="nav-item" onClick={() => chooseSection('Settings')}><Settings2 size={17}/><span>Settings</span></button><button className="user-row user-row-button" onClick={() => chooseSection('Profile')}><div className="avatar">{user?.email?.slice(0,2).toUpperCase() || 'BV'}</div><div><b>{user?.user_metadata?.full_name || user?.email || 'Guest operator'}</b><span>{user ? 'Authenticated account' : 'Sign in to sync profile'}</span></div><ChevronDown size={15}/></button></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar"><div className="top-left"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={19}/></button><div className="breadcrumb">Workspace <ChevronRight size={13}/> <b>{section}</b></div></div><div className="top-actions"><div className="system-pill"><span className="online-dot"/> SYSTEM OPERATIONAL</div><button className="icon-btn" aria-label="Notifications" onClick={() => setNotice('No tienes notificaciones nuevas.')}><Bell size={17}/></button><button className="top-avatar top-avatar-button" onClick={() => chooseSection(user ? 'Profile' : 'Sign in')} aria-label={user ? 'Open profile' : 'Sign in'}>{user?.email?.slice(0,2).toUpperCase() || 'OP'}</button></div></header>
      <div className="page-content">
        {section === 'Overview' ? <><div className="page-heading"><div><div className="eyebrow"><span/> SECURITY OPERATIONS CENTER</div><h1>Command overview<span className="heading-dot">.</span></h1><p>Tu espacio de trabajo para operaciones de ciberseguridad.</p></div><button className="date-chip"><Activity size={15}/> LIVE ENVIRONMENT</button></div>
          <section className="hero-panel"><div className="hero-grid"/><div className="hero-content"><div className="hero-kicker"><Zap size={13}/> OPERATIONAL PROFILE</div><h2>Think like an attacker.<br/><em>Defend like a strategist.</em></h2><p>Un entorno unificado para analizar, aprender y proteger sistemas con control y trazabilidad.</p><div className="hero-buttons"><button className="primary-btn" onClick={() => chooseSection('Toolbox')}>Explore toolbox <ArrowUpRight size={16}/></button><button className="ghost-btn" onClick={() => chooseSection('Laboratories')}>Open laboratories <ChevronRight size={15}/></button></div></div><div className="hero-orb"><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><div className="orb-core"><ShieldCheck size={37}/></div><span className="orb-caption">CONTROLLED<br/>ENVIRONMENT</span></div><div className="hero-index">BV / 001 — FIELD CONSOLE</div></section>
          <section className="profile-section"><div className="section-heading"><div><div className="eyebrow">01 / WORKING CONTEXT</div><h3>Operational profiles</h3></div><span className="muted-tag">SELECT A MODE</span></div><div className="profile-grid">{profiles.map(p => <button key={p.name} onClick={() => {setProfile(p.name)}} className={`profile-card ${profile === p.name ? 'profile-selected' : ''}`} style={{'--profile-color':p.color} as React.CSSProperties}><div className="profile-top"><span className="profile-code">{p.short}</span>{profile === p.name ? <span className="selected-indicator"><CircleDot size={14}/> ACTIVE</span> : <ChevronRight size={15}/>}</div><b>{p.name}</b><span>{p.description}</span></button>)}</div></section>
          <section className="stats-grid"><div className="stat-card"><div className="stat-top"><span>ACTIVE SESSIONS</span><Activity size={16}/></div><div className="stat-value">01 <small className="stat-neutral">LOCAL</small></div><div className="stat-foot">This browser session</div></div><div className="stat-card"><div className="stat-top"><span>CONNECTED DEVICES</span><Database size={16}/></div><div className="stat-value">00 <small className="stat-neutral">PAIRED</small></div><div className="stat-foot">No remote agents connected</div></div><div className="stat-card"><div className="stat-top"><span>AVAILABLE TOOLS</span><Terminal size={16}/></div><div className="stat-value">{tools.filter(t => t.status === 'READY').length.toString().padStart(2, '0')} <small className="stat-up"><ArrowUpRight size={12}/> LOCAL</small></div><div className="stat-foot">Ready to use in this browser</div></div><div className="stat-card"><div className="stat-top"><span>SECURITY EVENTS</span><ShieldAlert size={16}/></div><div className="stat-value">00 <small className="stat-neutral">TODAY</small></div><div className="stat-foot">No events recorded yet</div></div></section>
          <section className="lower-grid"><div className="panel"><div className="panel-heading"><div><div className="eyebrow">02 / QUICK ACCESS</div><h3>Toolbox highlights</h3></div><button className="text-link" onClick={() => chooseSection('Toolbox')}>View all <ArrowUpRight size={14}/></button></div><div className="quick-tools">{tools.slice(0,3).map(t => <button className="quick-tool" key={t.name} onClick={() => {setSection('Toolbox');setActiveTool(t.name)}}><div className="tool-icon"><t.icon size={17}/></div><div><b>{t.name}</b><span>{t.description}</span></div><ChevronRight size={15}/></button>)}</div></div><div className="panel activity-panel"><div className="panel-heading"><div><div className="eyebrow">03 / AUDIT TRAIL</div><h3>Recent activity</h3></div><span className="live-label"><span/> LIVE</span></div><div className="empty-activity"><div className="empty-icon"><Activity size={20}/></div><b>All quiet on the wire</b><span>Las acciones realizadas aparecerán aquí.</span></div></div></section>
        </> : section === 'Sign in' ? <AuthPanel onBack={() => chooseSection('Overview')} onAuthenticated={() => chooseSection('Profile')} /> : section === 'Profile' ? <Profile user={user} onSignIn={() => chooseSection('Sign in')} /> : section === 'Internet intelligence' ? <InternetRecon /> : section === 'Academy' ? <Academy /> : section === 'Operations' ? <Operations /> : ['Threat intelligence','Laboratories','Devices','Settings'].includes(section) ? <MissionModules section={section} user={user} /> : <><div className="page-heading compact-heading"><div><div className="eyebrow">BLACKVEIL / MODULE</div><h1>{section}<span className="heading-dot">.</span></h1><p>{section === 'Toolbox' ? 'Utilidades locales y consultas de inteligencia conectadas a Internet.' : 'Módulo preparado para la siguiente fase de integración.'}</p></div><span className="date-chip"><CircleDot size={14}/> {section === 'Toolbox' ? `${tools.filter(t => t.status === 'READY').length} TOOLS READY` : 'MODULE PREVIEW'}</span></div>
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
  const [file, setFile] = useState<File | null>(null)
  const run = async () => {
    setBusy(true); setResult('')
    try {
      if (name === 'Hash laboratory') {
        const bytes = file ? await file.arrayBuffer() : new TextEncoder().encode(input)
        const digest = await crypto.subtle.digest('SHA-256', bytes)
        const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('')
        setResult('SHA-256: ' + hex + '\nSource: ' + (file ? file.name + ' (' + file.size + ' bytes)' : 'text input'))
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
      } else if (name === 'DNS resolver') {
        const [domain, requestedType = 'A'] = input.trim().split(/\s+/)
        const recordType = requestedType.toUpperCase()
        if (!/^[a-z0-9.-]+$/i.test(domain) || !['A','AAAA','MX','TXT','NS','CNAME'].includes(recordType)) throw new Error('Formato: example.com A (tipos: A, AAAA, MX, TXT, NS, CNAME).')
        const response = await fetch('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(domain) + '&type=' + recordType, { headers: { accept: 'application/dns-json' } })
        if (!response.ok) throw new Error('DNS-over-HTTPS HTTP ' + response.status)
        const data = await response.json()
        setResult('Query: ' + domain + ' ' + recordType + '\nStatus: ' + (data.Status === 0 ? 'NOERROR' : 'DNS status ' + data.Status) + '\n\n' + ((data.Answer || []).map((a:any) => a.name + '  TTL=' + a.TTL + '  ' + a.data).join('\n') || 'No answers returned.'))
      } else if (name === 'RDAP lookup') {
        const value = input.trim()
        const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)
        if (!isIp && !/^(?=.{1,253}$)[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) throw new Error('Introduce una dirección IPv4 o un dominio válido.')
        const response = await fetch('https://rdap.org/' + (isIp ? 'ip/' : 'domain/') + encodeURIComponent(value), { headers: { accept: 'application/rdap+json, application/json' } })
        if (!response.ok) throw new Error('RDAP HTTP ' + response.status)
        const data = await response.json()
        setResult(['Object: ' + (data.name || data.handle || value), 'Handle: ' + (data.handle || 'not supplied'), 'Country: ' + (data.country || 'not supplied'), 'Type: ' + (data.type || 'not supplied'), 'Status: ' + ((data.status || []).join(', ') || 'not supplied'), 'Events: ' + ((data.events || []).map((e:any) => e.eventAction + ': ' + e.eventDate).join(' | ') || 'not supplied'), 'Nameservers: ' + ((data.nameservers || []).map((n:any) => n.ldhName).join(', ') || 'not supplied')].join('\n'))
      } else if (name === 'CVE search') {
        if (input.trim().length < 2) throw new Error('Introduce al menos dos caracteres para buscar.')
        const response = await fetch('https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=' + encodeURIComponent(input.trim()) + '&resultsPerPage=10')
        if (!response.ok) throw new Error('NVD API HTTP ' + response.status + '. Puede existir un límite temporal de consultas.')
        const data = await response.json()
        const entries = data.vulnerabilities || []
        setResult('Results: ' + (data.totalResults ?? entries.length) + '\n\n' + (entries.map((entry:any) => { const c=entry.cve; const desc=c.descriptions?.find((d:any)=>d.lang==='en')?.value || 'No English description'; const score=c.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ?? c.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore ?? c.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore ?? 'N/A'; return c.id + ' | CVSS ' + score + '\n' + desc.slice(0,360) }).join('\n\n') || 'No matching CVEs found.'))
      } else if (name === 'Log analyzer') {
        const lines = input.split(/\r?\n/).filter(Boolean)
        const errors = lines.filter(l => /error|critical|fatal|denied|failed/i.test(l))
        const warnings = lines.filter(l => /warn|warning/i.test(l))
        setResult(`Total lines: ${lines.length}\nPotential errors: ${errors.length}\nWarnings: ${warnings.length}\n\n${errors.slice(0,30).join('\n') || 'No matching error lines.'}`)
      } else if (name === 'Base64 workbench') {
        const [mode, ...data] = input.split('\n')
        const value = data.join('\n')
        if (!value) throw new Error('Usa la primera línea como ENCODE o DECODE y después el texto.')
        setResult(mode.trim().toUpperCase() === 'ENCODE' ? btoa(unescape(encodeURIComponent(value))) : mode.trim().toUpperCase() === 'DECODE' ? decodeURIComponent(escape(atob(value.trim()))) : 'Primera línea: ENCODE o DECODE.')
      } else if (name === 'JWT inspector') {
        const parts = input.trim().split('.')
        if (parts.length !== 3) throw new Error('Un JWT compacto debe contener tres segmentos separados por puntos.')
        const decode = (part:string) => JSON.stringify(JSON.parse(decodeURIComponent(escape(atob(part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'='))))), null, 2)
        setResult(`HEADER (decoded only)\n${decode(parts[0])}\n\nPAYLOAD (decoded only)\n${decode(parts[1])}\n\nWARNING: Decoding does not validate the signature, issuer, audience or expiry.`)
      } else if (name === 'Password auditor') {
        const value = input
        const classes = [/[a-z]/.test(value),/[A-Z]/.test(value),/\d/.test(value),/[^A-Za-z0-9]/.test(value)].filter(Boolean).length
        const pool = [0,26,52,62,94][classes]
        const entropy = value.length * Math.log2(Math.max(pool,1))
        const common = /password|qwerty|123456|admin|letmein|welcome/i.test(value)
        const score = common ? 'WEAK — common pattern detected' : entropy < 40 ? 'WEAK' : entropy < 70 ? 'MODERATE' : 'STRONG'
        setResult(`Length: ${value.length}\nCharacter classes: ${classes}/4\nEstimated entropy: ${entropy.toFixed(1)} bits\nAssessment: ${score}\n\nThis is a rough offline estimate, not a crack-time guarantee. Avoid reusing passwords.`)
      } else if (name === 'URL inspector') {
        const url = new URL(input.trim())
        setResult(`Protocol: ${url.protocol}\nHostname: ${url.hostname}\nPort: ${url.port || '(default)'}\nPath: ${url.pathname}\nQuery: ${url.search || '(none)'}\nFragment: ${url.hash || '(none)'}\nUsername present: ${Boolean(url.username)}\nPassword present: ${Boolean(url.password)}\n\nParameters:\n${[...url.searchParams.entries()].map(([k,v]) => `${k} = ${v}`).join('\n') || '(none)'}`)
      } else if (name === 'HTTP headers audit') {
        const target = new URL(input.trim())
        if (!['http:','https:'].includes(target.protocol) || target.username || target.password) throw new Error('Introduce una URL HTTP(S) sin credenciales embebidas.')
        const response = await fetch(target.toString(), { method: 'GET', mode: 'cors', credentials: 'omit', redirect: 'follow' })
        const names = ['content-security-policy','strict-transport-security','x-content-type-options','referrer-policy','permissions-policy','cross-origin-opener-policy','cross-origin-resource-policy']
        const lines = names.map(h => h.toUpperCase() + ': ' + (response.headers.get(h) || 'NOT VISIBLE / NOT PRESENT'))
        setResult('Final URL: ' + response.url + '\nHTTP status: ' + response.status + '\nRedirected: ' + response.redirected + '\n\n' + lines.join('\n') + '\n\nBrowser CORS rules may hide response headers. NOT VISIBLE does not prove the server omitted a header.')
      } else if (name === 'Regex workbench') {
        const [pattern, flags = '', ...body] = input.split('\n')
        if (!pattern || !body.length) throw new Error('Primera línea: patrón. Segunda línea: flags opcionales tras | (ej. /gi). Resto: texto.')
        const regex = new RegExp(pattern, flags.replace(/[^dgimsuvy]/g,''))
        const text = body.join('\n')
        const matches = [...text.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags+'g'))]
        setResult(`Matches: ${matches.length}\n\n${matches.slice(0,100).map((m,i) => `${i+1}. ${m[0]} (index ${m.index})`).join('\n') || 'No matches.'}`)
      }
    } catch (e) { setResult(e instanceof Error ? e.message : 'Error inesperado.') }
    finally { setBusy(false) }
  }
  const ready = ['Network mapper','DNS resolver','RDAP lookup','CVE search','HTTP headers audit','Hash laboratory','IOC extractor','Log analyzer','Base64 workbench','JWT inspector','Password auditor','URL inspector','Regex workbench'].includes(name)
  return <div className="modal-backdrop" onMouseDown={e => {if(e.target === e.currentTarget) onClose()}}><div className="tool-modal"><div className="modal-head"><div><div className="eyebrow">LOCAL TOOL / BROWSER EXECUTION</div><h2>{name}</h2></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{ready ? <><label className="field-label">{name === 'Network mapper' ? 'IPv4 / CIDR' : name === 'DNS resolver' ? 'DOMAIN AND DNS RECORD TYPE (e.g. example.com MX)' : name === 'RDAP lookup' ? 'IP ADDRESS OR DOMAIN' : name === 'CVE search' ? 'KEYWORD / PRODUCT / VERSION' : name === 'HTTP headers audit' ? 'PUBLIC HTTP(S) URL (CORS REQUIRED)' : name === 'Hash laboratory' ? 'TEXT TO HASH (SHA-256)' : name === 'IOC extractor' ? 'TEXT / INDICATORS TO INSPECT' : name === 'Log analyzer' ? 'LOG CONTENT' : name === 'Base64 workbench' ? 'FIRST LINE: ENCODE OR DECODE; NEXT LINES: TEXT' : name === 'JWT inspector' ? 'COMPACT JWT' : name === 'Password auditor' ? 'PASSWORD TO AUDIT (LOCAL ONLY)' : name === 'URL inspector' ? 'ABSOLUTE URL' : 'FIRST LINE: REGEX; SECOND LINE: FLAGS; REST: TEST TEXT'}</label><textarea value={input} onChange={e => {setInput(e.target.value);setFile(null)}} placeholder={name === 'Network mapper' ? '192.168.1.0/24' : name === 'DNS resolver' ? 'example.com A' : name === 'RDAP lookup' ? 'example.com or 8.8.8.8' : name === 'CVE search' ? 'OpenSSH 9.6' : name === 'HTTP headers audit' ? 'https://example.com' : name === 'Hash laboratory' ? 'Enter text to calculate its SHA-256 digest...' : name === 'Base64 workbench' ? 'ENCODE\nHello BLACKVEIL' : name === 'JWT inspector' ? 'eyJhbGciOi...' : name === 'Password auditor' ? 'Enter a sample password (do not use a real password).' : name === 'URL inspector' ? 'https://example.com/path?query=value' : name === 'Regex workbench' ? '^admin\n gi\nadmin\nuser\nroot' : 'Paste text to analyze...'} rows={6}/>{name === 'Hash laboratory' && <label className="file-hash-input">Or hash a file locally <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)}/></label>}<button className="primary-btn run-btn" disabled={(!input.trim() && !file) || busy} onClick={run}>{busy ? 'Processing…' : 'Run locally'} <ArrowUpRight size={15}/></button>{result && <div className="result-box"><div className="result-head">OUTPUT <button onClick={() => navigator.clipboard?.writeText(result)}>Copy</button></div><pre>{result}</pre></div>}<p className="privacy-note"><LockKeyhole size={13}/> Processing happens in this browser. Input is not uploaded.</p></> : <div className="module-placeholder"><FlaskConical size={28}/><h3>Not available yet</h3><p>This capability is not implemented. No fake scan or remote action will be executed.</p></div>}</div></div>
}
export default App
