import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, DollarSign, Scale, BookOpen, FileEdit, BarChart3 } from "lucide-react";
import ProfitLossStatement from "@/components/accounting/ProfitLossStatement";
import BalanceSheet from "@/components/accounting/BalanceSheet";
import CashFlowStatement from "@/components/accounting/CashFlowStatement";
import TrialBalance from "@/components/accounting/TrialBalance";
import GeneralLedger from "@/components/accounting/GeneralLedger";
import JournalEntries from "@/components/accounting/JournalEntries";
import AccountingAnalytics from "@/components/accounting/AccountingAnalytics";

export default function Accounting() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounting</h1>
        <p className="text-muted-foreground mt-2">Financial reports and accounting management</p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="profit-loss" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            P&L
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cash Flow
          </TabsTrigger>
          <TabsTrigger value="trial-balance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Trial Balance
          </TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Ledger
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <FileEdit className="h-4 w-4" />
            Journal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AccountingAnalytics />
        </TabsContent>

        <TabsContent value="profit-loss">
          <ProfitLossStatement />
        </TabsContent>

        <TabsContent value="balance-sheet">
          <BalanceSheet />
        </TabsContent>

        <TabsContent value="cash-flow">
          <CashFlowStatement />
        </TabsContent>

        <TabsContent value="trial-balance">
          <TrialBalance />
        </TabsContent>

        <TabsContent value="ledger">
          <GeneralLedger />
        </TabsContent>

        <TabsContent value="journal">
          <JournalEntries />
        </TabsContent>
      </Tabs>
    </div>
  );
}
