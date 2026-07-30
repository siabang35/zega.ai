import React from 'react';
import { UmkmDashboard } from '../umkm/UmkmDashboard';

interface UmkmDashboardViewProps {
  activeTab?: string;
  userName?: string;
  isGuest?: boolean;
  onNavigateTab?: (tab: string) => void;
}

export function UmkmDashboardView({ activeTab, userName, isGuest, onNavigateTab }: UmkmDashboardViewProps) {
  return (
    <UmkmDashboard
      activeTab={activeTab}
      userName={userName}
      isGuest={isGuest}
      onNavigateTab={onNavigateTab}
    />
  );
}
