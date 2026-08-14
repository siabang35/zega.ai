import React from 'react';
import { ZeroClawTerminalView } from '../../enterprise/views/ZeroClawTerminalView';

interface UmkmZeroClawTerminalViewProps {
  onTriggerToast: (msg: string) => void;
  isGuest?: boolean;
  userEmail?: string;
  userName?: string;
}

export function UmkmZeroClawTerminalView({
  onTriggerToast,
  isGuest = false,
  userEmail,
  userName,
}: UmkmZeroClawTerminalViewProps) {
  return (
    <ZeroClawTerminalView
      onTriggerToast={onTriggerToast}
      isGuest={isGuest}
      userEmail={userEmail}
      userName={userName}
      userRole="individual"
    />
  );
}
