import {Attendance,WorkBreak} from './types';
/** Merge/clamp intervals defensively: corrupt overlapping intervals must not subtract twice. */
export function workTotals(attendance:Attendance|undefined,breaks:WorkBreak[],now=Date.now()) {
 if(!attendance?.check_in)return {workedMs:0,breakMs:0,elapsedMs:0};
 const start=Date.parse(attendance.check_in),end=attendance.check_out?Date.parse(attendance.check_out):now;
 const elapsedMs=Math.max(0,end-start);
 const intervals=breaks.filter(b=>b.attendance_id===attendance.id).map(b=>[Math.max(start,Date.parse(b.started_at)),Math.min(end,b.ended_at?Date.parse(b.ended_at):end)]).filter(([s,e])=>e>s).sort((a,b)=>a[0]-b[0]);
 let breakMs=0,lastEnd=start;
 for(const [s,e] of intervals){breakMs+=Math.max(0,e-Math.max(s,lastEnd));lastEnd=Math.max(lastEnd,e);}
 return {workedMs:Math.max(0,elapsedMs-breakMs),breakMs,elapsedMs};
}
export function durationLabel(ms:number){const total=Math.floor(Math.max(0,ms)/1000);return `${Math.floor(total/3600)}h ${String(Math.floor(total/60)%60).padStart(2,'0')}m ${String(total%60).padStart(2,'0')}s`;}
export function assertBreakTransition(action:string,attendance:Attendance|undefined,breaks:WorkBreak[]){
 if(action!=='start'&&action!=='end')throw new Error('Invalid break action.');
 if(!attendance?.check_in||attendance.check_out)throw new Error('Check in before taking a break. Your workday must still be open.');
 const active=breaks.find(b=>b.attendance_id===attendance.id&&!b.ended_at);
 if(action==='start'&&active)throw new Error('You are already on a break. End it before starting another.');
 if(action==='end'&&!active)throw new Error('There is no active break to end.');
 return active;
}
export function assertBreaksFit(attendance:Attendance,breaks:WorkBreak[]){
 const rows=breaks.filter(b=>b.attendance_id===attendance.id);
 if(rows.some(b=>!b.ended_at)&&attendance.check_out)throw new Error('End your active break before checking out.');
 if(rows.some(b=>!attendance.check_in||Date.parse(b.started_at)<Date.parse(attendance.check_in)||attendance.check_out&&Date.parse(b.ended_at||b.started_at)>Date.parse(attendance.check_out)))throw new Error('Attendance times must include every recorded break.');
}
