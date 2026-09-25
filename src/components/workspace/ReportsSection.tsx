import React from 'react';
import { Business } from '../../types.ts';

interface ReportsSectionProps {
  business: Business;
}

export const ReportsSection: React.FC<ReportsSectionProps> = () => {
  return (
    <div className="w-full min-h-[500px]" id="reports-section-empty">
      {/* Clean empty page as requested */}
    </div>
  );
};
