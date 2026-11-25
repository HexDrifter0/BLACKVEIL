import { useEffect, useState } from 'react'
import { Activity, Clock3 } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from './lib/supabase'

type EventRow = { id:number; event_type:string; resource_type:string|null; resource_id:string|null; created_at:string }
const labels:Record<string,string> = {
  'engagement.created':'Engagement created',
  'engagement.deleted':'Engagement deleted',
  'profile.updated':'Operator profile updated',
  'threat_indicators.ingested':'Threat indicators ingested',
  'threat_intelligence.enriched':'Indicator enriched with providers'
}
export default function AuditFeed({user}:{user:User|null}) {
  const [events,setEvents]=useState<EventRow[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  useEffect(()=>{
    let alive=true
    const load=async()=>{
      setLoading(true);setError('')
      if(!user){setEvents([]);setLoading(false);return}
      const supabase=getSupabaseClient()
      if(!supabase){setEvents([]);setLoading(false);return}
      const {data,error}=await supabase.from('audit_events').select('id,event_type,resource_type,resource_id,created_at').order('created_at',{ascending:false}).limit(8)
      if(!alive)return
      if(error)setError(error.message)
      else setEvents(data??[])
      setLoading(false)
    }
    void load()
    return()=>{alive=false}
  },[user?.id])
  if(loading)return <div className="empty-activity"><div className="empty-icon"><Activity size={20}/></div><b>Loading audit trail</b><span>Retrieving account events…</span></div>
  if(error)return <div className="empty-activity"><div className="empty-icon"><Activity size={20}/></div><b>Audit trail unavailable</b><span>{error}</span></div>
  if(!user||events.length===0)return <div className="empty-activity"><div className="empty-icon"><Activity size={20}/></div><b>All quiet on the wire</b><span>{user?'Your account events will appear here.':'Sign in to view your cloud audit trail.'}</span></div>
  return <div className="quick-tools">{events.map(event=><div className="quick-tool" key={event.id}><div className="tool-icon"><Activity size={16}/></div><div><b>{labels[event.event_type]??event.event_type}</b><span>{event.resource_type??'Workspace'}{event.resource_id?' · '+event.resource_id.slice(0,18):''}</span></div><time><Clock3 size={12}/>{new Date(event.created_at).toLocaleString()}</time></div>)}</div>
}
