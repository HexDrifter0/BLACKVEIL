import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from './lib/supabase'
import { UserRound, Save, LogOut, ShieldCheck, RefreshCw } from 'lucide-react'

type Props = { user: User | null; onSignIn: () => void }
type ProfileRow = { display_name: string | null; username: string | null; bio: string | null; avatar_url: string | null; preferred_profile: string | null }

export default function Profile({ user, onSignIn }: Props) {
  const supabase = getSupabaseClient()
  const [profile, setProfile] = useState<ProfileRow>({display_name:'',username:'',bio:'',avatar_url:'',preferred_profile:'Purple Hat'})
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      if (!supabase || !user) { setLoaded(true); return }
      const { data, error } = await supabase.from('profiles').select('display_name,username,bio,avatar_url,preferred_profile').eq('id', user.id).maybeSingle()
      if (!alive) return
      if (error) setError('No se pudo cargar el perfil. Comprueba que la migración de perfiles esté aplicada.')
      else if (data) setProfile({display_name:data.display_name ?? '',username:data.username ?? '',bio:data.bio ?? '',avatar_url:data.avatar_url ?? '',preferred_profile:data.preferred_profile ?? 'Purple Hat'})
      else setProfile(p=>({...p,display_name:String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '')}))
      setLoaded(true)
    }
    void load()
    return () => { alive = false }
  }, [supabase, user?.id])

  const save = async () => {
    if (!supabase || !user) return
    setBusy(true); setError(''); setNotice('')
    const payload = { id:user.id, display_name:profile.display_name?.trim() || null, username:profile.username?.trim().toLowerCase() || null, bio:profile.bio?.trim() || null, avatar_url:profile.avatar_url?.trim() || null, preferred_profile:profile.preferred_profile, updated_at:new Date().toISOString() }
    const { error } = await supabase.from('profiles').upsert(payload)
    if (error) setError(error.message)
    else {
      await supabase.from('audit_events').insert({ user_id:user.id, event_type:'profile.updated', resource_type:'profile', resource_id:user.id })
      setNotice('Perfil guardado en tu cuenta.')
    }
    setBusy(false)
  }

  if (!user) return <div className="module-placeholder"><div className="placeholder-icon"><UserRound size={28}/></div><h2>Your BLACKVEIL profile</h2><p>Inicia sesión para crear un perfil sincronizado con tu cuenta y conservar tus preferencias entre dispositivos.</p><button className="primary-btn" onClick={onSignIn}>Sign in / Create account</button></div>
  return <div className="platform-module">
    <div className="page-heading compact-heading"><div><div className="eyebrow">ACCOUNT / IDENTITY</div><h1>Operator profile<span className="heading-dot">.</span></h1><p>Manage your identity, preferences and account session.</p></div><span className="date-chip"><ShieldCheck size={14}/> VERIFIED SESSION</span></div>
    <div className="profile-layout">
      <section className="panel profile-editor">
        <div className="profile-identity"><div className="profile-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="Profile avatar"/> : <UserRound size={28}/>}</div><div><h3>{profile.display_name || user.email || 'Operator'}</h3><span>{user.email}</span><small>Account ID · {user.id.slice(0,8)}…</small></div></div>
        {!loaded ? <p className="privacy-note"><RefreshCw size={14}/> Loading account profile…</p> : <>
          <label className="field-label">DISPLAY NAME</label><input className="profile-input" value={profile.display_name ?? ''} onChange={e=>setProfile(p=>({...p,display_name:e.target.value}))} maxLength={60}/>
          <label className="field-label">USERNAME</label><input className="profile-input" value={profile.username ?? ''} onChange={e=>setProfile(p=>({...p,username:e.target.value.replace(/[^a-zA-Z0-9_.-]/g,'')}))} maxLength={24} placeholder="unique-operator-id"/>
          <label className="field-label">AVATAR URL</label><input className="profile-input" type="url" value={profile.avatar_url ?? ''} onChange={e=>setProfile(p=>({...p,avatar_url:e.target.value}))} placeholder="https://…"/>
          <label className="field-label">BIO</label><textarea className="profile-input" rows={4} value={profile.bio ?? ''} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} maxLength={240} placeholder="A short operator description…"/>
          <label className="field-label">DEFAULT OPERATIONAL PROFILE</label><select className="profile-input" value={profile.preferred_profile ?? 'Purple Hat'} onChange={e=>setProfile(p=>({...p,preferred_profile:e.target.value}))}>{['White Hat','Black Hat','Red Hat','Blue Hat','Purple Hat'].map(x=><option key={x}>{x}</option>)}</select>
          <button className="primary-btn run-btn" disabled={busy} onClick={()=>void save()}><Save size={15}/>{busy?'Saving…':'Save profile'}</button>
        </>}
        {error && <p className="auth-error">{error}</p>}{notice && <p className="auth-success">{notice}</p>}
      </section>
      <section className="panel profile-security"><div className="eyebrow">ACCOUNT SECURITY</div><h3>Session controls</h3><p>Authentication is handled by Supabase Auth. BLACKVEIL never stores your password in the application database.</p><div className="security-detail"><span>AUTHENTICATED EMAIL</span><b>{user.email}</b></div><div className="security-detail"><span>EMAIL CONFIRMED</span><b>{user.email_confirmed_at ? 'YES' : 'PENDING CONFIRMATION'}</b></div><div className="security-detail"><span>ACCOUNT CREATED</span><b>{new Date(user.created_at).toLocaleDateString()}</b></div><button className="danger-outline" onClick={async()=>{await supabase?.auth.signOut()}}><LogOut size={15}/> Sign out</button></section>
    </div>
  </div>
}
