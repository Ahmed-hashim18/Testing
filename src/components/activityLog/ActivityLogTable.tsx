import { ActivityLog } from "@/types/activityLog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  LogIn,
  LogOut,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";

interface ActivityLogTableProps {
  logs: ActivityLog[];
}

const getActionIcon = (actionType: string) => {
  const iconProps = { className: "h-4 w-4" };
  switch (actionType) {
    case "create":
      return <Plus {...iconProps} />;
    case "update":
      return <Edit {...iconProps} />;
    case "delete":
      return <Trash2 {...iconProps} />;
    case "view":
      return <Eye {...iconProps} />;
    case "export":
      return <Download {...iconProps} />;
    case "import":
      return <Upload {...iconProps} />;
    case "login":
      return <LogIn {...iconProps} />;
    case "logout":
      return <LogOut {...iconProps} />;
    case "status_change":
      return <RefreshCw {...iconProps} />;
    case "bulk_action":
      return <MoreHorizontal {...iconProps} />;
    default:
      return <Eye {...iconProps} />;
  }
};

const getActionBadgeVariant = (actionType: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (actionType) {
    case "create":
      return "default";
    case "update":
      return "secondary";
    case "delete":
      return "destructive";
    case "login":
    case "logout":
      return "outline";
    default:
      return "secondary";
  }
};

const getModuleBadgeColor = (module: string) => {
  const colors: Record<string, string> = {
    dashboard: "bg-chart-1 text-white",
    transactions: "bg-chart-2 text-white",
    sales: "bg-success text-success-foreground",
    purchases: "bg-chart-4 text-white",
    products: "bg-chart-5 text-white",
    chart_of_accounts: "bg-primary text-primary-foreground",
    accounting: "bg-chart-3 text-white",
    hr_payroll: "bg-secondary text-secondary-foreground",
    system: "bg-muted text-muted-foreground",
  };
  return colors[module] || "bg-muted text-muted-foreground";
};

export function ActivityLogTable({ logs }: ActivityLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Eye className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No activities found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(log.timestamp, { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Badge className={getModuleBadgeColor(log.module)}>
                  {log.module.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getActionBadgeVariant(log.actionType)} className="gap-1">
                  {getActionIcon(log.actionType)}
                  {log.actionType.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md">
                <p className="text-sm">{log.description}</p>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{log.userName}</span>
                  <span className="text-xs text-muted-foreground">{log.userEmail}</span>
                </div>
              </TableCell>
              <TableCell>
                {log.metadata && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {log.metadata.entityId && (
                      <div>ID: {log.metadata.entityId}</div>
                    )}
                    {log.metadata.affectedRecords && (
                      <div>Records: {log.metadata.affectedRecords}</div>
                    )}
                    {log.metadata.ipAddress && (
                      <div>IP: {log.metadata.ipAddress}</div>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
