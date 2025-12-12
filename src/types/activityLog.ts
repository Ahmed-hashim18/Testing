export type ActivityModule = 
  | "dashboard"
  | "transactions"
  | "sales"
  | "purchases"
  | "products"
  | "chart_of_accounts"
  | "accounting"
  | "hr_payroll"
  | "system";

export type ActivityActionType = 
  | "create"
  | "update"
  | "delete"
  | "export"
  | "import"
  | "view"
  | "login"
  | "logout"
  | "status_change"
  | "bulk_action";

export interface ActivityLog {
  id: string;
  module: ActivityModule;
  actionType: ActivityActionType;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: Date;
  metadata?: {
    entityId?: string;
    entityType?: string;
    previousValue?: string;
    newValue?: string;
    ipAddress?: string;
    affectedRecords?: number;
  };
}
