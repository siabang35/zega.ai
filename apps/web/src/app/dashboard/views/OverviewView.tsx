import React from 'react';
import { ZegaOrchestratorView } from './ZegaOrchestratorView';

export function OverviewView({ 
  onNavigateToSandbox, 
  isGuest = false, 
  userName = '', 
  userEmail = '' 
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
        isGuest={false} 
        userName={userName} 
        userEmail={userEmail} 
      />
    </div>
  );
}
