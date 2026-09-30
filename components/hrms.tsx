'use client';
import {useState,useEffect} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import Link from 'next/link';
import {LayoutDashboard,Users,Clock3,CalendarDays,CalendarOff,Building2,FolderKanban,Network,ClipboardCheck,Settings,LogOut,ChevronDown,ChevronLeft,ChevronRight,Plus,ArrowUpRight,Menu,X,Check,Download,Search,ShieldCheck,ArrowRight,UserRound,RefreshCw,Pencil,Trash2,BriefcaseBusiness,CheckCheck,Timer,Sun,FileClock} from 'lucide-react';
import Workday, {BreakHistory} from './workday';
import {monthlyAttendance} from '@/lib/monthly-attendance';
import {workTotals,durationLabel} from '@/lib/breaks';
import {useHRMS} from '@/lib/store';
import {Employee,Entity,Project,Leave,Adjustment} from '@/lib/types';
import {dayKey,addDays,dateRange,attendanceStatus,offDay,timeLabel,hours,balance,localToISO} from '@/lib/domain';
import {supabase,demoEnabled} from '@/lib/supabase';
import {Avatar,Badge,Empty,SearchBox,Modal,Form,Field} from './ui';

const adminNav=[['overview','Overview',LayoutDashboard],['employees','Employees',Users],['attendance','Attendance',Clock3],['leaves','Leave management',CalendarDays],['off-days','Off-day calendar',CalendarOff],['allocations','Team allocation',Network],['approvals','Approvals',ClipboardCheck],['settings','Settings',Settings]] as const;
const employeeNav=[['overview','Overview',LayoutDashboard],['attendance','My attendance',Clock3],['leaves','My leave',CalendarDays],['adjustments','Attendance adjustments',FileClock],['profile','My profile',UserRound]] as const;
const opts=(values:string[])=>values.map(value=>({value,label:value.replaceAll('_',' ').replace(/^./,c=>c.toUpperCase())}));
const fmt=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});

export default function HRMS(){
  const store=useHRMS();
  const {data,me:rawMe,demo,loading,error,busy}=store;
  const [cachedMe,setCachedMe]=useState<typeof rawMe>(null);

    useEffect(()=>{
      try{
        const raw=localStorage.getItem('hudasoft_cached_me');
        if(raw) setCachedMe(JSON.parse(raw));
      }catch{}
    },[]);

    useEffect(()=>{
      if(rawMe){ 
        setCachedMe(rawMe); 
        try{ localStorage.setItem('hudasoft_cached_me',JSON.stringify(rawMe)); }catch{} 
      }
    },[rawMe]);

  const me = rawMe || cachedMe;
  const router=useRouter();
  const path=usePathname();
  const section=path.split('/')[2]||'overview';
  const isAdmin=me?.role==='admin'&&!path.startsWith('/employee');
  const base=isAdmin?'/admin':'/employee';
  const nav=isAdmin?adminNav:employeeNav;
  const [mobile,setMobile]=useState(false);
  const [query,setQuery]=useState('');
  const [statusFilter,setStatusFilter]=useState('all');
  const [date,setDate]=useState(dayKey());
  const [month,setMonth]=useState(dayKey().slice(0,7));
  const [selectedEmployee,setSelectedEmployee]=useState('');
  const [year,setYear]=useState(new Date().getFullYear());
  const [modal,setModal]=useState<{kind:string;row?:Record<string,unknown>}|null>(null);
  const [notice,setNotice]=useState('');
  const [view,setView]=useState('list');
  const [navigating,setNavigating]=useState(false);
  const [mounted,setMounted]=useState(false);
  
  useEffect(()=>{ setMounted(true); },[]);

  useEffect(()=>{
  setQuery('');
  setStatusFilter('all');
  setMobile(false);
},[path]);

// Route change pe loader dikhao (sirf heavy pages pe)
  useEffect(()=>{
    setNavigating(true);
    const t = setTimeout(()=>setNavigating(false), 600);
    return ()=>clearTimeout(t);
  },[path]);
  useEffect(()=>{if(me&&(path==='/'||me.role==='employee'&&path.startsWith('/admin')))router.replace(me.role==='admin'?'/admin':'/employee');},[me,path,router]);
  useEffect(()=>{if(!notice)return;const timeout=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timeout);},[notice]);

  const [now,setNow]=useState(Date.now);
  useEffect(()=>{const tick=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(tick);},[]);

  const today=dayKey(new Date(now),data.settings.timezone);
  const currentYear=Number(today.slice(0,4));

    // ✅ Admin bhi shamil hai
  const people=data.employees.filter(e=>e.status==='active');

    // ✅ Sab employees (admin ke saath)
  const allEmployees=data.employees;

  const pending=data.leaves.filter(l=>l.status==='pending').length+data.adjustments.filter(a=>a.status==='pending').length;
  const person=(id:string|null)=>data.employees.find(e=>e.id===id);
  const project=(id:string)=>data.projects.find(p=>p.id===id);
  const customer=(id:string)=>data.customers.find(c=>c.id===id);
  const action=async(fn:()=>Promise<unknown>,message:string,close=true)=>{try{await fn();if(close)setModal(null);setNotice(message);}catch(e){store.setError(e instanceof Error?e.message:'Something went wrong. Please try again.');}};
  const employeeOptions=people.map(e=>({value:e.id,label:e.name}));
  const openEdit=(kind:Entity,row?:unknown)=>{store.setError('');setModal({kind,row:row as Record<string,unknown>|undefined});};
  const exportCSV=(headers:string[],rows:unknown[][],name:string)=>{const cell=(v:unknown)=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const blob=new Blob(['\uFEFF'+[headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();URL.revokeObjectURL(url);};

 
  if(!me){
        if(!mounted)return <div className="island-loader">
      <div className="island">
        <span className="island-mark">H</span>
        <span className="island-text">hudasoft</span>
        <span className="island-dots"><span/><span/><span/></span>
      </div>
    </div>;   
    
    return <main className="login"><section className="login-story"><div className="brand"><img src="/favicon.svg" alt="Hudasoft" className="brand-logo" />hudasoft<span className="brand-dot">.</span></div><div><span className="eyebrow">PEOPLE. PROJECTS. POSSIBILITIES.</span><h1>Good work starts<br/>with your people.</h1><p>A little less admin.<br/>A lot more room to do great work.</p><div className="login-pills"><span><Users size={18}/>Your people</span><span><Clock3 size={18}/>Your workdays</span><span><FolderKanban size={18}/>Your projects</span></div></div><small>Human Resource Management System</small></section><section className="login-form"><div className="login-inner"><span className="login-icon"><BriefcaseBusiness size={28}/></span><h2>Welcome to your workspace</h2><p>Sign in to manage your workday.</p>{error&&<div className="error" role="alert">{error}</div>}<button className="google-button" disabled={!supabase} onClick={()=>action(store.signIn,'Redirecting to Google',false)}><span className="google-g">G</span>Continue with Google<ArrowRight size={18}/></button>{!supabase&&<p className="setup-note">Google sign-in will be available once your Supabase project is connected.</p>}<div className="secure-note"><ShieldCheck size={17}/>Access is limited to approved employees.</div>{demoEnabled&&<div className="demo-login"><span>EXPLORE WITH SAMPLE DATA</span><div><button className="button" onClick={()=>store.enterDemo('admin')}>Admin demo<ArrowUpRight size={16}/></button><button className="button" onClick={()=>store.enterDemo('employee')}>Employee demo<ArrowUpRight size={16}/></button></div><p>Demo changes stay in this browser. No real employee records.</p></div>}</div><small>One connected place for your entire team.</small></section></main>;
  }
  const employeeId=isAdmin?(selectedEmployee||me.id):me.id;
  const matches=(value:string)=>value.toLowerCase().includes(query.toLowerCase());
  const activeAlloc=(id:string)=>data.allocations.filter(a=>a.employee_id===id&&a.start_date<=today&&a.end_date>=today).reduce((n,a)=>n+a.percentage,0);
  const go=(slug:string)=>router.push(base+'/'+slug);

  function employeeCell(id:string|null){const e=person(id);return <div className="person"><Avatar name={e?.name||'Unknown'} small/><div><strong>{e?.name||'Unknown employee'}</strong><small>{e?.designation||'—'}</small></div></div>;}
  function heading(title:string,subtitle:string,button?:{label:string;fn:()=>void}){return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{button&&<button className="button primary" onClick={button.fn}><Plus size={18}/>{button.label}</button>}</div>;}
  function stat(label:string,value:string|number,caption:string,Icon:typeof Users,color='blue'){return <div className="stat"><div className="stat-top"><span>{label}</span><span className={'stat-icon '+color}><Icon size={19}/></span></div><strong>{value}</strong><small>{caption}</small></div>;}

  function overview(){
    const present=people.filter(e=>['Present','Late','Checked in','Missing entry'].includes(attendanceStatus(e.id,today,data))).length;
    const onLeave=people.filter(e=>attendanceStatus(e.id,today,data)==='On leave').length;
    const todayRecord=data.attendance.find(a=>a.employee_id===me!.id&&a.work_date===today);
    const upcoming=data.holidays.filter(h=>h.date>=today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
    return <>
      <div className="page-heading" style={{flexWrap:'wrap',gap:'12px'}}>
            <div style={{display:'flex',alignItems:'baseline',gap:'14px',flexWrap:'wrap'}}>
                <h1 style={{margin:0}}>Good {mounted?(new Date().getHours()<12?'morning':'afternoon'):'day'}, {me!.name.split(' ')[0]} ☀</h1>
                <p style={{margin:0,color:'var(--muted)',fontSize:'13px'}}>{isAdmin?'Here’s what’s happening with your team today.':'Let’s make it a good workday.'}</p>
                <span style={{display:'inline-flex',alignItems:'center',gap:'6px',color:'#697689',fontSize:'12px'}}><CalendarDays size={14}/>{new Date(today+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
                <span className="timezone" style={{marginLeft:'auto'}}>{data.settings.timezone.replaceAll('_',' ')}</span>
            </div>
        </div>
      {isAdmin?<>
        <div className="stats">
          {stat('Total employees',people.length,'Active team members',Users)}
          {stat('Present today',present,offDay(today,data)||`${people.length?Math.round(present/people.length*100):0}% of your team`,Clock3,'green')}
          {stat('On leave',onLeave,'Approved leave today',CalendarDays,'orange')}
          {stat('Active projects',data.projects.filter(p=>p.status==='active').length,`${data.customers.filter(c=>c.status==='active').length} active customers`,FolderKanban,'purple')}
        </div>
        <div className="dashboard-grid">
          <section className="panel attendance-panel">
            <div className="panel-heading"><div><h2>Attendance overview</h2><p>Your team over the past 7 days</p></div><span className="legend"><i/> Present <i className="light"/> Away / off</span></div>
            <div className="chart">{Array.from({length:7},(_,i)=>addDays(today,i-6)).map(d=>{const count=people.filter(e=>['Present','Late','Checked in','Missing entry'].includes(attendanceStatus(e.id,d,data))).length;return <div className={'chart-column '+(d===today?'today':'')} key={d}><span className="bar-value">{count}</span><div className="bar-track"><div className="bar-fill" style={{height:`${people.length?count/people.length*100:0}%`}}/></div><span>{new Date(d+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short'})}</span></div>;})}</div>
            <div className="panel-foot"><span><span className="tiny-dot"/>Live from your attendance records</span><button className="text-button" onClick={()=>go('attendance')}>View attendance <ArrowRight size={15}/></button></div>
          </section>
          <section className="panel">
            <div className="panel-heading"><div><h2>Needs your attention</h2><p>A few things to keep work moving</p></div><span className="count">{pending}</span></div>
            <button className="attention-row" onClick={()=>go('approvals')}><span className="attention-icon orange"><CalendarDays size={20}/></span><span><strong>Leave requests</strong><small>Waiting for your approval</small></span><b>{data.leaves.filter(l=>l.status==='pending').length}</b><ChevronRight size={17}/></button>
            <button className="attention-row" onClick={()=>go('approvals')}><span className="attention-icon purple"><FileClock size={20}/></span><span><strong>Attendance adjustments</strong><small>Missing entries to review</small></span><b>{data.adjustments.filter(a=>a.status==='pending').length}</b><ChevronRight size={17}/></button>
            <div className="quick-note"><ShieldCheck size={19}/><p>Every approval is recorded in your audit history.</p></div>
          </section>
        </div>
        <section className="panel">
          <div className="panel-heading"><div><h2>Projects in motion</h2><p>A quick look at what your team is working on</p></div><button className="text-button" onClick={()=>go('projects')}>All projects <ArrowUpRight size={16}/></button></div>
          {data.projects.length?<div className="table-scroll"><table><thead><tr><th>PROJECT</th><th>CUSTOMER</th><th>TEAM</th><th>PROGRESS</th><th>STATUS</th></tr></thead><tbody>{data.projects.filter(p=>p.status!=='cancelled').slice(0,4).map(p=><tr key={p.id}><td><button className="project-link" onClick={()=>go('projects')}><span className="project-symbol"><FolderKanban size={18}/></span><strong>{p.name}</strong></button></td><td>{customer(p.customer_id)?.name||'—'}</td><td><div className="avatar-stack">{data.allocations.filter(a=>a.project_id===p.id).slice(0,4).map(a=><Avatar key={a.id} small name={person(a.employee_id)?.name||'Employee'}/>)}</div></td><td><div className="progress-inline"><progress max={100} value={p.progress}/><span>{p.progress}%</span></div></td><td><Badge>{p.status}</Badge></td></tr>)}</tbody></table></div>:<Empty title="Your next project starts here" text="Add a customer, then create your first project."/>}
        </section>
      </>:<>
        {/* ✅ CHANGE 3: Employee view mein Workday pehle, stats baad mein */}
        <div className="dashboard-grid">
          <Workday data={data} employee={me!} now={now} busy={busy} onAction={(name,args,message)=>action(()=>store.rpc(name,args),message,false)}/>
          <section className="panel">
            <div className="panel-heading"><div><h2>Quick actions</h2><p>Take care of the everyday</p></div></div>
            {[['Request time off','Plan your next break','leave',CalendarDays],['Fix a missing entry','Submit an attendance adjustment','adjustment',FileClock],['View your profile','Keep your personal details up to date','profile',UserRound]].map(([title,text,kind,Icon])=>{const I=Icon as typeof Users;return <button className="attention-row" key={String(kind)} onClick={()=>kind==='profile'?go('profile'):setModal({kind:String(kind)})}><span className="attention-icon blue"><I size={20}/></span><span><strong>{String(title)}</strong><small>{String(text)}</small></span><ChevronRight size={18}/></button>;})}
          </section>
        </div>
        <div className="stats">
          {stat('Today’s status',attendanceStatus(me!.id,today,data),offDay(today,data)||'Your attendance today',Clock3)}
          {stat('Annual leave',balance(me!,'annual',currentYear,data).remaining,'Days available after pending requests',CalendarDays,'green')}
          {stat('My projects',data.allocations.filter(a=>a.employee_id===me!.id&&a.end_date>=today).length,'Current and upcoming assignments',FolderKanban,'purple')}
          {stat('Pending requests',data.leaves.filter(l=>l.employee_id===me!.id&&l.status==='pending').length+data.adjustments.filter(a=>a.employee_id===me!.id&&a.status==='pending').length,'Awaiting admin review',ClipboardCheck,'orange')}
        </div>
      </>}
      <div className="dashboard-grid bottom-grid">
        <section className="panel">
          <div className="panel-heading"><div><h2>Upcoming off days</h2><p>A little time to recharge</p></div>{isAdmin&&<button className="text-button" onClick={()=>go('off-days')}>Calendar <ArrowUpRight size={16}/></button>}</div>
          {upcoming.length?upcoming.map(h=><div className="holiday-row" key={h.id}><div className="date-tile"><strong>{Number(h.date.slice(8))}</strong><small>{new Date(h.date+'T12:00:00').toLocaleDateString('en-GB',{month:'short'})}</small></div><div><strong>{h.name}</strong><small>{new Date(h.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long'})}</small></div><Badge>{h.kind}</Badge></div>):<Empty title="No upcoming holidays" text="Your weekly off days still apply."/>}
        </section>
        <section className="team-note">
          <div className="team-note-icon"><Users size={27}/></div>
          <h2>Everything connected.<br/>Everyone in the loop.</h2>
          <p>{isAdmin?'Keep your people, projects, and workdays moving together.':'Your attendance, leave, and project assignments, all in one place.'}</p>
          <button className="text-button" onClick={()=>go(isAdmin?'employees':'attendance')}>{isAdmin?'Meet your team':'View your workdays'}<ArrowRight size={17}/></button>
        </section>
      </div>
    </>;
  }

  function employees(){
    // ✅ CHANGE 4: Admin ko employees list se exclude
    const rows=allEmployees.filter(e=>matches(e.name+' '+e.email+' '+e.department)&&(statusFilter==='all'||e.status===statusFilter));
    return <>
      {heading('Your people','A connected team starts with the right information.',{label:'Add employee',fn:()=>openEdit('employees')})}
      <div className="stats three">
        {stat('All employees',allEmployees.length,'Across your organization',Users)}
        {stat('Active employees',people.length,'Currently on the team',CheckCheck,'green')}
        {stat('Departments',new Set(people.map(e=>e.department)).size,'Teams working together',Building2,'purple')}
      </div>
      <section className="panel">
        <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search name, email or department…"/><select aria-label="Employee status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <div className="table-scroll"><table><thead><tr><th>EMPLOYEE</th><th>EMPLOYEE ID</th><th>DEPARTMENT</th><th>HOURS/DAY</th><th>DAYS/MONTH</th><th>JOINED</th><th>STATUS</th><th>ROLE</th><th/></tr></thead><tbody>{rows.map(e=><tr key={e.id}><td>{employeeCell(e.id)}</td><td>{e.employee_code}</td><td>{e.department}</td><td>{e.daily_hours || 9} h</td><td>{e.monthly_days ?`${e.monthly_days} days` : 'All'}</td><td>{fmt(e.joined_on)}</td><td><Badge>{e.status}</Badge></td><td className="capitalize">{e.role}</td><td><button className="icon-button" aria-label={'Edit '+e.name} onClick={()=>openEdit('employees',e)}><Pencil size={17}/></button></td></tr>)}</tbody></table></div>
        {!rows.length&&<Empty title="No employees found" text="Add an employee or try a different search."/>}
        <div className="panel-foot">{rows.length} employees</div>
      </section>
    </>;
  }

  function attendance(){
    const monthly=isAdmin&&view==='list';
    // ✅ CHANGE 5: Admin ko attendance rows se exclude
    const rows=(isAdmin?allEmployees:[me!]).filter(e=>matches(e.name));
    const monthStart=month+'-01';
    const monthEnd=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();
    const days=Array.from({length:monthEnd},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`);
    return <>
      {heading(isAdmin?'Attendance':'My attendance',isAdmin?'Every workday, accounted for.':'Your workdays at a glance.',!isAdmin?{label:'Request adjustment',fn:()=>setModal({kind:'adjustment'})}:undefined)}
      <section className="panel">
        <div className="toolbar">
          <div className="tabs">{isAdmin&&<button className={view==='list'?'selected':''} onClick={()=>setView('list')}>Monthly summary</button>}<button className={view===(isAdmin?'daily':'list')?'selected':''} onClick={()=>setView(isAdmin?'daily':'list')}>Daily records</button><button className={view==='calendar'?'selected':''} onClick={()=>setView('calendar')}>Calendar</button></div>
          <div className="toolbar-group">
            {(view==='daily'||!isAdmin&&view==='list')?<input aria-label="Attendance date" type="date" value={date} onChange={e=>setDate(e.target.value)}/>:<><input type="month" aria-label="Attendance month" value={month} onChange={e=>setMonth(e.target.value)}/>{isAdmin&&view==='calendar'&&<select aria-label="Calendar employee" value={employeeId} onChange={e=>setSelectedEmployee(e.target.value)}>{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>}</>}
            <button className="button" onClick={()=>monthly?exportCSV(['Employee','Month','Total hours','Hours worked','Violations (hours)','Missing check-outs'],rows.map(e=>{const m=monthlyAttendance(e,month,data,now);return[e.name,month,m.totalHours,m.workedHours.toFixed(2),m.violationHours.toFixed(2),m.missingEntries];}),'attendance-monthly-'+month):exportCSV(['Employee','Date','Status','Check in','Check out','Actual worked hours'],view==='calendar'?days.map(d=>{const a=data.attendance.find(a=>a.employee_id===employeeId&&a.work_date===d);return [person(employeeId)?.name,d,attendanceStatus(employeeId,d,data),timeLabel(a?.check_in||null,data.settings.timezone),timeLabel(a?.check_out||null,data.settings.timezone),(workTotals(a,data.breaks,now).workedMs/3600000).toFixed(2)];}):rows.map(e=>{const a=data.attendance.find(a=>a.employee_id===e.id&&a.work_date===date);return[e.name,date,attendanceStatus(e.id,date,data),timeLabel(a?.check_in||null,data.settings.timezone),timeLabel(a?.check_out||null,data.settings.timezone),(workTotals(a,data.breaks,now).workedMs/3600000).toFixed(2)];}),'attendance-'+(view==='calendar'?month:date))}><Download size={16}/>Export</button>
          </div>
        </div>
        {monthly?<>
          <div className="monthly-explanation"><strong>{new Date(month+'-01T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</strong></div>
          <div className="table-scroll"><table><thead><tr><th>EMPLOYEE</th><th>TOTAL HOURS</th><th>HOURS WORKED</th><th>VIOLATIONS</th></tr></thead><tbody>{rows.map(e=>{const m=monthlyAttendance(e,month,data,now);return <tr key={e.id}><td>{employeeCell(e.id)}</td><td><strong>{m.totalHours} h</strong><small>{m.targetDays} days × {m.dailyHours} h</small></td><td><strong>{m.workedHours.toFixed(2)} h</strong>{m.missingEntries>0&&<small>{m.missingEntries} missing check-out(s) excluded</small>}</td><td><span className={m.violationHours>0?'monthly-deficit':'monthly-complete'}>{m.violationHours.toFixed(2)} h</span><small>{month}</small></td></tr>;})}</tbody></table></div>
          {!rows.length&&<Empty/>}
        </>:view==='calendar'?<>
          <div className="calendar-legend">{['Present','Late','Absent','On leave','Off day','Missing entry'].map(s=><Badge key={s}>{s}</Badge>)}</div>
          <div className="calendar">
            <div className="calendar-week">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><span key={d}>{d}</span>)}</div>
            <div className="calendar-grid">{Array.from({length:new Date(monthStart+'T12:00:00').getDay()},(_,i)=><div className="calendar-day blank" key={'empty'+i}/>)}{days.map(d=>{const status=attendanceStatus(employeeId,d,data);const a=data.attendance.find(a=>a.employee_id===employeeId&&a.work_date===d);return <button key={d} className={'calendar-day '+(d===today?'current-day':'')+' '+(offDay(d,data)?'off':'')} onClick={()=>setModal({kind:'day',row:{date:d,employee_id:employeeId}})}><strong>{Number(d.slice(8))}</strong><Badge>{status}</Badge><small>{a?.check_in?`${timeLabel(a.check_in,data.settings.timezone)} – ${timeLabel(a.check_out,data.settings.timezone)}`:offDay(d,data)||''}</small></button>;})}</div>
          </div>
        </>:<>
          <div className="table-scroll"><table><thead><tr><th>EMPLOYEE</th><th>DATE</th><th>CHECK IN</th><th>CHECK OUT</th><th>ACTUAL WORKED HOURS</th><th>STATUS</th></tr></thead><tbody>{rows.map(e=>{const a=data.attendance.find(a=>a.employee_id===e.id&&a.work_date===date);return <tr key={e.id}><td>{employeeCell(e.id)}</td><td>{fmt(date)}</td><td>{timeLabel(a?.check_in||null,data.settings.timezone)}</td><td>{timeLabel(a?.check_out||null,data.settings.timezone)}</td><td>{a?.check_in?durationLabel(workTotals(a,data.breaks,now).workedMs):'—'}</td><td><Badge>{attendanceStatus(e.id,date,data)}</Badge></td></tr>;})}</tbody></table></div>
          {!rows.length&&<Empty/>}
        </>}
      </section>
      <p className="muted footnote">All times shown in {data.settings.timezone}. Worked hours exclude all breaks, including a break in progress. Open entries from previous days are flagged for review.</p>
    </>;
  }

  function leavePage(){
    const rows=data.leaves.filter(l=>(isAdmin||l.employee_id===me!.id)&&(statusFilter==='all'||l.status===statusFilter));
    return <>
      {heading(isAdmin?'Leave management':'My leave',isAdmin?'Give your team room to rest and recharge.':'Plan your time away and track your balances.',{label:'Request leave',fn:()=>setModal({kind:'leave'})})}
      {!isAdmin&&<div className="stats three">{['annual','sick','casual'].map(type=>{const b=balance(me!,type,currentYear,data);return <div key={type} className="stat"><span className="capitalize">{type} leave · {currentYear}</span><strong>{b.remaining}<small> / {b.allowance} days</small></strong><progress max={b.allowance||1} value={b.used+b.pending}/><small>{b.used} used · {b.pending} pending</small></div>;})}</div>}
      <section className="panel">
        <div className="toolbar"><h2>Leave requests</h2>{filterSelect()}</div>
        <div className="table-scroll"><table><thead><tr>{isAdmin&&<th>EMPLOYEE</th>}<th>LEAVE TYPE</th><th>DATES</th><th>DAYS</th><th>REASON</th><th>STATUS</th><th/></tr></thead><tbody>{rows.map(l=><tr key={l.id}>{isAdmin&&<td>{employeeCell(l.employee_id)}</td>}<td className="capitalize">{l.type}{l.half_day?' · Half day':''}</td><td>{fmt(l.start_date)}{l.end_date!==l.start_date&&<><br/>{fmt(l.end_date)}</>}</td><td>{l.days}</td><td className="reason-cell">{l.reason}{l.review_comment&&<small>Admin: {l.review_comment}</small>}</td><td><Badge>{l.status}</Badge></td><td>{l.status==='pending'&&(isAdmin?<button className="button compact" onClick={()=>setModal({kind:'review',row:{...l,request_kind:'leave'}})}>Review</button>:<button className="text-button" disabled={busy} onClick={()=>action(()=>store.rpc('cancel_leave',{p_id:l.id}),'Leave request cancelled',false)}>Cancel</button>)}</td></tr>)}</tbody></table></div>
        {!rows.length&&<Empty title="No leave requests" text="Your leave requests will appear here."/>}
      </section>
      <p className="footnote muted">Weekly off days and holidays are excluded. Pending requests reserve your balance. Submit separate requests for separate calendar years.</p>
    </>;
  }

  function filterSelect(){return <select aria-label="Request status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All statuses</option>{['pending','approved','rejected','cancelled'].map(s=><option value={s} key={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select>;}

  function approvals(adjustOnly=false){
    const leaves=adjustOnly?[]:data.leaves.filter(l=>statusFilter==='all'?l.status==='pending':l.status===statusFilter);
    const adjustments=data.adjustments.filter(r=>(isAdmin||r.employee_id===me!.id)&&(statusFilter==='all'||r.status===statusFilter));
    return <>
      {heading(adjustOnly?'Attendance adjustments':'Approvals',adjustOnly?'A missed check-in shouldn’t mean a missing workday.':'Review requests and keep your team moving.',adjustOnly?{label:'Request adjustment',fn:()=>setModal({kind:'adjustment'})}:undefined)}
      <div className="toolbar standalone"><span>{adjustOnly?'Your submitted corrections':'Leave and attendance requests'}</span>{filterSelect()}</div>
      {!adjustOnly&&<section className="panel"><div className="panel-heading"><h2>Leave requests <span className="count">{leaves.length}</span></h2></div>{leaves.map(l=><div className="approval-row" key={l.id}>{employeeCell(l.employee_id)}<div><strong className="capitalize">{l.type} leave · {l.days} day{l.days===1?'':'s'}</strong><small>{fmt(l.start_date)} — {fmt(l.end_date)}</small><p>{l.reason}</p></div><Badge>{l.status}</Badge>{l.status==='pending'&&<button className="button" onClick={()=>setModal({kind:'review',row:{...l,request_kind:'leave'}})}>Review request<ArrowUpRight size={15}/></button>}</div>)}{!leaves.length&&<Empty title="You’re all caught up" text="No leave requests to review."/>}</section>}
      <section className="panel"><div className="panel-heading"><h2>Attendance requests</h2></div><div className="table-scroll"><table><thead><tr>{isAdmin&&<th>EMPLOYEE</th>}<th>DATE</th><th>REQUESTED TIMES</th><th>REASON</th><th>STATUS</th><th/></tr></thead><tbody>{adjustments.map(r=><tr key={r.id}>{isAdmin&&<td>{employeeCell(r.employee_id)}</td>}<td>{fmt(r.work_date)}</td><td>{timeLabel(r.requested_in,data.settings.timezone)} — {timeLabel(r.requested_out,data.settings.timezone)}</td><td className="reason-cell">{r.reason}{r.review_comment&&<small>Admin: {r.review_comment}</small>}</td><td><Badge>{r.status}</Badge></td><td>{isAdmin&&r.status==='pending'&&<button className="button compact" onClick={()=>setModal({kind:'review',row:{...r,request_kind:'adjustment'}})}>Review</button>}</td></tr>)}</tbody></table></div>{!adjustments.length&&<Empty title="No adjustment requests" text="Missing-entry requests will appear here."/>}</section>
    </>;
  }

  function offDays(){
    const list=data.holidays.filter(h=>h.date.startsWith(String(year))).sort((a,b)=>a.date.localeCompare(b.date));
    return <>
      {heading('Off-day calendar','Plan your company’s year, one well-earned break at a time.',{label:'Add off day',fn:()=>openEdit('holidays')})}
      <section className="panel">
        <div className="toolbar"><div className="year-picker"><button className="icon-button" aria-label="Previous year" onClick={()=>setYear(year-1)}><ChevronLeft size={19}/></button><h2>{year}</h2><button className="icon-button" aria-label="Next year" onClick={()=>setYear(year+1)}><ChevronRight size={19}/></button></div><span className="muted">{list.length} holidays · Weekly off: {data.settings.weekend_days.map(n=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][n]).join(', ')||'None'}</span></div>
        <div className="year-grid">{Array.from({length:12},(_,m)=>{const prefix=`${year}-${String(m+1).padStart(2,'0')}`;const count=new Date(year,m+1,0).getDate();return <div className="mini-month" key={m}><h3>{new Date(year,m,1).toLocaleDateString('en-GB',{month:'long'})}</h3><div className="mini-grid">{['S','M','T','W','T','F','S'].map((d,i)=><span className="day-label" key={i}>{d}</span>)}{Array.from({length:new Date(year,m,1).getDay()},(_,i)=><span key={'b'+i}/>)}{Array.from({length:count},(_,i)=>{const d=`${prefix}-${String(i+1).padStart(2,'0')}`;const h=data.holidays.find(h=>h.date===d);return <button title={h?.name||offDay(d,data)||d} className={h?'holiday':offDay(d,data)?'weekend':''} key={i} onClick={()=>openEdit('holidays',h||{date:d})}>{i+1}</button>;})}</div></div>;})}</div>
        <div className="panel-foot"><span className="legend"><i/> Holiday <i className="light"/> Weekly off</span><button className="text-button" onClick={()=>go('settings')}>Edit weekly schedule<ArrowUpRight size={15}/></button></div>
      </section>
      <section className="panel"><div className="panel-heading"><h2>Holidays in {year}</h2></div>{list.map(h=><div className="holiday-row" key={h.id}><div className="date-tile"><strong>{Number(h.date.slice(8))}</strong><small>{new Date(h.date+'T12:00:00').toLocaleDateString('en-GB',{month:'short'})}</small></div><div><strong>{h.name}</strong><small>{fmt(h.date)}</small></div><Badge>{h.kind}</Badge><button className="icon-button" aria-label={'Edit '+h.name} onClick={()=>openEdit('holidays',h)}><Pencil size={17}/></button><button className="icon-button danger-text" aria-label={'Delete '+h.name} onClick={()=>setModal({kind:'delete',row:{entity:'holidays',id:h.id,name:h.name}})}><Trash2 size={17}/></button></div>)}{!list.length&&<Empty title="A fresh calendar" text="Add public holidays and company off days for this year."/>}</section>
    </>;
  }

  function customers(){
    const rows=data.customers.filter(c=>matches(c.name+' '+c.contact_name));
    return <>
      {heading('Customers','The relationships behind your work.',{label:'Add customer',fn:()=>openEdit('customers')})}
      <div className="stats three">{stat('Total customers',data.customers.length,'All customer relationships',Building2)}{stat('Active customers',data.customers.filter(c=>c.status==='active').length,'Currently working together',CheckCheck,'green')}{stat('Customer projects',data.projects.length,'Across your portfolio',FolderKanban,'purple')}</div>
      <section className="panel">
        <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search customers…"/></div>
        <div className="table-scroll"><table><thead><tr><th>CUSTOMER</th><th>CONTACT</th><th>PROJECTS</th><th>ASSIGNED EMPLOYEES</th><th>STATUS</th><th/></tr></thead><tbody>{rows.map(c=>{const projects=data.projects.filter(p=>p.customer_id===c.id);const ids=new Set(projects.map(p=>p.id));return <tr key={c.id}><td><div className="person"><span className="customer-symbol"><Building2 size={21}/></span><strong>{c.name}</strong></div></td><td><strong>{c.contact_name}</strong><small>{c.email}</small></td><td>{projects.length}</td><td>{new Set(data.allocations.filter(a=>ids.has(a.project_id)&&a.start_date<=today&&a.end_date>=today).map(a=>a.employee_id)).size}</td><td><Badge>{c.status}</Badge></td><td><button className="icon-button" aria-label={'Edit '+c.name} onClick={()=>openEdit('customers',c)}><Pencil size={17}/></button></td></tr>;})}</tbody></table></div>
        {!rows.length&&<Empty title="No customers found" text="Add your first customer to start linking projects."/>}
      </section>
    </>;
  }

  function projects(){
    const myIds=new Set(data.allocations.filter(a=>a.employee_id===me!.id).map(a=>a.project_id));
    const rows=data.projects.filter(p=>(isAdmin||myIds.has(p.id))&&matches(p.name)&&(statusFilter==='all'||p.status===statusFilter));
    return <>
      {heading(isAdmin?'Projects':'My projects',isAdmin?'The big picture, with every detail in place.':'See where you’re making an impact.',isAdmin?{label:'New project',fn:()=>openEdit('projects')}:undefined)}
      <div className="toolbar standalone"><SearchBox value={query} onChange={setQuery} placeholder="Search projects…"/><select aria-label="Project status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All projects</option>{opts(['planned','active','on_hold','completed','cancelled']).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      <div className="project-grid">{rows.map(p=>{const assignments=data.allocations.filter(a=>a.project_id===p.id);return <section className="panel project-card" key={p.id}><div className="project-card-top"><span className="project-symbol"><FolderKanban size={22}/></span><Badge>{p.status}</Badge>{isAdmin&&<button className="icon-button" aria-label={'Edit '+p.name} onClick={()=>openEdit('projects',p)}><Pencil size={17}/></button>}</div><small className="eyebrow">{customer(p.customer_id)?.name||'Assigned project'}</small><h2>{p.name}</h2><p className="project-description">{p.description||'No description added.'}</p><div className="progress-label"><span>Progress</span><strong>{p.progress}%</strong></div><progress max={100} value={p.progress}/><div className="project-dates"><CalendarDays size={15}/>{fmt(p.start_date)} — {fmt(p.end_date)}</div><div className="project-bottom"><div className="avatar-stack">{assignments.slice(0,4).map(a=><Avatar key={a.id} name={person(a.employee_id)?.name||'Employee'} small/>)}</div><span>{assignments.length} assigned</span><Badge>{p.priority}</Badge></div>{!isAdmin&&assignments.filter(a=>a.employee_id===me!.id).map(a=><p className="assignment-note" key={a.id}>{a.role} · {a.percentage}% · {fmt(a.start_date)} – {fmt(a.end_date)}</p>)}</section>;})}</div>
      {!rows.length&&<section className="panel"><Empty title="No projects to show" text={isAdmin?'Create a project and bring the right people together.':'Your project assignments will appear here.'}/></section>}
    </>;
  }

  function allocations(){
    return <>
      {heading('Team allocation','The right people, in the right places.',{label:'Allocate employee',fn:()=>openEdit('allocations')})}
      <div className="stats three">{stat('Fully allocated',people.filter(e=>activeAlloc(e.id)>=100).length,'100% assigned today',Network,'purple')}{stat('Partially allocated',people.filter(e=>activeAlloc(e.id)>0&&activeAlloc(e.id)<100).length,'Room for another assignment',Users)}{stat('Available',people.filter(e=>activeAlloc(e.id)===0).length,'No allocation today; check leave before assigning',CheckCheck,'green')}</div>
      <section className="panel">
        <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search employees…"/><span className="muted">Allocation as of {fmt(today)}</span></div>
        {people.filter(e=>matches(e.name)).map(e=><div className="allocation-person" key={e.id}><div className="allocation-person-top">{employeeCell(e.id)}<Badge>{attendanceStatus(e.id,today,data)}</Badge><div className="allocation-meter"><progress max={100} value={activeAlloc(e.id)}/><strong>{activeAlloc(e.id)}%</strong></div></div><div className="assignment-list">{data.allocations.filter(a=>a.employee_id===e.id).map(a=><div className="assignment" key={a.id}><span className="assignment-dot"/><div><strong>{project(a.project_id)?.name||'Project'}</strong><small>{a.role} · {fmt(a.start_date)} – {fmt(a.end_date)}</small></div><b>{a.percentage}%</b><button className="icon-button" aria-label={'Edit allocation for '+e.name} onClick={()=>openEdit('allocations',a)}><Pencil size={16}/></button><button className="icon-button" aria-label={'Remove allocation for '+e.name} onClick={()=>setModal({kind:'delete',row:{entity:'allocations',id:a.id,name:'this assignment'}})}><Trash2 size={16}/></button></div>)}{!data.allocations.some(a=>a.employee_id===e.id)&&<p className="muted">No assignments yet</p>}</div></div>)}
      </section>
    </>;
  }

  function profile(){
    return <>
      {heading('My profile','Keep the details that matter up to date.')}
      <div className="profile-layout">
        <section className="panel profile-card"><Avatar name={me!.name}/><h2>{me!.name}</h2><p>{me!.designation}</p><Badge>{me!.status}</Badge><dl><dt>Employee ID</dt><dd>{me!.employee_code}</dd><dt>Department</dt><dd>{me!.department}</dd><dt>Work email</dt><dd>{me!.email}</dd><dt>Joined</dt><dd>{fmt(me!.joined_on)}</dd><dt>Employment</dt><dd>{me!.employment_type}</dd><dt>Reporting manager</dt><dd>{person(me!.manager_id)?.name||'Not assigned'}</dd></dl></section>
        <section className="panel profile-form"><h2>Personal information</h2><p className="muted">Employment details are managed by your administrator.</p><Form busy={busy} initial={{...me}} fields={[{name:'phone',label:'Phone number',type:'tel'},{name:'address',label:'Address',type:'textarea',wide:true},{name:'emergency_contact',label:'Emergency contact',wide:true,placeholder:'Name, relationship and phone number'}]} onSubmit={v=>action(()=>store.rpc('update_my_profile',{p_phone:v.phone,p_address:v.address,p_emergency_contact:v.emergency_contact}),'Profile updated',false)}/></section>
      </div>
    </>;
  }

  function settings(){
    return <>
      {heading('Workspace settings','Your company’s working rhythm.')}
      <section className="panel settings-form"><h2>Company & attendance policy</h2><Form busy={busy} initial={{...data.settings,weekend_days:data.settings.weekend_days.join(',')}} fields={[{name:'company_name',label:'Company name',required:true},{name:'timezone',label:'Timezone',required:true,options:opts(['Asia/Karachi','Asia/Dubai','Asia/Kolkata','Europe/London','America/New_York','UTC'])},{name:'work_start',label:'Workday starts',type:'time',required:true},{name:'work_end',label:'Workday ends',type:'time',required:true},{name:'grace_minutes',label:'Late arrival grace (minutes)',type:'number',min:0,max:120,required:true},{name:'weekend_days',label:'Weekly off days',required:true,options:[{value:'0,6',label:'Saturday & Sunday'},{value:'0',label:'Sunday'},{value:'5,6',label:'Friday & Saturday'},{value:'5',label:'Friday'},{value:'none',label:'No weekly off days'}]}]} onSubmit={v=>action(()=>store.rpc('save_settings',{p_settings:{...v,weekend_days:v.weekend_days==='none'?[]:String(v.weekend_days).split(',').map(Number)}}),'Settings saved',false)}/><p className="muted">This version uses one company calendar and same-day shifts. Calendar changes affect attendance labels; submitted leave keeps its recorded day count.</p></section>
      <section className="panel"><div className="panel-heading"><div><h2>Audit history</h2><p>Latest 100 recorded actions</p></div></div><div className="table-scroll"><table><thead><tr><th>ACTION</th><th>BY</th><th>RECORD</th><th>WHEN</th></tr></thead><tbody>{data.audit.slice(0,100).map(a=><tr key={a.id}><td>{a.action.replaceAll('_',' ')}</td><td>{person(a.actor_id)?.name||'System'}</td><td>{a.entity.replaceAll('_',' ')}</td><td>{new Date(a.created_at).toLocaleString('en-GB',{timeZone:data.settings.timezone})}</td></tr>)}</tbody></table></div>{!data.audit.length&&<Empty title="A clean slate" text="Changes and approvals will be recorded here."/>}</section>
    </>;
  }

  function modalContent(){
    if(!modal)return null;
    const row=modal.row||{};
    let fields:Field[]=[];
    let title='';
    let defaults:Record<string,unknown>={};
    const kind=modal.kind;
    if(['employees','customers','projects','allocations','holidays'].includes(kind)){
    if(kind==='employees'){
          title=row.id?'Edit employee':'Add employee';
          defaults={
            employee_code:`EMP-${String(data.employees.length+1).padStart(3,'0')}`,
            joined_on:today,
            employment_type:'Full-time',
            status:'active',
            role:'employee',
            annual_allowance:20,
            sick_allowance:10,
            casual_allowance:7,
            daily_hours:9,
            monthly_days:null
          };
          fields=[
            {name:'name',label:'Full name',required:true},
            {name:'employee_code',label:'Employee ID',required:true},
            {name:'email',label:'Google sign-in email',type:'email',required:true},
            {name:'phone',label:'Phone',type:'tel'},
            {name:'department',label:'Department',required:true},
            {name:'designation',label:'Designation',required:true},
            {name:'manager_id',label:'Reporting manager',options:employeeOptions.filter(e=>e.value!==row.id)},
            {name:'joined_on',label:'Joining date',type:'date',required:true},
            {name:'salary',label:'Monthly salary (PKR)',type:'number',min:0,max:9999999999.99,step:0.01,placeholder:'e.g. 100000'},
            {name:'employment_type',label:'Employment type',required:true,options:opts(['Full-time','Part-time','Contract','Intern'])},
            {name:'daily_hours',label:'Daily hours',type:'number',min:1,max:24,step:0.5,required:true,placeholder:'e.g. 9 full-time, 4 intern'},
            {name:'monthly_days',label:'Monthly working days (optional)',type:'number',min:1,max:31,placeholder:'Leave empty for all working days'},
            {name:'status',label:'Status',required:true,options:opts(['active','inactive'])},
            {name:'role',label:'Portal access',required:true,options:opts(['employee','admin'])},
            {name:'annual_allowance',label:'Annual leave / year',type:'number',min:0,max:366,required:true},
            {name:'sick_allowance',label:'Sick leave / year',type:'number',min:0,max:366,required:true},
            {name:'casual_allowance',label:'Casual leave / year',type:'number',min:0,max:366,required:true},
            {name:'address',label:'Address',type:'textarea',wide:true},
            {name:'emergency_contact',label:'Emergency contact',wide:true}
          ];
        }
      if(kind==='customers'){title=row.id?'Edit customer':'Add customer';defaults={status:'active'};fields=[{name:'name',label:'Company name',required:true},{name:'contact_name',label:'Contact person',required:true},{name:'email',label:'Email',type:'email',required:true},{name:'phone',label:'Phone',type:'tel'},{name:'status',label:'Status',required:true,options:opts(['active','inactive'])},{name:'address',label:'Address',type:'textarea',wide:true}];}
      if(kind==='projects'){title=row.id?'Edit project':'New project';defaults={start_date:today,end_date:addDays(today,30),status:'planned',priority:'medium',progress:0};fields=[{name:'name',label:'Project name',required:true,wide:true},{name:'customer_id',label:'Customer',required:true,options:data.customers.map(c=>({value:c.id,label:c.name}))},{name:'manager_id',label:'Project manager',options:employeeOptions},{name:'start_date',label:'Start date',type:'date',required:true},{name:'end_date',label:'End date',type:'date',required:true},{name:'status',label:'Status',required:true,options:opts(['planned','active','on_hold','completed','cancelled'])},{name:'priority',label:'Priority',required:true,options:opts(['low','medium','high'])},{name:'progress',label:'Progress (%)',type:'number',min:0,max:100,required:true},{name:'description',label:'Description',type:'textarea',wide:true}];}
      if(kind==='allocations'){title=row.id?'Edit allocation':'Allocate an employee';defaults={start_date:today,end_date:addDays(today,30),percentage:50};fields=[{name:'employee_id',label:'Employee',required:true,options:employeeOptions},{name:'project_id',label:'Project',required:true,options:data.projects.filter(p=>!['completed','cancelled'].includes(p.status)).map(p=>({value:p.id,label:p.name}))},{name:'role',label:'Project role',required:true},{name:'percentage',label:'Allocation (%)',required:true,type:'number',min:1,max:100},{name:'start_date',label:'From',type:'date',required:true},{name:'end_date',label:'Until',type:'date',required:true}];}
      if(kind==='holidays'){title=row.id?'Edit off day':'Add off day';defaults={date:today,kind:'company'};fields=[{name:'name',label:'Holiday name',required:true,wide:true},{name:'date',label:'Date',type:'date',required:true},{name:'kind',label:'Type',required:true,options:opts(['public','company'])}];}
      return <Modal title={title} onClose={()=>setModal(null)}>{error&&<div className="error" role="alert">{error}</div>}<Form fields={fields} initial={{...defaults,...row}} busy={busy} label={row.id?'Save changes':'Create record'} onSubmit={v=>{
  if(v.start_date&&v.end_date&&String(v.start_date)>String(v.end_date)){
    store.setError('End date must be on or after start date.');
    return;
  }
  if('manager_id'in v)v.manager_id=v.manager_id||null;
  
  // ✅ Employment type ke hisaab se daily_hours auto-set
  if(kind === 'employees' && 'employment_type' in v){
    const typeHours: Record<string, number> = {
      'Full-time': 9,
      'Part-time': 6,
      'Contract': 8,
      'Intern': 4,
    };
    // Sirf tab auto-set karo jab daily_hours khali ho
    if(!v.daily_hours) v.daily_hours = typeHours[String(v.employment_type)] || 9;
  }
  
  if('monthly_days'in v && (v.monthly_days === '' || v.monthly_days === undefined)){
    v.monthly_days = null;
  }
  if('daily_hours'in v && v.daily_hours){
    v.daily_hours = Number(v.daily_hours);
  }
  if(row.id)v.id=row.id;
  action(()=>store.save(kind as Entity,v),'Record saved');
}}/>{kind==='employees'&&<p className="form-hint">The employee must sign in with this exact Google email. Annual allowances reset by calendar year.</p>}{kind==='allocations'&&<p className="form-hint">Assignments cannot exceed 100% across overlapping dates. Review the employee’s leave and off days before assigning work.</p>}</Modal>;
    }
    if(kind==='leave')return <Modal title="Request leave" onClose={()=>setModal(null)}>{error&&<div className="error" role="alert">{error}</div>}<p className="modal-intro">Requesting leave for {me!.name}. Off days are excluded automatically.</p><Form busy={busy} label="Submit request" initial={{start_date:today,end_date:today,type:'annual'}} fields={[{name:'type',label:'Leave type',required:true,options:opts(['annual','sick','casual','unpaid'])},{name:'half_day',label:'Half-day leave',type:'checkbox'},{name:'start_date',label:'Start date',type:'date',required:true},{name:'end_date',label:'End date',type:'date',required:true},{name:'reason',label:'Reason',type:'textarea',required:true,wide:true}]} onSubmit={v=>action(()=>store.rpc('request_leave',{p_type:v.type,p_start:v.start_date,p_end:v.end_date,p_half_day:v.half_day,p_reason:v.reason}),'Leave request submitted')}/></Modal>;
    if(kind==='adjustment')return <Modal title="Request attendance adjustment" onClose={()=>setModal(null)}>{error&&<div className="error" role="alert">{error}</div>}<p className="modal-intro">Enter the correct times in {data.settings.timezone}. An admin will review your request.</p><Form busy={busy} label="Submit adjustment" initial={{date:row.date||today,check_in:'09:00',check_out:'18:00'}} fields={[{name:'date',label:'Attendance date',type:'date',max:today,required:true,wide:true},{name:'check_in',label:'Correct check-in',type:'time',required:true},{name:'check_out',label:'Correct check-out',type:'time'},{name:'reason',label:'Reason for the correction',type:'textarea',required:true,wide:true}]} onSubmit={v=>{const date=String(v.date);action(()=>store.rpc('request_adjustment',{p_date:date,p_in:localToISO(date,String(v.check_in),data.settings.timezone),p_out:v.check_out?localToISO(date,String(v.check_out),data.settings.timezone):null,p_reason:v.reason}),'Adjustment submitted for approval');}}/></Modal>;
    if(kind==='review'){const original=data.attendance.find(a=>a.employee_id===row.employee_id&&a.work_date===row.work_date);return <Modal title="Review request" onClose={()=>setModal(null)}>{error&&<div className="error" role="alert">{error}</div>}<div className="review-summary">{employeeCell(String(row.employee_id))}<p>{String(row.reason)}</p>{row.request_kind==='leave'?<p><strong className="capitalize">{String(row.type)}</strong> · {String(row.days)} day(s)<br/>{fmt(String(row.start_date))} — {fmt(String(row.end_date))}</p>:<><p><strong>{fmt(String(row.work_date))}</strong></p><p>Original: {timeLabel(original?.check_in||null,data.settings.timezone)} — {timeLabel(original?.check_out||null,data.settings.timezone)}</p><p>Requested: {timeLabel(String(row.requested_in),data.settings.timezone)} — {timeLabel(row.requested_out as string|null,data.settings.timezone)}</p></>}</div><Form busy={busy} label="Confirm decision" initial={{status:'approved'}} fields={[{name:'status',label:'Decision',required:true,options:opts(['approved','rejected']),wide:true},{name:'comment',label:'Review comment',type:'textarea',wide:true}]} onSubmit={v=>action(()=>store.rpc('review_request',{p_kind:row.request_kind,p_id:row.id,p_status:v.status,p_comment:v.comment}),'Decision recorded')}/></Modal>;}
    if(kind==='delete')return <Modal title="Remove record?" onClose={()=>setModal(null)}>{error&&<div className="error" role="alert">{error}</div>}<p className="modal-intro">Remove {String(row.name)}? This action cannot be undone.</p><div className="form-footer"><button className="button" onClick={()=>setModal(null)}>Keep record</button><button className="button danger" disabled={busy} onClick={()=>action(()=>store.remove(row.entity as Entity,String(row.id)),'Record removed')}>Remove</button></div></Modal>;
    if(kind==='day'){const d=String(row.date);const id=String(row.employee_id);const a=data.attendance.find(a=>a.employee_id===id&&a.work_date===d);return <Modal title={fmt(d)} onClose={()=>setModal(null)}><div className="review-summary">{employeeCell(id)}<p><Badge>{attendanceStatus(id,d,data)}</Badge></p><p>{offDay(d,data)}</p><p>Check in: <strong>{timeLabel(a?.check_in||null,data.settings.timezone)}</strong></p><p>Check out: <strong>{timeLabel(a?.check_out||null,data.settings.timezone)}</strong></p><p>Actual working hours: <strong>{durationLabel(workTotals(a,data.breaks,now).workedMs)}</strong></p><p>Break time: <strong>{durationLabel(workTotals(a,data.breaks,now).breakMs)}</strong></p><BreakHistory data={data} attendance={a} now={now}/></div>{id===me!.id&&d<=today&&<div className="form-footer"><button className="button primary" onClick={()=>setModal({kind:'adjustment',row:{date:d}})}>Request adjustment<ArrowUpRight size={16}/></button></div>}</Modal>;}
    return null;
  }

  const screens:Record<string,()=>React.ReactNode>={overview,employees,attendance,leaves:leavePage,'off-days':offDays,customers,projects,allocations,approvals:()=>approvals(false),adjustments:()=>approvals(true),profile,settings};
  const allowed=nav.some(n=>n[0]===section);

    return <div className="app-shell">{mobile&&<button className="sidebar-scrim" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}<aside className={'sidebar '+(mobile?'open':'')}><Link href={base} className="brand"><img src="/favicon.svg" alt="Hudasoft" className="brand-logo" />hudasoft<span className="brand-dot">.</span></Link><div className="workspace-label"><span className="workspace-icon">{data.settings.company_name.slice(0,1)}</span><div><strong>{data.settings.company_name}</strong><small>{isAdmin?'Admin workspace':'Employee workspace'}</small></div><ChevronDown size={15}/></div><span className="nav-label">WORKSPACE</span><nav>{nav.map(([slug,label,Icon])=><Link key={slug} href={base+'/'+slug} className={section===slug?'active':''}><Icon size={19}/><span>{label}</span>{slug==='approvals'&&pending>0&&<b>{pending}</b>}</Link>)}</nav><div className="sidebar-bottom">{me.role==='admin'&&<Link className="portal-switch" href={isAdmin?'/employee':'/admin'}><RefreshCw size={16}/>{isAdmin?'Employee view':'Admin workspace'}<ArrowUpRight size={15}/></Link>}<div className="sidebar-user"><Avatar name={me.name} small/><div><strong>{me.name}</strong><small>{me.role==='admin'?'Administrator':'Employee'}</small></div><button aria-label="Sign out" className="icon-button" onClick={()=>{try{localStorage.removeItem('hudasoft_cached_me');}catch{};action(store.signOut,'Signed out',false)}}><LogOut size={17}/></button></div></div></aside><div className="main-shell"><header className="topbar"><div><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={()=>setMobile(true)}><Menu size={23}/></button><span className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{nav.find(n=>n[0]===section)?.[1]||'Overview'}</strong></span></div><div className="topbar-right">{demo?<span className="demo-tag">Demo workspace</span>:<span className="connected"><ShieldCheck size={15}/>Secure workspace</span>}<span className="header-divider"/><Avatar name={me.name} small/><span className="header-name">{me.name.split(' ')[0]}</span></div></header>{demo&&<div className="demo-banner"><span>Sample data · Changes are saved only in this browser.</span><button onClick={()=>action(store.signOut,'Demo closed',false)}>Exit demo <ArrowRight size={13}/></button></div>}<main className="content">{error&&!modal&&<div className="error" role="alert">{error}<button aria-label="Dismiss error" className="icon-button" onClick={()=>store.setError('')}><X size={16}/></button></div>}{allowed?(screens[section]||overview)():<Empty title="Page not found" text="Choose a page from the navigation."/>}<footer className="page-footer"><span>hudasoft<span className="brand-dot">.</span></span><small>People first. Always.</small></footer></main></div>{modalContent()}{notice&&<div className="toast" role="status"><Check size={18}/>{notice}</div>}{mounted&&(loading||navigating)&&<div className="island-loader">
  
  <div className="island">
    <span className="island-mark">H</span>
    <span className="island-text">hudasoft</span>
    <span className="island-dots"><span/><span/><span/></span>
  </div>
</div>}</div>;
}