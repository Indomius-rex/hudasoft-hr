'use client';
import {Data, Employee} from '@/lib/types';
import {dayKey, offDay, attendanceStatus, timeLabel} from '@/lib/domain';
import {workTotals, durationLabel} from '@/lib/breaks';
import {monthlyAttendance} from '@/lib/monthly-attendance';
import {Badge, Empty} from './ui';

type Props = {
  data: Data;
  employee: Employee;
  month: string;
  now: number;
};

export default function MonthlyGraph({data, employee, month, now}: Props) {
  const year = Number(month.slice(0, 4));
  const monthNum = Number(month.slice(5, 7));
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const today = dayKey(new Date(now), data.settings.timezone);

  // ✅ Monthly attendance use karo — same as summary table
  const monthly = monthlyAttendance(employee, month, data, now);
  const dailyHours = monthly.dailyHours;

  // Har din ka data nikaalo (graph bars ke liye)
  const days = Array.from({length: daysInMonth}, (_, i) => {
    const d = `${month}-${String(i + 1).padStart(2, '0')}`;
    const isOff = !!offDay(d, data);
    const status = attendanceStatus(employee.id, d, data);
    const a = data.attendance.find(a => a.employee_id === employee.id && a.work_date === d);
    const workedMs = a?.check_in ? workTotals(a, data.breaks, now).workedMs : 0;
    const workedHours = workedMs / 3600000;
    const violation = Math.max(0, dailyHours - workedHours);
    
    return {
      date: d,
      dayNum: i + 1,
      isOff,
      status,
      checkIn: a?.check_in || null,
      checkOut: a?.check_out || null,
      workedHours,
      violation: (isOff || status === 'On leave') ? 0 : violation,
      isLeave: status === 'On leave',
    };
  });

  // Stats calculate karo
  const presentDays = days.filter(d => !d.isOff && d.status === 'Present').length;
  const lateDays = days.filter(d => !d.isOff && d.status === 'Late').length;
  const absentDays = days.filter(d => !d.isOff && d.status === 'Absent').length;
  const leaveDays = days.filter(d => d.isLeave).length;
  const offDays = days.filter(d => d.isOff).length;
  const missingDays = days.filter(d => !d.isOff && d.status === 'Missing entry').length;

  // Chart ke liye max value
  const maxHours = Math.max(dailyHours, ...days.map(d => d.workedHours));
  const chartMax = Math.ceil(maxHours);

  return (
    <>
      {/* Stats Cards */}
      <div className="stats three" style={{marginBottom: '20px'}}>
        <div className="stat">
          <div className="stat-top"><span>Present</span><span className="stat-icon green">✓</span></div>
          <strong>{presentDays + lateDays}</strong>
          <small>{lateDays} late · {presentDays} on time</small>
        </div>
        <div className="stat">
          <div className="stat-top"><span>Absent</span><span className="stat-icon orange">!</span></div>
          <strong>{absentDays}</strong>
          <small>{missingDays} missing entries</small>
        </div>
        <div className="stat">
          <div className="stat-top"><span>Leave & Off</span><span className="stat-icon purple">🌴</span></div>
          <strong>{leaveDays + offDays}</strong>
          <small>{leaveDays} leave · {offDays} off days</small>
        </div>
      </div>

      {/* ✅ Total Summary — monthlyAttendance se (consistent) */}
      <section className="panel" style={{padding: '20px', marginBottom: '20px'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
          <div>
            <small style={{color: 'var(--muted)'}}>Total worked</small>
            <strong style={{display: 'block', fontSize: '24px'}}>{monthly.workedHours.toFixed(1)} h</strong>
            {monthly.missingEntries > 0 && (
              <small style={{color: 'var(--muted)'}}>{monthly.missingEntries} missing check-out(s) excluded</small>
            )}
          </div>
          <div>
            <small style={{color: 'var(--muted)'}}>Target hours</small>
            <strong style={{display: 'block', fontSize: '24px'}}>{monthly.totalHours} h</strong>
            <small style={{color: 'var(--muted)'}}>{monthly.targetDays} days × {monthly.dailyHours} h</small>
          </div>
          <div>
            <small style={{color: 'var(--muted)'}}>Total violations</small>
            <strong style={{display: 'block', fontSize: '24px', color: monthly.violationHours > 0 ? '#a86621' : '#258763'}}>
              {monthly.violationHours.toFixed(1)} h
            </strong>
          </div>
        </div>
      </section>

      {/* Bar Chart */}
      <section className="panel" style={{padding: '20px', marginBottom: '20px'}}>
        <h2 style={{marginBottom: '20px'}}>Daily hours — {new Date(month + '-01T12:00:00').toLocaleDateString('en-GB', {month: 'long', year: 'numeric'})}</h2>
        
        <div style={{display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px', padding: '10px 0', borderBottom: '2px solid var(--border)'}}>
          {days.map(d => {
            const height = d.isOff ? 0 : (d.workedHours / chartMax) * 100;
            const bg = d.isOff ? '#e5e7eb' : d.isLeave ? '#c4b5fd' : d.violation > 0 ? '#f59e0b' : '#3868ee';
            
            return (
              <div key={d.date} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '16px'}}>
                <div style={{width: '100%', height: '160px', display: 'flex', alignItems: 'flex-end', position: 'relative'}}>
                  <div
                    title={`${d.dayNum}: ${d.workedHours.toFixed(1)}h worked${d.violation > 0 ? ` · ${d.violation.toFixed(1)}h violation` : ''}`}
                    style={{
                      width: '100%',
                      height: `${Math.max(height, d.isOff ? 2 : 4)}%`,
                      background: bg,
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s',
                      minHeight: d.isOff ? '4px' : '8px',
                    }}
                  />
                </div>
                <span style={{fontSize: '9px', color: 'var(--muted)'}}>{d.dayNum}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{display: 'flex', gap: '16px', marginTop: '16px', fontSize: '11px', color: 'var(--muted)'}}>
          <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <span style={{width: '12px', height: '12px', background: '#3868ee', borderRadius: '3px'}}></span> Worked
          </span>
          <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <span style={{width: '12px', height: '12px', background: '#f59e0b', borderRadius: '3px'}}></span> Violation
          </span>
          <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <span style={{width: '12px', height: '12px', background: '#c4b5fd', borderRadius: '3px'}}></span> Leave
          </span>
          <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <span style={{width: '12px', height: '12px', background: '#e5e7eb', borderRadius: '3px'}}></span> Off day
          </span>
        </div>
      </section>

      {/* Details Table */}
      <section className="panel">
        <div className="panel-heading"><h2>Daily details</h2></div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>DAY</th>
                <th>STATUS</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
                <th>HOURS</th>
                <th>VIOLATION</th>
              </tr>
            </thead>
            <tbody>
              {days.map(d => (
                <tr key={d.date} style={{opacity: d.isOff ? 0.5 : 1}}>
                  <td>{new Date(d.date + 'T12:00:00').toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</td>
                  <td>{new Date(d.date + 'T12:00:00').toLocaleDateString('en-GB', {weekday: 'short'})}</td>
                  <td><Badge>{d.isOff ? 'Off day' : d.status}</Badge></td>
                  <td>{d.checkIn ? timeLabel(d.checkIn, data.settings.timezone) : '—'}</td>
                  <td>{d.checkOut ? timeLabel(d.checkOut, data.settings.timezone) : '—'}</td>
                  <td>{d.workedHours > 0 ? d.workedHours.toFixed(2) + ' h' : '—'}</td>
                  <td>
                    {d.violation > 0
                      ? <span style={{color: '#a86621', fontWeight: 600}}>{d.violation.toFixed(2)} h</span>
                      : d.isOff ? '—' : <span style={{color: '#258763'}}>✓</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}