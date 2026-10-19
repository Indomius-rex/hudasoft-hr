export type Employee = {
  id: string;
  user_id?: string | null;
  employee_code: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  manager_id: string | null;
  joined_on: string;
  employment_type: string;
  daily_hours: number | null;
  monthly_days: number | null;
  accrued_leaves: number;
  last_accrual_date: string | null;
  status: string;
  role: 'admin' | 'employee';

  address: string;
  emergency_contact: string;
  salary: number | null;  // Isko rehne do, ya hata do
  basic_salary: number;           // ← naya
  house_rent_allowance: number;   // ← naya
  other_allowances: number;       // ← naya
};
export type Attendance = {id:string;employee_id:string;work_date:string;check_in:string|null;check_out:string|null};
export type Leave = {id:string;employee_id:string;type:string;start_date:string;end_date:string;half_day:boolean;days:number;reason:string;status:string;review_comment:string;created_at:string};
export type WorkBreak = {id:string;attendance_id:string;employee_id:string;started_at:string;ended_at:string|null};
export type Adjustment = {id:string;employee_id:string;work_date:string;requested_in:string;requested_out:string|null;reason:string;status:string;review_comment:string;created_at:string};
export type Holiday = {id:string;name:string;date:string;kind:string};
export type Customer = {id:string;name:string;contact_name:string;email:string;phone:string;address:string;status:string};
export type Project = {id:string;customer_id:string;name:string;description:string;manager_id:string|null;start_date:string;end_date:string;status:string;priority:string;progress:number};
export type Allocation = {id:string;employee_id:string;project_id:string;role:string;percentage:number;start_date:string;end_date:string};
export type Settings = {id:number;company_name:string;timezone:string;weekend_days:number[];work_start:string;work_end:string;grace_minutes:number;accrual_rate:number;accrual_cap:number; office_ips: string[],violation_hourly_rate: number;};
export type Audit = {id:string;actor_id:string|null;action:string;entity:string;record_id:string;created_at:string;details:unknown};
export type Data = {employees:Employee[];attendance:Attendance[];breaks:WorkBreak[];leaves:Leave[];adjustments:Adjustment[];holidays:Holiday[];customers:Customer[];projects:Project[];allocations:Allocation[];settings:Settings;audit:Audit[]};
export type Entity = 'employees'|'customers'|'projects'|'allocations'|'holidays';
export const emptyData:Data = {employees:[],attendance:[],breaks:[],leaves:[],adjustments:[],holidays:[],customers:[],projects:[],allocations:[],audit:[],settings:{id:1,company_name:'Hudasoft',timezone:'Asia/Karachi',office_ips: [], weekend_days:[0,6],work_start:'09:00',work_end:'18:00',grace_minutes:15,violation_hourly_rate: 500,accrual_rate:1.5,accrual_cap:20}};
