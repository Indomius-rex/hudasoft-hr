import {Data, Employee} from './types';
import {dayKey, offDay, attendanceStatus} from './domain';
import {workTotals} from './breaks';

export function monthlyAttendance(employee: Employee, month: string, data: Data, now: number) {
  const dailyHours = employee.daily_hours ?? 9;
  const monthlyDays = employee.monthly_days;   // null = sab working days
  
  const year = Number(month.slice(0, 4));
  const monthNum = Number(month.slice(5, 7));
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  
  let workingDays = 0;
  let totalHours = 0;
  let workedMs = 0;
  let missingEntries = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const d = `${month}-${String(i).padStart(2, '0')}`;
    
    // Off day skip karo
    if (offDay(d, data)) continue;
    
    // Joining date se pehle skip karo
    if (d < employee.joined_on) continue;
    
    const status = attendanceStatus(employee.id, d, data);
    
    // Leave wale din skip karo
    if (status === 'On leave') continue;
    
    workingDays++;
    
    const a = data.attendance.find(a => a.employee_id === employee.id && a.work_date === d);
    if (a?.check_in) {
  // ✅ Sirf tab count karo jab check_out ho
        if (a.check_out) {
            workedMs += workTotals(a, data.breaks, now).workedMs;
        } else {
            // Check-out nahi hai — aaj ka din hai to count karo
            const today = dayKey(new Date(now), data.settings.timezone);
            if (d === today) {
            // Aaj ka din — abhi tak ka time count karo
            workedMs += workTotals(a, data.breaks, now).workedMs;
            } else {
            // Purana din aur check_out nahi — skip karo, sirf flag lagao
            missingEntries++;
            }
        }
        }
  }

  // ✅ Target calculation — monthly_days use karo agar set ho
  const targetDays = monthlyDays ?? workingDays;
  totalHours = targetDays * dailyHours;

  const workedHours = workedMs / 3600000;
  const violationHours = Math.max(0, totalHours - workedHours);

  return {
    workingDays,
    targetDays,        // ← naya: kitne din ka target
    dailyHours,        // ← naya: rozana kitne ghante
    totalHours,
    workedHours,
    violationHours,
    missingEntries,
  };
}