// Wormhole Confirmation Modal - Shows cost breakdown before wormhole travel
import React from 'react';
import type { WarpCost } from '../../../ts/travel/warp.ts';
import { getSolarSystemName } from '@game-data/systems.ts';

interface WormholeConfirmModalProps {
  targetSystemIndex: number;
  cost: WarpCost;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WormholeConfirmModal({ 
  targetSystemIndex, 
  cost, 
  onConfirm, 
  onCancel 
}: WormholeConfirmModalProps) {
  const targetSystemName = getSolarSystemName(targetSystemIndex);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-space-dark border border-neon-green rounded p-6 max-w-sm mx-4 text-palm-green">
        <div className="text-neon-green font-bold text-lg mb-4 text-center">
          Wormhole Travel Costs
        </div>
        
        <div className="text-sm space-y-2 text-palm-gray mb-4">
          <div className="text-neon-cyan mb-3">
            Destination: {targetSystemName}
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Mercenaries:</span>
              <span>{cost.mercenaryPay} cr.</span>
            </div>
            <div className="flex justify-between">
              <span>Insurance:</span>
              <span>{cost.insurance} cr.</span>
            </div>
            <div className="flex justify-between">
              <span>Wormhole Tax:</span>
              <span>{cost.wormholeTax} cr.</span>
            </div>
            {cost.interest > 0 && (
              <div className="flex justify-between">
                <span>Interest:</span>
                <span>{cost.interest} cr.</span>
              </div>
            )}
          </div>
          
          <div className="border-t border-palm-gray pt-2 mt-3">
            <div className="flex justify-between font-bold text-neon-green">
              <span>Total:</span>
              <span>{cost.total} cr.</span>
            </div>
          </div>
          
          <div className="text-xs text-palm-gray mt-3">
            Wormhole tax must be paid when you want to warp through a wormhole. 
            It depends on the type of your ship.
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-space-dark border border-palm-gray text-palm-gray py-2 px-4 rounded hover:bg-palm-gray hover:text-space-dark transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-neon-green text-space-dark py-2 px-4 rounded hover:bg-neon-cyan font-bold transition-colors"
          >
            Pay & Travel
          </button>
        </div>
      </div>
    </div>
  );
}
