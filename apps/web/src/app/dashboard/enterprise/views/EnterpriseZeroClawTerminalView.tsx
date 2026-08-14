import React from 'react';
import { ZeroClawTerminalView } from './ZeroClawTerminalView';

interface EnterpriseZeroClawTerminalViewProps {
  onTriggerToast: (msg: string) => void;
  isGuest?: boolean;
  userEmail?: string;
  userName?: string;
}

export function EnterpriseZeroClawTerminalView({
  onTriggerToast,
  isGuest = false,
  userEmail,
  userName,
}: EnterpriseZeroClawTerminalViewProps) {
  return (
    <ZeroClawTerminalView
      onTriggerToast={onTriggerToast}
      isGuest={isGuest}
      userEmail={userEmail}
      userName={userName}
      userRole="enterprise"
    />
  );
}
