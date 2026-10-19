import { Employee, Data } from './types';
import { monthlyAttendance } from './monthly-attendance';

export function calculateSalary(employee: Employee, month: string, data: Data, now: number) {
  // 1. Salary breakdown
  const basic = employee.basic_salary || 0;
  const hra = employee.house_rent_allowance || 0;
  const other = employee.other_allowances || 0;
  const totalGross = basic + hra + other;

  // 2. Violations calculate karo (monthly attendance se)
  const attendance = monthlyAttendance(employee, month, data, now);
  const violationHours = attendance.violationHours;
  
  // 3. Violation deduction (Settings se rate lo)
  const violationRate = data.settings.violation_hourly_rate || 500;
  const deduction = violationHours * violationRate;

  // 4. Net Salary
  const netSalary = Math.max(0, totalGross - deduction);

  return {
    basic,
    hra,
    other,
    totalGross,
    violationHours,
    deduction,
    netSalary,
  };
}