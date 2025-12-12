import { z } from "zod";

const phoneRegex = /^[\d\s\-\+\(\)]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const employeeSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must not exceed 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must not exceed 50 characters"),
  email: z.string().regex(emailRegex, "Please enter a valid email address"),
  phone: z.string().regex(phoneRegex, "Please enter a valid phone number"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  departmentId: z.string().min(1, "Department is required"),
  position: z.string().min(2, "Position must be at least 2 characters").max(100, "Position must not exceed 100 characters"),
  employeeType: z.enum(["full-time", "part-time", "contract", "intern"]),
  salary: z.number().positive("Salary must be greater than zero").max(99999999, "Salary is too large"),
  status: z.enum(["active", "on-leave", "terminated"]).default("active"),
  address: z.string().max(500, "Address must not exceed 500 characters").optional(),
  emergencyContact: z.string().max(200, "Emergency contact must not exceed 200 characters").optional(),
  emergencyPhone: z.string().regex(phoneRegex, "Please enter a valid emergency phone number").optional(),
}).refine((data) => {
  // Validate that hire date is not in the future
  return new Date(data.hireDate) <= new Date();
}, {
  message: "Hire date cannot be in the future",
  path: ["hireDate"],
}).refine((data) => {
  // Validate that employee is at least 16 years old
  const birthDate = new Date(data.dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  return age >= 16;
}, {
  message: "Employee must be at least 16 years old",
  path: ["dateOfBirth"],
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
