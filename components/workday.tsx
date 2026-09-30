'use client';
import {ArrowRight,Clock3,Coffee,Play,Timer} from 'lucide-react';
import {Data,Employee,Attendance} from '@/lib/types';
import {dayKey,offDay,timeLabel} from '@/lib/domain';
import {workTotals,durationLabel} from '@/lib/breaks';
import {Badge} from './ui';
type Props={data:Data;employee:Employee;now:number;busy:boolean;onAction:(name:string,args:Record<string,unknown>,message:string)=>void};
export function BreakHistory({data,attendance,now}:{data:Data;attendance:Attendance|undefined;now:number}){
 const rows=data.breaks.filter(b=>b.attendance_id===attendance?.id).sort((a,b)=>a.started_at.localeCompare(b.started_at));
 return <div className="break-history"><div className="break-history-heading"><h3>Breaks taken</h3><span>{rows.length} {rows.length===1?'break':'breaks'}</span></div>{rows.length?<ol>{rows.map((b,i)=><li key={b.id}><span className="break-number">{i+1}</span><div><strong>{timeLabel(b.started_at,data.settings.timezone)} — {b.ended_at?timeLabel(b.ended_at,data.settings.timezone):'In progress'}</strong><small>{durationLabel(Math.max(0,(b.ended_at?Date.parse(b.ended_at):now)-Date.parse(b.started_at)))}</small></div>{!b.ended_at&&<Badge>On break</Badge>}</li>)}</ol>:<p className="muted">No breaks taken yet.</p>}</div>;
}
export default function Workday({data,employee,now,busy,onAction}:Props){
 const today=dayKey(new Date(now),data.settings.timezone);
 const active=data.breaks.find(b=>b.employee_id===employee.id&&!b.ended_at);
 const todayRecord=data.attendance.find(a=>a.employee_id===employee.id&&a.work_date===today);
 const attendance=active?data.attendance.find(a=>a.id===active.attendance_id):todayRecord;
 const previousDay=attendance&&attendance.work_date!==today;
 const totals=workTotals(attendance,data.breaks,now);
 return <section className="panel clock-panel"><div className="panel-heading"><div><h2>Your workday</h2><p>{previousDay?`Open break from ${attendance.work_date}`:offDay(today,data)||'Ready when you are'}</p></div>{active?<Badge>On break</Badge>:<Timer size={24}/>}</div><div className="clock-times"><div><small>CHECK IN</small><strong>{timeLabel(attendance?.check_in||null,data.settings.timezone)}</strong></div><ArrowRight size={24}/><div><small>CHECK OUT</small><strong>{timeLabel(attendance?.check_out||null,data.settings.timezone)}</strong></div></div><div className="workday-totals"><div><span>{attendance?.check_out?'Actual hours worked':'Worked so far'}</span><strong>{durationLabel(totals.workedMs)}</strong><small>{active?'Paused while you’re on break':'All break time excluded'}</small></div><div><span>Total break time</span><strong>{durationLabel(totals.breakMs)}</strong><small>{active?'Current break included':'Across all breaks'}</small></div></div><div className="workday-actions">
   <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
  <button className="button primary" disabled={busy||!!active||!!todayRecord?.check_out} onClick={()=>onAction('clock_attendance',{p_action:todayRecord?.check_in?'out':'in'},todayRecord?.check_in?'You’re checked out. Have a good evening!':'You’re checked in. Have a great day!')}><Clock3 size={18}/>{todayRecord?.check_out?'Workday complete':todayRecord?.check_in?'Check out':'Check in'}</button>
  {todayRecord?.check_out&&(
    <button className="button" disabled={busy} onClick={()=>onAction('reopen_workday',{},'Workday reopened. You can continue working.')}>
      <Play size={18}/>
      Re-open workday
    </button>
  )}
</div><button className="button" disabled={busy||(!active&&(!todayRecord?.check_in||!!todayRecord.check_out))} onClick={()=>onAction('manage_break',{p_action:active?'end':'start'},active?'Break ended. Your work timer has resumed.':'Break started. Your work timer is paused.')}>{active?<Play size={18}/>:<Coffee size={18}/ >}{active?'End break':'Start break'}</button></div>{active&&<p className="workday-hint">End your break before checking out or signing out.</p>}{!attendance?.check_in&&<p className="workday-hint">Check in first to start a break.</p>}<BreakHistory data={data} attendance={attendance} now={now}/><p className="muted">Times are recorded in {data.settings.timezone}.</p></section>;
}
