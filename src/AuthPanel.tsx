import { useState } from 'react'
import { getSupabaseClient } from './lib/supabase'
import { ArrowLeft, Apple, Github, Mail, ShieldCheck, Chrome, Eye, EyeOff, LoaderCircle } from 'lucide-react'

type Props = { onBack: () => void; onAuthenticated?: () => void }

export default function AuthPanel({ onBack, onAuthenticated }: Props) {
  const supabase = getSupabaseClient()
  const [mode, setMode] = useState<'signin'|'signup'|'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const run = async (key: string, task: () => Promise<{ error: { message: string } | null }>) => {
    setBusy(key); setError(''); setMessage('')
    try {
      const result = await task()
      if (result.error) throw new Error(result.error.message)
      setMessage(key === 'signup' ? 'Cuenta creada. Revisa tu correo para confirmar la dirección si la confirmación está activada.' : key === 'reset' ? 'Si existe una cuenta para ese correo, recibirás instrucciones de recuperación.' : 'Sesión iniciada correctamente.')
      if (key === 'signin') onAuthenticated?.()
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la autenticación.') }
    finally { setBusy('') }
  }

  const oauth = async (provider: 'google'|'apple'|'github') => {
    if (!supabase) return
    setBusy(provider); setError(''); setMessage('')
    const redirectTo = window.location.origin + import.meta.env.BASE_URL
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
    if (error) { setError(error.message); setBusy('') }
  }

  const openaiAuthUrl = import.meta.env.VITE_OPENAI_AUTH_URL
  const openaiConfigured = Boolean(openaiAuthUrl)

  return <div className="auth-page">
    <div className="auth-card">
      <button className="auth-back" onClick={onBack}><ArrowLeft size={15}/> Back to workspace</button>
      <div className="auth-brand"><div className="brand-mark"><ShieldCheck size={20}/></div><span>BLACKVEIL <small>IDENTITY GATEWAY</small></span></div>
      <div className="eyebrow">SECURE ACCESS / ACCOUNT</div>
      <h1>{mode === 'signin' ? 'Welcome back.' : mode === 'signup' ? 'Create your account.' : 'Recover access.'}</h1>
      <p className="auth-subtitle">Your workspace, operations and learning progress under one account.</p>

      {!supabase && <div className="auth-warning"><b>Authentication backend not configured</b><span>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the deployment environment. No demo account or simulated login is provided.</span></div>}

      <div className="oauth-grid">
        <button disabled={!supabase || !!busy} onClick={() => oauth('google')}><Chrome size={17}/> Google</button>
        <button disabled={!supabase || !!busy} onClick={() => oauth('apple')}><Apple size={17}/> Apple</button>
        <button disabled={!supabase || !!busy} onClick={() => oauth('github')}><Github size={17}/> GitHub</button>
        <button disabled={!openaiConfigured || !!busy} onClick={() => { if (openaiAuthUrl) window.location.assign(openaiAuthUrl) }}><span className="openai-mark">◎</span> ChatGPT</button>
      </div>
      {!openaiConfigured && <p className="auth-provider-note">ChatGPT sign-in requires an OpenAI-issued OAuth client and a secure backend callback. It is intentionally not simulated.</p>}
      <div className="auth-divider"><span/> OR CONTINUE WITH EMAIL <span/></div>

      <form onSubmit={e => {
        e.preventDefault()
        if (!supabase) return
        if (mode === 'signup') void run('signup', () => supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL } }))
        else if (mode === 'reset') void run('reset', () => supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + import.meta.env.BASE_URL }))
        else void run('signin', () => supabase.auth.signInWithPassword({ email: email.trim(), password }))
      }}>
        <label className="auth-label">EMAIL ADDRESS</label>
        <div className="auth-input"><Mail size={16}/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
        {mode !== 'reset' && <>
          <label className="auth-label">PASSWORD</label>
          <div className="auth-input"><input type={showPassword?'text':'password'} required minLength={8} autoComplete={mode === 'signup' ? 'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label="Toggle password visibility">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
        </>}
        <button className="primary-btn auth-submit" type="submit" disabled={!supabase || !!busy}>{busy ? <LoaderCircle className="spin-icon" size={16}/> : null}{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send recovery email'}</button>
      </form>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {message && <div className="auth-success" role="status">{message}</div>}
      <div className="auth-links">
        {mode === 'signin' ? <><button onClick={()=>{setMode('signup');setError('');setMessage('')}}>Create an account</button><button onClick={()=>{setMode('reset');setError('');setMessage('')}}>Forgot password?</button></> : <button onClick={()=>{setMode('signin');setError('');setMessage('')}}>Back to sign in</button>}
      </div>
      <p className="auth-legal">By continuing, you agree to use BLACKVEIL only for systems you own or are explicitly authorized to assess.</p>
    </div>
  </div>
}
