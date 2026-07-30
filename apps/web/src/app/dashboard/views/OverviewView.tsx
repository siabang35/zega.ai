import React from 'react';
import { ZegaOrchestratorView } from './ZegaOrchestratorView';

export function OverviewView({ 
  onNavigateToSandbox, 
  isGuest = true, 
  userName = 'PT Zenith Enterprise', 
  userEmail = 'wildan@zenith.ai' 
}: { 
  onNavigateToSandbox: () => void; 
  isGuest?: boolean; 
  userName?: string; 
  userEmail?: string; 
}) {
  return (
    <div className="animate-fadeIn">
      <ZegaOrchestratorView 
        onNavigateToSandbox={onNavigateToSandbox} 
        isGuest={isGuest} 
        userName={userName} 
        userEmail={userEmail} 
      />
    </div>
  );
}
