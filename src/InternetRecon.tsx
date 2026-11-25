import { useState } from 'react'
import { Activity, ArrowUpRight, Bug, Database, Globe, LoaderCircle, Search, ShieldCheck, Wifi } from 'lucide-react'

type LookupKind='dns'|'rdap'|'certificates'|'cves'
const kinds:{id:LookupKind;label:string;description:string}[]=[
 {id:'dns',label:'DNS intelligence',description:'Public DNS records through DNS-over-HTTPS'},
 {id:'rdap',label:'RDAP / WHOIS',description:'IP and domain registration or allocation data'},
 {id:'certificates',label:'Certificate transparency',description:'Publicly logged TLS certificates and hostnames'},
 {id:'cves',label:'CVE intelligence',description:'NVD vulnerability catalogue keyword search'}
]
export default function InternetRecon(){
 const [target,setTarget]=useState('')
 const [kind,setKind]=useState<LookupKind>('dns')
 const [record,setRecord]=useState('A')
 const [result,setResult]=useState('')
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [last,setLast]=useState('')
 const run=async()=>{
  setBusy(true);setError('');setResult('')
  try{
   const value=target.trim()
   if(!value)throw new Error('Introduce un dominio, IP o producto.')
   let url=''
   if(kind==='dns'){
    const domain=value.replace(/^https?:\\/\\//i,'').split('/')[0].split(':')[0]
    if(!/^(?=.{1,253}$)[a-z0-9.-]+$/i.test(domain))throw new Error('Introduce un nombre de dominio válido, sin ruta.')
    url='https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(domain)+'&type='+record
   }else if(kind==='rdap'){
    const ip=/^(?:\\d{1,3}\\.){3}\\d{1,3}$/.test(value)
    const domain=/^(?=.{1,253}$)[a-z0-9.-]+\\.[a-z]{2,}$/i.test(value)
    if(!ip&&!domain)throw new Error('RDAP necesita una dirección IPv4 o un dominio.')
    url='https://rdap.org/'+(ip?'ip/':'domain/')+encodeURIComponent(value)
   }else if(kind==='certificates'){
    const domain=value.replace(/^\\*\\./,'').replace(/^https?:\\/\\//i,'').split('/')[0]
    if(!/^(?=.{1,253}$)[a-z0-9.-]+\\.[a-z]{2,}$/i.test(domain))throw new Error('Introduce un dominio público válido.')
    url='https://crt.sh/?q=%25.'+encodeURIComponent(domain)+'&output=json'
   }else{
    if(value.length<2)throw new Error('Introduce al menos dos caracteres.')
    url='https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch='+encodeURIComponent(value)+'&resultsPerPage=20'
   }
   const response=await fetch(url,{headers:kind==='dns'?{accept:'application/dns-json'}:{accept:'application/json'}})
   if(!response.ok)throw new Error('El servicio respondió HTTP '+response.status+'. Puede haber límites o indisponibilidad temporal.')
   const data=await response.json()
   let formatted=''
   if(kind==='dns'){
    const answers=data.Answer||[]
    formatted=['Resolver: Cloudflare DNS-over-HTTPS','Query: '+value+' '+record,'Status: '+(data.Status===0?'NOERROR':'DNS status '+data.Status),'Answers: '+answers.length,'',...answers.map((a:any)=>a.name+' TTL='+a.TTL+' '+a.data)].join('\\n')
    if(!answers.length)formatted+='\\nNo records returned. This does not necessarily mean the domain is unavailable.'
   }else if(kind==='rdap'){
    formatted=JSON.stringify({objectClassName:data.objectClassName,handle:data.handle,name:data.name,ldhName:data.ldhName,country:data.country,startAddress:data.startAddress,endAddress:data.endAddress,status:data.status,events:data.events,nameservers:data.nameservers,entities:data.entities?.map((e:any)=>({roles:e.roles,vcardArray:e.vcardArray}))},null,2)
   }else if(kind==='certificates'){
    const rows=Array.isArray(data)?data:[]
    formatted='Certificate Transparency results: '+rows.length+'\\n\\n'+rows.slice(0,100).map((x:any)=>[x.common_name,x.name_value,'Issuer: '+x.issuer_name,'Not before: '+x.not_before,'Not after: '+x.not_after].filter(Boolean).join('\\n')).join('\\n\\n')
    if(!rows.length)formatted='No matching certificate entries returned.'
   }else{
    const rows=data.vulnerabilities||[]
    formatted='NVD total results: '+(data.totalResults??rows.length)+'\\nReturned: '+rows.length+'\\n\\n'+rows.map((x:any)=>{const c=x.cve;const desc=c.descriptions?.find((d:any)=>d.lang==='en')?.value||'No English description';const metric=c.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore??c.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore??c.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore??'N/A';return c.id+' | CVSS '+metric+'\\n'+desc.slice(0,700)}).join('\\n\\n')||'No matching CVEs found.'
   }
   setResult(formatted);setLast(new Date().toLocaleString())
  }catch(e){setError(e instanceof Error?e.message:'Unknown lookup error')}finally{setBusy(false)}
 }
 return <div className="platform-module"><div className="page-heading compact-heading"><div><div className="eyebrow">GLOBAL INTERNET / PASSIVE RECONNAISSANCE</div><h1>Internet intelligence<span className="heading-dot">.</span></h1><p>Real-time lookups against public internet datasets. No fabricated scan results.</p></div><span className="date-chip"><Globe size={14}/> PUBLIC SOURCES</span></div>
 <div className="internet-grid"><section className="panel internet-controls"><div className="panel-heading"><div><div className="eyebrow">01 / DATA SOURCE</div><h3>Choose intelligence source</h3></div><Wifi size={18}/></div><div className="internet-source-list">{kinds.map(k=><button key={k.id} className={'internet-source '+(kind===k.id?'selected':'')} onClick={()=>{setKind(k.id);setResult('');setError('')}}><span className="internet-source-icon">{k.id==='dns'?<Activity size={16}/>:k.id==='rdap'?<Database size={16}/>:k.id==='certificates'?<ShieldCheck size={16}/>:<Bug size={16}/>}</span><span><b>{k.label}</b><small>{k.description}</small></span><ArrowUpRight size={14}/></button>)}</div><label className="field-label">DOMAIN / IP / PRODUCT KEYWORD</label><input className="internet-target" value={target} onChange={e=>setTarget(e.target.value)} placeholder={kind==='cves'?'e.g. OpenSSH 9.6':kind==='rdap'?'example.com or 8.8.8.8':'example.com'} onKeyDown={e=>{if(e.key==='Enter')void run()}}/>{kind==='dns'&&<><label className="field-label">DNS RECORD TYPE</label><select className="internet-target" value={record} onChange={e=>setRecord(e.target.value)}>{['A','AAAA','MX','TXT','NS','CNAME','CAA','SOA'].map(x=><option key={x}>{x}</option>)}</select></>}<button className="primary-btn run-btn" onClick={()=>void run()} disabled={busy||!target.trim()}>{busy?<LoaderCircle className="spin-icon" size={15}/>:<Search size={15}/>} {busy?'Querying public source…':'Run internet lookup'}</button>{error&&<div className="auth-error">{error}</div>}<p className="privacy-note"><Globe size={13}/> Requests are sent to the selected public provider. Do not submit private indicators or sensitive internal hostnames.</p></section>
 <section className="panel internet-results"><div className="panel-heading"><div><div className="eyebrow">02 / LIVE RESPONSE</div><h3>Intelligence output</h3></div><span className="live-label"><span/> LIVE QUERY</span></div>{result?<><div className="internet-result-meta"><span>{kinds.find(k=>k.id===kind)?.label}</span><time>{last}</time></div><pre className="intel-details internet-output">{result}</pre><button className="text-link" onClick={()=>void navigator.clipboard.writeText(result)}>Copy response <ArrowUpRight size={13}/></button></>:<div className="empty-activity"><div className="empty-icon"><Globe size={20}/></div><b>Awaiting an internet query</b><span>Choose a source, enter a target and run a lookup.</span></div>}</section></div>
 <section className="panel internet-connectors"><div className="panel-heading"><div><div className="eyebrow">03 / ADVANCED PROVIDERS</div><h3>External intelligence connectors</h3></div><Database size={18}/></div><div className="connector-grid"><article><b>Shodan</b><p>Internet-exposed service and banner intelligence. Requires a Shodan API key and a server-side proxy.</p><span className="planned-tag">SERVER KEY REQUIRED</span></article><article><b>Censys</b><p>Host, service and certificate intelligence from the Censys Internet Map. Requires API credentials.</p><span className="planned-tag">SERVER KEY REQUIRED</span></article><article><b>VirusTotal / AbuseIPDB</b><p>Reputation and multi-engine context for IPs, domains, URLs and file hashes. Requires provider API credentials.</p><span className="planned-tag">SERVER KEY REQUIRED</span></article></div></section>
 <div className="module-footnote">These are passive public-data lookups, not proof that an asset is vulnerable or authorized for testing. Active assessment requires a verified engagement scope and a separately deployed scan worker. Public providers may rate-limit requests or restrict browser CORS access.</div></div>
}
