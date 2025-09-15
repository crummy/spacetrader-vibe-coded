// Sell Equipment Screen - Full equipment selling functionality
import React, { useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import { getInstialledEquipmentSellPrices } from '../../../ts/economy/equipment-trading.ts';
import { getShipType } from '@game-data/shipTypes.ts';
import { GameMode } from '../../../ts/types.ts';
import type { ScreenProps } from '../types.ts';

type EquipmentType = 'weapons' | 'shields' | 'gadgets';

export function SellEquipmentScreen({ onNavigate, onBack, state, onAction, availableActions }: ScreenProps) {
  // Fall back to useGameEngine if props aren't provided (backwards compatibility)
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;
  const actualAvailableActions = availableActions || gameEngine.availableActions;

  const [selectedCategory, setSelectedCategory] = useState<EquipmentType>('weapons');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const currentShipType = getShipType(actualState.ship.type);

  // Get installed equipment that can be sold
  const installedEquipment = useMemo(() => {
    return getInstialledEquipmentSellPrices(actualState);
  }, [actualState]);

  // Check equipment slots usage
  const equipmentSlotInfo = useMemo(() => {
    const weaponsUsed = actualState.ship.weapon.filter((w: number) => w !== -1).length;
    const shieldsUsed = actualState.ship.shield.filter((s: number) => s !== -1).length;
    const gadgetsUsed = actualState.ship.gadget.filter((g: number) => g !== -1).length;
    
    return {
      weapons: { used: weaponsUsed, total: currentShipType.weaponSlots },
      shields: { used: shieldsUsed, total: currentShipType.shieldSlots },
      gadgets: { used: gadgetsUsed, total: currentShipType.gadgetSlots }
    };
  }, [actualState, currentShipType]);

  const handleDock = async () => {
    try {
      setMessage('Docking at planet...');
      setMessageType('info');
      
      const result = await actualExecuteAction({
        type: 'dock_at_planet',
        parameters: {}
      });

      if (result.success) {
        setMessage('Successfully docked at planet. You can now sell equipment.');
        setMessageType('success');
      } else {
        setMessage(`Failed to dock: ${result.message}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Docking error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handleSale = async (equipmentType: EquipmentType, slotIndex: number, equipmentName: string) => {
    // Check if sell_equipment action is available
    const sellEquipmentAction = actualAvailableActions.find(a => a.type === 'sell_equipment');
    if (!sellEquipmentAction || !sellEquipmentAction.available) {
      setMessage('Equipment store not available. You may need to dock at a planet first.');
      setMessageType('error');
      return;
    }

    try {
      const actionType = equipmentType === 'weapons' ? 'sell_weapon' :
                        equipmentType === 'shields' ? 'sell_shield' : 'sell_gadget';
      
      const result = await actualExecuteAction({
        type: actionType,
        parameters: {
          slotIndex: slotIndex
        }
      });

      if (result.success) {
        setMessage(`Successfully sold ${equipmentName}!`);
        setMessageType('success');
      } else {
        setMessage(result.message || 'Sale failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const sellEquipmentAvailable = actualAvailableActions.some(a => a.type === 'sell_equipment' && a.available);
  const dockAvailable = actualAvailableActions.some(a => a.type === 'dock_at_planet' && a.available);
  const isDocked = actualState.currentMode === GameMode.OnPlanet;

  const currentEquipment = installedEquipment[selectedCategory];

  return (
    <div className="space-panel">

      {/* Dock Button if not docked */}
      {!isDocked && dockAvailable && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-2">Not Docked:</div>
          <div className="text-sm text-palm-gray mb-3">
            You need to dock at a planet to access the equipment store.
          </div>
          <button onClick={handleDock} className="neon-button w-full">
            🚀 Dock at Planet
          </button>
        </div>
      )}

      {/* Equipment Slot Status */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-2">Installed Equipment:</div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-neon-cyan">Weapons</div>
            <div className="text-palm-gray">
              {equipmentSlotInfo.weapons.used}/{equipmentSlotInfo.weapons.total}
            </div>
          </div>
          <div className="text-center">
            <div className="text-neon-cyan">Shields</div>
            <div className="text-palm-gray">
              {equipmentSlotInfo.shields.used}/{equipmentSlotInfo.shields.total}
            </div>
          </div>
          <div className="text-center">
            <div className="text-neon-cyan">Gadgets</div>
            <div className="text-palm-gray">
              {equipmentSlotInfo.gadgets.used}/{equipmentSlotInfo.gadgets.total}
            </div>
          </div>
        </div>
      </div>

      {/* Category Selector */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3">Equipment Categories:</div>
        <div className="flex gap-2">
          {(['weapons', 'shields', 'gadgets'] as EquipmentType[]).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-2 rounded border transition-all duration-200 ${
                selectedCategory === category
                  ? 'border-neon-cyan bg-neon-cyan bg-opacity-20 text-neon-cyan'
                  : 'border-palm-gray border-opacity-30 text-palm-gray hover:border-neon-cyan'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment List */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3">Installed {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}:</div>
        <div className="space-y-2">
          {!isDocked ? (
            <div className="text-palm-gray text-sm">Equipment store unavailable - must be docked at a planet.</div>
          ) : currentEquipment.length === 0 ? (
            <div className="text-palm-gray text-sm">No {selectedCategory} installed.</div>
          ) : (
            currentEquipment.map((item: any) => (
              <div
                key={item.slotIndex}
                className="p-3 rounded border border-palm-gray border-opacity-30 hover:border-neon-cyan transition-all duration-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-neon-cyan font-semibold">{item.name}</div>
                  <div className="text-neon-green font-bold">
                    {item.sellPrice.toLocaleString()} cr.
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-palm-gray mb-3">
                  <div>Slot: {item.slotIndex + 1}</div>
                  {item.currentStrength !== undefined && (
                    <div>Shield: {item.currentStrength}/{item.maxStrength}</div>
                  )}
                </div>
                
                <button
                  onClick={() => handleSale(selectedCategory, item.slotIndex, item.name)}
                  className="neon-button w-full py-2 text-sm"
                >
                  Sell {item.name} for {item.sellPrice.toLocaleString()} cr.
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`space-panel mb-4 ${
          messageType === 'success' ? 'bg-green-900 border-green-500' :
          messageType === 'error' ? 'bg-red-900 border-red-500' :
          'bg-space-black border-neon-amber'
        }`}>
          <div className={`text-sm ${
            messageType === 'success' ? 'text-green-300' :
            messageType === 'error' ? 'text-red-300' :
            'text-neon-amber'
          }`}>
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
