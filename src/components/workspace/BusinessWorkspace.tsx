import React from 'react';
import { Business, SalesOrder, PurchaseOrder } from '../../types.ts';
import { ProductsSection } from './ProductsSection.tsx';
import { CustomersSection } from './CustomersSection.tsx';
import { SuppliersSection } from './SuppliersSection.tsx';
import { BankingSection } from './BankingSection.tsx';
import { InvoicesSection } from './InvoicesSection.tsx';
import { ReceiptsSection } from './ReceiptsSection.tsx';
import { BillsSection } from './BillsSection.tsx';
import { PaymentsSection } from './PaymentsSection.tsx';
import { ReportsSection } from './ReportsSection.tsx';
import { SalesOrdersSection } from './SalesOrdersSection.tsx';
import { PurchaseOrdersSection } from './PurchaseOrdersSection.tsx';
import { StockTransfersSection } from './StockTransfersSection.tsx';
import { StockAdjustmentsSection } from './StockAdjustmentsSection.tsx';
import { OtherPaymentsSection } from './OtherPaymentsSection.tsx';
import { OtherReceiptsSection } from './OtherReceiptsSection.tsx';
import { BankTransfersSection } from './BankTransfersSection.tsx';
import { WarehousesSection } from './WarehousesSection.tsx';
import { HRManagementSection } from './HRManagementSection.tsx';
import { ExecutiveDashboard } from '../dashboard/ExecutiveDashboard.tsx';

interface BusinessWorkspaceProps {
  business: Business;
  userBusinesses: Business[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onBackToDashboard: () => void;
  quickAction?: { action: string; timestamp: number } | null;
}

export const BusinessWorkspace: React.FC<BusinessWorkspaceProps> = ({
  business,
  userBusinesses,
  activeTab,
  onSelectTab,
  onBackToDashboard,
  quickAction,
}) => {
  return (
    <div className="w-full">
      {activeTab === 'dashboard' && (
        <ExecutiveDashboard
          business={business}
          userBusinesses={userBusinesses}
          onNavigate={onSelectTab}
        />
      )}
      {activeTab === 'sales_orders' && (
        <SalesOrdersSection
          business={business}
          onNavigateToInvoice={() => onSelectTab('invoices')}
          autoOpenCreate={quickAction?.action === 'new_sales_order' ? quickAction.timestamp : undefined}
        />
      )}
      {activeTab === 'invoices' && (
        <InvoicesSection
          business={business}
          autoOpenCreate={quickAction?.action === 'new_sales_invoice' ? quickAction.timestamp : undefined}
        />
      )}
      {activeTab === 'receipts' && (
        <ReceiptsSection
          business={business}
          autoOpenCreate={quickAction?.action === 'new_sales_receipt' ? quickAction.timestamp : undefined}
        />
      )}
      {activeTab === 'purchase_orders' && (
        <PurchaseOrdersSection
          business={business}
          onNavigateToBill={() => onSelectTab('bills')}
          autoOpenCreate={quickAction?.action === 'new_purchase_order' ? quickAction.timestamp : undefined}
        />
      )}
      {activeTab === 'bills' && (
        <BillsSection
          business={business}
          autoOpenCreate={quickAction?.action === 'new_purchase_bill' ? quickAction.timestamp : undefined}
        />
      )}
      {activeTab === 'payments' && (
        <PaymentsSection
          business={business}
          autoOpenCreate={quickAction?.action === 'new_purchase_payment' ? quickAction.timestamp : undefined}
        />
      )}
      {activeTab === 'hr_management' && (
        <HRManagementSection business={business} />
      )}
      {activeTab === 'products' && (
        <ProductsSection business={business} initialShowCategoryModal={false} />
      )}
      {activeTab === 'categories' && (
        <ProductsSection business={business} initialShowCategoryModal={true} />
      )}
      {activeTab === 'warehouses' && (
        <WarehousesSection
          business={business}
          onNavigateToTransfers={() => onSelectTab('stock_transfers')}
        />
      )}
      {activeTab === 'stock_transfers' && (
        <StockTransfersSection
          business={business}
          onNavigateToWarehouses={() => onSelectTab('warehouses')}
        />
      )}
      {activeTab === 'stock_adjustments' && (
        <StockAdjustmentsSection business={business} />
      )}
      {activeTab === 'customers' && <CustomersSection business={business} />}
      {activeTab === 'suppliers' && <SuppliersSection business={business} />}
      {activeTab === 'banking' && (
        <BankingSection business={business} userBusinesses={userBusinesses} />
      )}
      {activeTab === 'other_payments' && (
        <OtherPaymentsSection
          business={business}
          autoOpenCreate={quickAction?.action === 'new_other_payment' ? quickAction.timestamp : undefined}
        />
      )}
      {activeTab === 'other_receipts' && (
        <OtherReceiptsSection
          business={business}
          autoOpenCreate={quickAction?.action === 'new_other_receipt' ? quickAction.timestamp : undefined}
        />
      )}
      {activeTab === 'bank_transfers' && (
        <BankTransfersSection
          business={business}
          autoOpenCreate={quickAction?.action === 'new_bank_transfer' ? quickAction.timestamp : undefined}
        />
      )}
      {activeTab === 'reports' && <ReportsSection business={business} />}
    </div>
  );
};
