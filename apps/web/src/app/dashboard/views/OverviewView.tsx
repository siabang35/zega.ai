import React from 'react';
import { ZegaOrchestratorView } from './ZegaOrchestratorView';

export function OverviewView({ onNavigateToSandbox }: { onNavigateToSandbox: () => void }) {
  return (
    <div className="animate-fadeIn">
      <ZegaOrchestratorView onNavigateToSandbox={onNavigateToSandbox} />
    </div>
  );
}
