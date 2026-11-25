import { useEffect, useState } from 'react'
import { ClipboardCheck, Plus, ShieldCheck, Trash2 } from 'lucide-react'

type Engagement = { id: string; name: string; target: string; scope: string; createdAt: string; status: 'Draft' | 'Authorized' }
const STORAGE_KEY = 'blackveil.engagements.v1'

export default function Operations() {
  const [items, setItems] = useState<Engagement[]>([])
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [scope, setScope] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw) as Engagement[]) } catch { setNotice('No se pudo leer el espacio local guardado.') }
  }, [])

  const persist = (next: Engagement[]) => {
    setItems(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { setNotice('No se pudo guardar. Comprueba el almacenamiento del navegador.') }
  }

  const create = () => {
    if (!name.trim() || !target.trim() || !scope.trim()) { setNotice('Completa el nombre, objetivo y alcance.'); return }
    const entry: Engagement = { id: crypto.randomUUID(), name: name.trim(), target: target.trim(), scope: scope.trim(), createdAt: new Date().toISOString(), status: authorized ? 'Authorized' : 'Draft' }
    persist([entry, ...items])
    setName(''); setTarget(''); setScope(''); setAuthorized(false); setNotice('Engagement guardado localmente.')
  }

  return <div className="platform-module">
    <div className="page-heading compact-heading"><div><div className="eyebrow">01 / ENGAGEMENT MANAGEMENT</div><h1>Operations<span className="heading-dot">.</span></h1><p>Define objetivos, límites y autorización antes de cualquier prueba técnica.</p></div><span className="date-chip"><ClipboardCheck size={14}/> LOCAL WORKSPACE</span></div>
    <div className="ops-grid">
      <section className="panel ops-form">
        <div className="panel-heading"><div><div className="eyebrow">NEW ENGAGEMENT</div><h3>Scope definition</h3></div><ShieldCheck size={18}/></div>
        <label className="field-label">ENGAGEMENT NAME</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Internal web security review"/>
        <label className="field-label">TARGET / ASSET OWNER</label><input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Domain, IP range, lab or organization"/>
        <label className="field-label">AUTHORIZED SCOPE & LIMITS</label><textarea value={scope} onChange={e=>setScope(e.target.value)} rows={5} placeholder="List exact assets, permitted tests, exclusions, time window and point of contact."/>
        <label className="authorization-check"><input type="checkbox" checked={authorized} onChange={e=>setAuthorized(e.target.checked)}/><span>I confirm I have explicit permission to assess the assets listed above.</span></label>
        <button className="primary-btn run-btn" onClick={create}><Plus size={15}/> Save engagement</button>
        {notice && <p className="ops-notice">{notice}</p>}
        <p className="privacy-note"><ShieldCheck size={13}/> Stored in this browser only. No scan is launched and no remote target is contacted.</p>
      </section>
      <section className="panel ops-list">
        <div className="panel-heading"><div><div className="eyebrow">SCOPE REGISTER</div><h3>Saved engagements</h3></div><span className="muted-tag">{items.length} TOTAL</span></div>
        {items.length === 0 ? <div className="empty-activity"><div className="empty-icon"><ClipboardCheck size={20}/></div><b>No engagements yet</b><span>Create a scoped engagement to start documenting work.</span></div> : <div className="engagement-list">{items.map(item=><article className="engagement-item" key={item.id}><div className="engagement-top"><b>{item.name}</b><span className={item.status === 'Authorized' ? 'ready-tag' : 'planned-tag'}>{item.status}</span></div><p>{item.target}</p><pre>{item.scope}</pre><div className="engagement-bottom"><time>{new Date(item.createdAt).toLocaleString()}</time><button className="danger-icon" aria-label="Delete engagement" onClick={()=>persist(items.filter(x=>x.id!==item.id))}><Trash2 size={14}/></button></div></article>)}</div>}
      </section>
    </div>
  </div>
}
