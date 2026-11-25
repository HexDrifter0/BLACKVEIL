import { useEffect, useState } from 'react'
import { ClipboardCheck, Plus, ShieldCheck, Trash2, Cloud, HardDrive } from 'lucide-react'
import { getSupabaseClient } from './lib/supabase'

type Engagement = { id: string; name: string; target: string; scope: string; createdAt: string; status: 'Draft' | 'Authorized'; authorizedUntil?: string; storage: 'cloud' | 'local' }
const STORAGE_KEY = 'blackveil.engagements.v1'

export default function Operations() {
  const supabase = getSupabaseClient()
  const [items, setItems] = useState<Engagement[]>([])
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [scope, setScope] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [authorizedUntil, setAuthorizedUntil] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [cloudReady, setCloudReady] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session?.user) {
          const { data, error } = await supabase.from('engagements').select('id,name,target,scope,authorization_confirmed,authorized_until,status,created_at').order('created_at', { ascending: false })
          if (!alive) return
          if (!error && data) {
            setItems(data.map(row => ({ id: row.id, name: row.name, target: row.target, scope: row.scope, createdAt: row.created_at, status: row.status === 'authorized' && row.authorized_until && new Date(row.authorized_until) > new Date() ? 'Authorized' : 'Draft', authorizedUntil: row.authorized_until ?? undefined, storage: 'cloud' })))
            setCloudReady(true)
            return
          }
          setNotice('No se pudo cargar el registro cloud: ' + error?.message)
        }
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (alive && raw) setItems((JSON.parse(raw) as Engagement[]).map(x => ({ ...x, storage: 'local' })))
      } catch { if (alive) setNotice('No se pudo leer el espacio local guardado.') }
    }
    void load()
    return () => { alive = false }
  }, [supabase])

  const persistLocal = (next: Engagement[]) => {
    setItems(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { setNotice('No se pudo guardar en este navegador.') }
  }

  const create = async () => {
    if (!name.trim() || !target.trim() || !scope.trim()) { setNotice('Completa el nombre, objetivo y alcance.'); return }
    if (authorized && !authorizedUntil) { setNotice('Indica cuándo caduca la autorización.'); return }
    if (authorized && new Date(authorizedUntil) <= new Date()) { setNotice('La fecha de autorización debe estar en el futuro.'); return }
    setBusy(true); setNotice('')
    const entry: Engagement = { id: crypto.randomUUID(), name: name.trim(), target: target.trim(), scope: scope.trim(), createdAt: new Date().toISOString(), status: authorized ? 'Authorized' : 'Draft', authorizedUntil: authorized ? new Date(authorizedUntil).toISOString() : undefined, storage: 'local' }
    try {
      const { data: sessionData } = await supabase?.auth.getSession() ?? { data: { session: null } }
      const user = sessionData.session?.user
      if (supabase && user) {
        const { data, error } = await supabase.from('engagements').insert({
          user_id: user.id, name: entry.name, target: entry.target, scope: entry.scope,
          authorization_confirmed: authorized, authorized_until: entry.authorizedUntil ?? null,
          status: authorized ? 'authorized' : 'draft'
        }).select('id,name,target,scope,created_at,authorized_until,status').single()
        if (error) throw error
        const saved: Engagement = { id: data.id, name: data.name, target: data.target, scope: data.scope, createdAt: data.created_at, status: data.status === 'authorized' ? 'Authorized' : 'Draft', authorizedUntil: data.authorized_until ?? undefined, storage: 'cloud' }
        setItems(current => [saved, ...current])
        setCloudReady(true)
        await supabase.from('audit_events').insert({ user_id: user.id, event_type: 'engagement.created', resource_type: 'engagement', resource_id: data.id, metadata: { authorization_confirmed: authorized } })
        setNotice('Engagement guardado en BLACKVEIL Cloud.')
      } else {
        persistLocal([entry, ...items])
        setNotice('Guardado localmente. Inicia sesión para sincronizarlo con BLACKVEIL Cloud.')
      }
      setName(''); setTarget(''); setScope(''); setAuthorized(false); setAuthorizedUntil('')
    } catch (e) {
      setNotice('No se pudo guardar en cloud: ' + (e instanceof Error ? e.message : 'error desconocido'))
    } finally { setBusy(false) }
  }

  const remove = async (item: Engagement) => {
    if (item.storage === 'cloud' && supabase) {
      const { error } = await supabase.from('engagements').delete().eq('id', item.id)
      if (error) { setNotice('No se pudo eliminar: ' + error.message); return }
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) await supabase.from('audit_events').insert({ user_id: data.session.user.id, event_type: 'engagement.deleted', resource_type: 'engagement', resource_id: item.id })
      setItems(current => current.filter(x => x.id !== item.id))
      setNotice('Engagement eliminado de BLACKVEIL Cloud.')
    } else persistLocal(items.filter(x => x.id !== item.id))
  }

  return <div className="platform-module">
    <div className="page-heading compact-heading"><div><div className="eyebrow">01 / ENGAGEMENT MANAGEMENT</div><h1>Operations<span className="heading-dot">.</span></h1><p>Define objetivos, límites y autorización antes de cualquier prueba técnica.</p></div><span className="date-chip"><ClipboardCheck size={14}/> {cloudReady ? 'CLOUD SYNC' : 'HYBRID WORKSPACE'}</span></div>
    <div className="ops-grid">
      <section className="panel ops-form">
        <div className="panel-heading"><div><div className="eyebrow">NEW ENGAGEMENT</div><h3>Scope definition</h3></div><ShieldCheck size={18}/></div>
        <label className="field-label">ENGAGEMENT NAME</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Internal web security review"/>
        <label className="field-label">TARGET / ASSET OWNER</label><input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Domain, IP range, lab or organization"/>
        <label className="field-label">AUTHORIZED SCOPE & LIMITS</label><textarea value={scope} onChange={e=>setScope(e.target.value)} rows={5} placeholder="List exact assets, permitted tests, exclusions, time window and point of contact."/>
        <label className="authorization-check"><input type="checkbox" checked={authorized} onChange={e=>setAuthorized(e.target.checked)}/><span>I confirm I have explicit permission to assess the assets listed above.</span></label>
        {authorized && <><label className="field-label">AUTHORIZATION EXPIRY</label><input type="datetime-local" value={authorizedUntil} onChange={e=>setAuthorizedUntil(e.target.value)}/></>}
        <button className="primary-btn run-btn" onClick={()=>void create()} disabled={busy}><Plus size={15}/> {busy ? 'Saving…' : 'Save engagement'}</button>
        {notice && <p className="ops-notice">{notice}</p>}
        <p className="privacy-note"><ShieldCheck size={13}/> Authorization is recorded with an expiry. Saving a scope does not launch a scan or contact the target.</p>
      </section>
      <section className="panel ops-list">
        <div className="panel-heading"><div><div className="eyebrow">SCOPE REGISTER</div><h3>Saved engagements</h3></div><span className="muted-tag">{items.length} TOTAL</span></div>
        {items.length === 0 ? <div className="empty-activity"><div className="empty-icon"><ClipboardCheck size={20}/></div><b>No engagements yet</b><span>Create a scoped engagement to start documenting work.</span></div> : <div className="engagement-list">{items.map(item=><article className="engagement-item" key={item.id}><div className="engagement-top"><b>{item.name}</b><span className={item.status === 'Authorized' ? 'ready-tag' : 'planned-tag'}>{item.status}</span></div><p>{item.target}</p><pre>{item.scope}</pre><div className="engagement-bottom"><time>{new Date(item.createdAt).toLocaleString()}</time><span className="privacy-note">{item.storage === 'cloud' ? <Cloud size={12}/> : <HardDrive size={12}/>} {item.storage}</span>{item.authorizedUntil && <time>Valid until {new Date(item.authorizedUntil).toLocaleString()}</time>}<button className="danger-icon" aria-label="Delete engagement" onClick={()=>void remove(item)}><Trash2 size={14}/></button></div></article>)}</div>}
      </section>
    </div>
  </div>
}
