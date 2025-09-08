// Planet view - main trading interface with real game integration
import React, { useState } from 'react';
import { getUiFields } from '@game-ui';
import type { State } from '@game-types';
import type { ScreenType } from '../types.ts';

interface PlanetViewProps {
  state: State;
  onAction?: (action: any) => Promise<any>;
  onNavigate?: (screen: ScreenType) => void;
}

export function PlanetView({ state, onAction, onNavigate }: PlanetViewProps) {
  const uiFields = getUiFields(state);
  const [newsContent, setNewsContent] = useState<string>('');
  const [showNews, setShowNews] = useState<boolean>(false);
  
  // Calculate newspaper cost
  const newsCost = 1 + state.difficulty;
  const canAffordNews = state.credits >= newsCost;
  const alreadyPaid = state.alreadyPaidForNewspaper;
  
  const handleReadNews = async () => {
    if (!onAction) return;
    
    try {
      const result = await onAction({
        type: 'read_news',
        parameters: {}
      });
      
      if (result.success) {
        setNewsContent(result.message || 'No news available.');
        setShowNews(true);
      } else {
        alert(result.message || 'Failed to read news.');
      }
    } catch (error) {
      console.error('Failed to read news:', error);
      alert('Error reading news.');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* System Information */}
      <div className="space-panel">
        <h2 className="retro-title text-lg mb-3">SYSTEM STATUS</h2>
        <div className="space-y-2">
          <div className="text-neon-cyan font-bold">{uiFields.location?.systemName}</div>
          <div className="text-sm">The system is {uiFields.location?.statusMessage}</div>
          {uiFields.location?.marketConditions.map((condition, index) => (
            <div key={index} className="text-xs text-palm-gray">• {condition}</div>
          ))}
          {uiFields.flavor.map((text, index) => (
            <div key={index} className="text-xs text-neon-amber italic">• {text}</div>
          ))}
        </div>
      </div>
      
      {/* Ship Status */}
      <div className="space-panel">
        <h2 className="retro-title text-lg mb-3">SHIP STATUS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm">{uiFields.ship?.repairStatus}</div>
            <div className="text-sm">{uiFields.ship?.fuelStatus}</div>
            <div className="text-sm">{uiFields.ship?.cargoStatus}</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-palm-gray">Equipment:</div>
            {uiFields.ship?.equipmentStatus.map((equipment, index) => (
              <div key={index} className="text-xs text-neon-green">• {equipment}</div>
            ))}
          </div>
        </div>
        
        {uiFields.ship?.warnings.map((warning, index) => (
          <div key={index} className="text-neon-red text-sm mt-2">⚠ {warning}</div>
        ))}
      </div>
      
      {/* Financial Status */}
      <div className="space-panel">
        <h2 className="retro-title text-lg mb-3">FINANCIAL STATUS</h2>
        <div className="space-y-2">
          <div className="text-xl font-bold text-neon-green">{uiFields.financial?.creditStatus}</div>
          {uiFields.financial?.purchaseRequirements.map((req, index) => (
            <div key={index} className="text-xs text-neon-amber">• {req}</div>
          ))}
        </div>
      </div>
      
      {/* News Stand */}
      <div className="space-panel">
        <h2 className="retro-title text-lg mb-3">LOCAL NEWS STAND</h2>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-palm-gray">
            {alreadyPaid ? (
              <span className="text-neon-green">✓ Already purchased - read again free</span>
            ) : (
              <span>Daily News - Cost: {newsCost} credits</span>
            )}
          </div>
          <button
            onClick={handleReadNews}
            disabled={!alreadyPaid && !canAffordNews}
            className={`neon-button px-4 py-2 flex items-center gap-2 ${
              (!alreadyPaid && !canAffordNews) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="text-lg">📰</span>
            {alreadyPaid ? 'Read News' : `Buy News (${newsCost} cr.)`}
          </button>
        </div>
        
        {!alreadyPaid && !canAffordNews && (
          <div className="text-neon-red text-xs">
            ⚠ Insufficient credits to purchase newspaper
          </div>
        )}
      </div>
      
      {/* News Content Modal */}
      {showNews && (
        <div className="fixed inset-0 bg-space-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="space-panel max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="retro-title text-lg text-neon-cyan">LOCAL NEWS</h2>
              <button 
                onClick={() => setShowNews(false)}
                className="neon-button px-3 py-1 text-sm"
              >
                ✕ Close
              </button>
            </div>
            <div className="text-sm text-palm-gray whitespace-pre-line">
              {newsContent}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Navigation */}
      {onNavigate && (
        <div className="space-panel">
          <h2 className="retro-title text-lg mb-4 text-center">SPACE STATION</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onNavigate('buy-cargo')}
              className="neon-button h-16 flex flex-col items-center justify-center"
            >
              <div className="text-lg">📦</div>
              <div className="text-sm">Buy Cargo</div>
            </button>
            
            <button 
              onClick={() => onNavigate('sell-cargo')}
              className="neon-button h-16 flex flex-col items-center justify-center"
            >
              <div className="text-lg">💰</div>
              <div className="text-sm">Sell Cargo</div>
            </button>
            
            <button 
              onClick={() => onNavigate('shipyard')}
              className="neon-button h-16 flex flex-col items-center justify-center"
            >
              <div className="text-lg">🚀</div>
              <div className="text-sm">Shipyard</div>
            </button>
            
            <button 
              onClick={() => onNavigate('buy-equipment')}
              className="neon-button h-16 flex flex-col items-center justify-center"
            >
              <div className="text-lg">⚔️</div>
              <div className="text-sm">Buy Equipment</div>
            </button>
            
            <button 
              onClick={() => onNavigate('sell-equipment')}
              className="neon-button h-16 flex flex-col items-center justify-center"
            >
              <div className="text-lg">🔧</div>
              <div className="text-sm">Sell Equipment</div>
            </button>
            
            <button 
              onClick={() => onNavigate('personnel')}
              className="neon-button h-16 flex flex-col items-center justify-center"
            >
              <div className="text-lg">👥</div>
              <div className="text-sm">Personnel</div>
            </button>
            
            <button 
              onClick={() => onNavigate('bank')}
              className="neon-button h-16 flex flex-col items-center justify-center"
            >
              <div className="text-lg">🏦</div>
              <div className="text-sm">Bank</div>
            </button>
            
            <button 
              onClick={() => onNavigate('galaxy-chart')}
              className="neon-button h-16 flex flex-col items-center justify-center"
            >
              <div className="text-lg">🗺️</div>
              <div className="text-sm">Charts</div>
            </button>
          </div>
          
          {/* Additional Navigation Row */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button 
              onClick={() => onNavigate('system-info')}
              className="neon-button h-12 flex items-center justify-center text-sm"
            >
              ℹ️ System Info
            </button>
            
            <button 
              onClick={() => onNavigate('commander')}
              className="neon-button h-12 flex items-center justify-center text-sm"
            >
              👤 Commander
            </button>
          </div>
        </div>
      )}
      
      {/* Critical Warnings */}
      {uiFields.warnings.length > 0 && (
        <div className="space-panel border-neon-red">
          <h2 className="retro-title text-lg mb-3 text-neon-red">CRITICAL WARNINGS</h2>
          {uiFields.warnings.map((warning, index) => (
            <div key={index} className="text-neon-red mb-2">⚠ {warning}</div>
          ))}
        </div>
      )}
    </div>
  );
}
