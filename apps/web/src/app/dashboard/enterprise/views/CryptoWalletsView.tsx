'use client';

import React from 'react';
import { PrivyWalletDashboard } from '../../../components/wallet/PrivyWalletDashboard.js';

interface CryptoWalletsViewProps {
  onTriggerToast: (msg: string) => void;
}

export function CryptoWalletsView({ onTriggerToast }: CryptoWalletsViewProps) {
  return (
    <div className="space-y-6">
      <PrivyWalletDashboard onToast={onTriggerToast} />
    </div>
  );
}
