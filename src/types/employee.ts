export type EmploymentStatus = "active" | "on_leave" | "terminated" | "probation";
export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Employment Details
  departmentId: string;
  position: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  terminationDate?: string;
  reportingTo?: string;
  
  // Compensation
  baseSalary: number;
  currency: string;
  paymentFrequency: "monthly" | "bi-weekly" | "weekly";
  
  // Documents & Notes
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes?: string;
  profileImage?: string;
  
  createdAt: string;
  updatedAt: string;
}
