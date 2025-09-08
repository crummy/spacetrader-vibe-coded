// Personnel Roster Screen - Full crew management functionality
import React, { useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import { getMercenaryName, calculateHiringPrice, getMercenaryForHire, getAvailableCrewQuarters } from '../../../ts/data/crew.ts';
import { getShipType } from '@game-data/shipTypes.ts';
import type { ScreenProps } from '../types.ts';

type PersonnelTab = 'roster' | 'hire';

export function PersonnelScreen({ onNavigate, onBack, state, onAction, availableActions }: ScreenProps) {
  // Fall back to useGameEngine if props aren't provided (backwards compatibility)
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;
  const actualAvailableActions = availableActions || gameEngine.availableActions;

  const [activeTab, setActiveTab] = useState<PersonnelTab>('roster');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const currentShipType = getShipType(actualState.ship.type);

  // Get crew roster information
  const crewRoster = useMemo(() => {
    const roster = [];
    
    // Commander (always slot 0)
    roster.push({
      slotIndex: 0,
      name: getMercenaryName(0), // "Jameson"
      isCommander: true,
      pilot: actualState.commanderPilot,
      fighter: actualState.commanderFighter,
      trader: actualState.commanderTrader,
      engineer: actualState.commanderEngineer
    });
    
    // Other crew members
    for (let i = 1; i < actualState.ship.crew.length; i++) {
      const crewIndex = actualState.ship.crew[i];
      if (crewIndex >= 0) {
        const mercenary = actualState.mercenary[crewIndex];
        roster.push({
          slotIndex: i,
          name: getMercenaryName(crewIndex),
          isCommander: false,
          pilot: mercenary.pilot,
          fighter: mercenary.fighter,
          trader: mercenary.trader,
          engineer: mercenary.engineer
        });
      }
    }
    
    return roster;
  }, [actualState]);

  // Get available mercenary for hire
  const availableMercenary = useMemo(() => {
    const mercenaryIndex = getMercenaryForHire(actualState);
    if (mercenaryIndex === -1) return null;
    
    const mercenary = actualState.mercenary[mercenaryIndex];
    return {
      index: mercenaryIndex,
      name: getMercenaryName(mercenaryIndex),
      pilot: mercenary.pilot,
      fighter: mercenary.fighter,
      trader: mercenary.trader,
      engineer: mercenary.engineer,
      hiringCost: calculateHiringPrice(mercenary)
    };
  }, [actualState]);

  const availableQuarters = useMemo(() => getAvailableCrewQuarters(actualState), [actualState]);

  const handleDock = async () => {
    try {
      setMessage('Docking at planet...');
      setMessageType('info');
      
      const result = await actualExecuteAction({
        type: 'dock_at_planet',
        parameters: {}
      });

      if (result.success) {
        setMessage('Successfully docked at planet. You can now hire crew.');
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

  const handleHireCrew = async () => {
    if (!availableMercenary) return;

    // Check if hire_crew action is available
    const hireCrewAction = actualAvailableActions.find(a => a.type === 'hire_crew');
    if (!hireCrewAction || !hireCrewAction.available) {
      setMessage('Personnel office not available. You may need to dock at a planet first.');
      setMessageType('error');
      return;
    }

    // Validation
    if (availableQuarters <= 0) {
      setMessage('No crew quarters available. Need a larger ship or fire existing crew.');
      setMessageType('error');
      return;
    }

    if (actualState.credits < availableMercenary.hiringCost) {
      setMessage(`Cannot afford to hire ${availableMercenary.name}. Cost: ${availableMercenary.hiringCost.toLocaleString()} credits.`);
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'hire_crew',
        parameters: {}
      });

      if (result.success) {
        setMessage(`Successfully hired ${availableMercenary.name} for ${availableMercenary.hiringCost.toLocaleString()} credits!`);
        setMessageType('success');
      } else {
        setMessage(result.message || 'Hiring failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handleFireCrew = async (slotIndex: number, crewName: string) => {
    // Check if fire_crew action is available
    const fireCrewAction = actualAvailableActions.find(a => a.type === 'fire_crew');
    if (!fireCrewAction || !fireCrewAction.available) {
      setMessage('Personnel office not available. You may need to dock at a planet first.');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'fire_crew',
        parameters: {
          crewSlot: slotIndex
        }
      });

      if (result.success) {
        setMessage(`Successfully fired ${crewName}.`);
        setMessageType('success');
      } else {
        setMessage(result.message || 'Firing failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const hireCrewAvailable = actualAvailableActions.some(a => a.type === 'hire_crew' && a.available);
  const fireCrewAvailable = actualAvailableActions.some(a => a.type === 'fire_crew' && a.available);
  const dockAvailable = actualAvailableActions.some(a => a.type === 'dock_at_planet' && a.available);
  
  // Check if we're docked (has buy_cargo or other planet actions)
  const isDocked = actualAvailableActions.some(a => 
    (a.type === 'buy_cargo' || a.type === 'sell_cargo' || a.type === 'buy_equipment' || a.type === 'sell_equipment') && a.available
  );

  const getTotalSkills = (crew: any) => crew.pilot + crew.fighter + crew.trader + crew.engineer;

  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">
          ← Back
        </button>
        <h2 className="retro-title text-lg">PERSONNEL</h2>
        <div className="text-neon-green font-bold">{actualState.credits.toLocaleString()} cr.</div>
      </div>

      {/* Dock Button if not docked */}
      {!hireCrewAvailable && !fireCrewAvailable && dockAvailable && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-2">Not Docked:</div>
          <div className="text-sm text-palm-gray mb-3">
            You need to dock at a planet to access the personnel office.
          </div>
          <button onClick={handleDock} className="neon-button w-full">
            🚀 Dock at Planet
          </button>
        </div>
      )}

      {/* Ship Info */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-2">Ship Crew Capacity:</div>
        <div className="text-sm text-palm-gray">
          <div>Ship: {currentShipType.name}</div>
          <div>Crew Quarters: {crewRoster.length}/{currentShipType.crewQuarters}</div>
          <div>Available Quarters: {availableQuarters}</div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3">Personnel Management:</div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded border transition-all duration-200 ${
              activeTab === 'roster'
                ? 'border-neon-cyan bg-neon-cyan bg-opacity-20 text-neon-cyan'
                : 'border-palm-gray border-opacity-30 text-palm-gray hover:border-neon-cyan'
            }`}
          >
            Crew Roster
          </button>
          <button
            onClick={() => setActiveTab('hire')}
            className={`px-4 py-2 rounded border transition-all duration-200 ${
              activeTab === 'hire'
                ? 'border-neon-cyan bg-neon-cyan bg-opacity-20 text-neon-cyan'
                : 'border-palm-gray border-opacity-30 text-palm-gray hover:border-neon-cyan'
            }`}
          >
            Hire Crew
          </button>
        </div>
      </div>

      {/* Crew Roster Tab */}
      {activeTab === 'roster' && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-3">Current Crew:</div>
          <div className="space-y-3">
            {crewRoster.map((crew) => (
              <div
                key={crew.slotIndex}
                className="p-3 rounded border border-palm-gray border-opacity-30"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-neon-cyan font-semibold">
                    {crew.name} {crew.isCommander && '(Commander)'}
                  </div>
                  <div className="text-palm-gray text-sm">
                    Total: {getTotalSkills(crew)} skill points
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-xs text-palm-gray mb-2">
                  <div>Pilot: {crew.pilot}</div>
                  <div>Fighter: {crew.fighter}</div>
                  <div>Trader: {crew.trader}</div>
                  <div>Engineer: {crew.engineer}</div>
                </div>
                
                {!crew.isCommander && fireCrewAvailable && (
                  <button
                    onClick={() => handleFireCrew(crew.slotIndex, crew.name)}
                    className="neon-button w-full py-1 text-sm mt-2 bg-red-900 hover:bg-red-800 border-red-500"
                  >
                    Fire {crew.name}
                  </button>
                )}
              </div>
            ))}
            
            {crewRoster.length === 1 && (
              <div className="text-palm-gray text-sm text-center py-4">
                Only the commander is aboard. Consider hiring additional crew to improve ship performance.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hire Crew Tab */}
      {activeTab === 'hire' && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-3">Available for Hire:</div>
          
          {!isDocked ? (
            <div className="text-palm-gray text-sm">Personnel office unavailable - must be docked at a planet.</div>
          ) : !availableMercenary ? (
            <div className="text-palm-gray text-sm text-center py-8">
              No mercenaries available for hire in this system.
              <br />
              Try visiting other planets to find crew members.
            </div>
          ) : (
            <div className="p-3 rounded border border-palm-gray border-opacity-30">
              <div className="flex justify-between items-center mb-2">
                <div className="text-neon-cyan font-semibold">{availableMercenary.name}</div>
                <div className={`font-bold ${availableMercenary.hiringCost <= actualState.credits ? 'text-neon-green' : 'text-red-400'}`}>
                  {availableMercenary.hiringCost.toLocaleString()} cr.
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-xs text-palm-gray mb-3">
                <div>Pilot: {availableMercenary.pilot}</div>
                <div>Fighter: {availableMercenary.fighter}</div>
                <div>Trader: {availableMercenary.trader}</div>
                <div>Engineer: {availableMercenary.engineer}</div>
              </div>
              
              <div className="text-xs text-palm-gray mb-3">
                Total Skills: {getTotalSkills(availableMercenary)} points
              </div>
              
              {availableQuarters <= 0 && (
                <div className="text-red-400 text-xs mb-2">No crew quarters available</div>
              )}
              {availableMercenary.hiringCost > actualState.credits && (
                <div className="text-red-400 text-xs mb-2">Insufficient funds</div>
              )}
              
              <button
                onClick={handleHireCrew}
                disabled={availableQuarters <= 0 || availableMercenary.hiringCost > actualState.credits}
                className="neon-button w-full py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hire {availableMercenary.name} for {availableMercenary.hiringCost.toLocaleString()} cr.
              </button>
            </div>
          )}
        </div>
      )}

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
