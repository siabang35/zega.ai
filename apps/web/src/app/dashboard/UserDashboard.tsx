import React from 'react';
import { UmkmDashboardContainer } from './umkm/UmkmDashboardContainer';
import { EnterpriseDashboardView } from './enterprise/EnterpriseDashboard';

interface UserDashboardProps {
  onClose: () => void;
  dark: boolean;
  setDark: (val: boolean) => void;
  userRole?: 'individual' | 'enterprise' | 'superadmin';
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  isGuest?: boolean;
  onSwitchToAdminMode?: () => void;
}

export function UserDashboard({
  onClose,
  dark,
  setDark,
  userRole = 'individual',
  userEmail = '',
  userName = '',
  userAvatar = '',
}: UserDashboardProps) {
  if (userRole === 'enterprise') {
    return (
      <EnterpriseDashboardView
        onClose={onClose}
        dark={dark}
        setDark={setDark}
        userEmail={userEmail}
        userName={userName}
        userAvatar={userAvatar}
      />
    );
  }

  return (
    <UmkmDashboardContainer
      onClose={onClose}
      dark={dark}
      setDark={setDark}
      userEmail={userEmail}
      userName={userName}
      userAvatar={userAvatar}
    />
  );
}
