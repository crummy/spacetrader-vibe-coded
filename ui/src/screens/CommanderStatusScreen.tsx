// Commander Status Screen - Full commander statistics and achievements
import React, { useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import { getPoliceRecordString } from '../../../ts/reputation/police.ts';
import { getReputationString } from '../../../ts/reputation/combat.ts';
import { calculateShipTotalValue } from '../../../ts/economy/ship-pricing.ts';
import { getShipType } from '@game-data/shipTypes.ts';
import { getMercenaryName } from '../../../ts/data/crew.ts';
import type { ScreenProps } from '../types.ts';

type StatusTab = 'general' | 'combat' | 'financial' | 'ship';

export function CommanderStatusScreen({ onNavigate, onBack, state, onAction, availableActions }: ScreenProps) {
  // Fall back to useGameEngine if props aren't provided (backwards compatibility)
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;

  const [activeTab, setActiveTab] = useState<StatusTab>('general');

  // Calculate derived statistics
  const netWorth = useMemo(() => actualState.credits - actualState.debt, [actualState.credits, actualState.debt]);
  const totalKills = useMemo(() => actualState.policeKills + actualState.traderKills + actualState.pirateKills, [actualState.policeKills, actualState.traderKills, actualState.pirateKills]);
  const policeRecord = useMemo(() => getPoliceRecordString(actualState.policeRecordScore), [actualState.policeRecordScore]);
  const combatReputation = useMemo(() => getReputationString(actualState.reputationScore), [actualState.reputationScore]);
  const shipValue = useMemo(() => calculateShipTotalValue(actualState), [actualState]);
  const currentShipType = getShipType(actualState.ship.type);

  // Calculate total skills
  const totalSkills = actualState.commanderPilot + actualState.commanderFighter + actualState.commanderTrader + actualState.commanderEngineer;

  // Get crew information
  const crewInfo = useMemo(() => {
    const crew = [];
    for (let i = 1; i < actualState.ship.crew.length; i++) {
      const crewIndex = actualState.ship.crew[i];
      if (crewIndex >= 0) {
        crew.push(getMercenaryName(crewIndex));
      }
    }
    return crew;
  }, [actualState.ship.crew]);

  // Difficulty names
  const difficultyNames = ['Beginner', 'Easy', 'Normal', 'Hard', 'Impossible'];
  const difficultyName = difficultyNames[actualState.difficulty] || 'Unknown';

  return (
    <div className="space-panel">

      {/* Commander Header */}
      <div className="space-panel bg-space-black mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-neon-cyan text-xl font-bold">Commander {actualState.nameCommander}</div>
            <div className="text-palm-gray text-sm">
              {combatReputation} • {policeRecord} • Day {actualState.days}
            </div>
          </div>
          <div className="text-4xl">👨‍🚀</div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3">Status Categories:</div>
        <div className="grid grid-cols-2 gap-2">
          {(['general', 'combat', 'financial', 'ship'] as StatusTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded border transition-all duration-200 text-sm ${
                activeTab === tab
                  ? 'border-neon-cyan bg-neon-cyan bg-opacity-20 text-neon-cyan'
                  : 'border-palm-gray border-opacity-30 text-palm-gray hover:border-neon-cyan'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <>
          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Commander Skills:</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span>Pilot:</span>
                <span className="text-neon-cyan">{actualState.commanderPilot}</span>
              </div>
              <div className="flex justify-between">
                <span>Fighter:</span>
                <span className="text-neon-cyan">{actualState.commanderFighter}</span>
              </div>
              <div className="flex justify-between">
                <span>Trader:</span>
                <span className="text-neon-cyan">{actualState.commanderTrader}</span>
              </div>
              <div className="flex justify-between">
                <span>Engineer:</span>
                <span className="text-neon-cyan">{actualState.commanderEngineer}</span>
              </div>
            </div>
            <div className="border-t border-palm-gray border-opacity-30 pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Total Skills:</span>
                <span className="text-neon-green font-bold">{totalSkills}</span>
              </div>
            </div>
          </div>

          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Game Progress:</div>
            <div className="text-sm text-palm-gray space-y-1">
              <div className="flex justify-between">
                <span>Days Played:</span>
                <span>{actualState.days}</span>
              </div>
              <div className="flex justify-between">
                <span>Difficulty:</span>
                <span>{difficultyName}</span>
              </div>
              <div className="flex justify-between">
                <span>Current System:</span>
                <span>{actualState.solarSystem[actualState.currentSystem].name}</span>
              </div>
              <div className="flex justify-between">
                <span>Game Mode:</span>
                <span>{actualState.currentMode}</span>
              </div>
            </div>
          </div>

          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Special Status:</div>
            <div className="text-sm text-palm-gray space-y-1">
              <div className="flex justify-between">
                <span>Insurance:</span>
                <span className={actualState.insurance ? 'text-neon-green' : 'text-red-400'}>
                  {actualState.insurance ? `Active (${actualState.noClaim} days)` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Escape Pod:</span>
                <span className={actualState.escapePod ? 'text-neon-green' : 'text-red-400'}>
                  {actualState.escapePod ? 'Installed' : 'None'}
                </span>
              </div>
              {actualState.moonBought && (
                <div className="flex justify-between">
                  <span>Moon Purchased:</span>
                  <span className="text-neon-green">Yes</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Combat Tab */}
      {activeTab === 'combat' && (
        <>
          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Combat Reputation:</div>
            <div className="text-center mb-3">
              <div className="text-neon-cyan text-xl font-bold">{combatReputation}</div>
              <div className="text-sm text-palm-gray">Score: {actualState.reputationScore}</div>
            </div>
            <div className="text-xs text-palm-gray">
              Combat reputation increases by defeating opponents. Higher reputation leads to more challenging encounters.
            </div>
          </div>

          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Police Record:</div>
            <div className="text-center mb-3">
              <div className={`text-xl font-bold ${
                actualState.policeRecordScore >= 0 ? 'text-neon-green' : 'text-red-400'
              }`}>
                {policeRecord}
              </div>
              <div className="text-sm text-palm-gray">Score: {actualState.policeRecordScore}</div>
            </div>
            <div className="text-xs text-palm-gray">
              {actualState.policeRecordScore >= 0 
                ? 'Clean record helps with loans and reduces fines.'
                : 'Criminal record limits credit and increases police encounters.'}
            </div>
          </div>

          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Combat Statistics:</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span>Total Kills:</span>
                <span className="text-neon-cyan font-bold">{totalKills}</span>
              </div>
              <div className="flex justify-between">
                <span>Pirate Kills:</span>
                <span className="text-neon-green">{actualState.pirateKills}</span>
              </div>
              <div className="flex justify-between">
                <span>Police Kills:</span>
                <span className="text-red-400">{actualState.policeKills}</span>
              </div>
              <div className="flex justify-between">
                <span>Trader Kills:</span>
                <span className="text-red-400">{actualState.traderKills}</span>
              </div>
            </div>
            {totalKills === 0 && (
              <div className="text-center text-palm-gray text-xs mt-2">
                No combat encounters yet. Peaceful trader!
              </div>
            )}
          </div>
        </>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <>
          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Financial Status:</div>
            <div className="text-sm text-palm-gray space-y-2">
              <div className="flex justify-between">
                <span>Credits:</span>
                <span className="text-neon-green font-bold">{actualState.credits.toLocaleString()} cr.</span>
              </div>
              <div className="flex justify-between">
                <span>Debt:</span>
                <span className={actualState.debt > 0 ? "text-red-400" : "text-palm-gray"}>
                  {actualState.debt.toLocaleString()} cr.
                </span>
              </div>
              <div className="flex justify-between border-t border-palm-gray border-opacity-30 pt-2">
                <span>Net Worth:</span>
                <span className={`font-bold ${netWorth >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                  {netWorth.toLocaleString()} cr.
                </span>
              </div>
            </div>
          </div>

          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Assets:</div>
            <div className="text-sm text-palm-gray space-y-1">
              <div className="flex justify-between">
                <span>Ship Value:</span>
                <span>{shipValue.toLocaleString()} cr.</span>
              </div>
              {actualState.moonBought && (
                <div className="flex justify-between">
                  <span>Moon Value:</span>
                  <span>500,000 cr.</span>
                </div>
              )}
              <div className="text-xs text-palm-gray mt-2">
                Ship value includes hull, equipment, and cargo
              </div>
            </div>
          </div>

          {actualState.debt > 0 && (
            <div className="space-panel bg-red-900 border-red-500 mb-4">
              <div className="text-red-300 mb-2">Debt Warning:</div>
              <div className="text-sm text-red-200">
                Daily interest: {Math.max(1, Math.floor(actualState.debt / 10)).toLocaleString()} cr.
                <br />
                Pay back debt at banks to reduce interest costs.
              </div>
            </div>
          )}
        </>
      )}

      {/* Ship Tab */}
      {activeTab === 'ship' && (
        <>
          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Current Ship - {currentShipType.name}:</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span>Hull:</span>
                <span className={actualState.ship.hull === currentShipType.hullStrength ? 'text-neon-green' : 'text-neon-amber'}>
                  {actualState.ship.hull}/{currentShipType.hullStrength}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fuel:</span>
                <span className={actualState.ship.fuel === currentShipType.fuelTanks ? 'text-neon-green' : 'text-neon-amber'}>
                  {actualState.ship.fuel}/{currentShipType.fuelTanks}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cargo Bays:</span>
                <span>{currentShipType.cargoBays}</span>
              </div>
              <div className="flex justify-between">
                <span>Crew Quarters:</span>
                <span>{currentShipType.crewQuarters}</span>
              </div>
            </div>
          </div>

          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Equipment Slots:</div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="text-neon-cyan">Weapons</div>
                <div>{actualState.ship.weapon.filter((w: number) => w !== -1).length}/{currentShipType.weaponSlots}</div>
              </div>
              <div className="text-center">
                <div className="text-neon-cyan">Shields</div>
                <div>{actualState.ship.shield.filter((s: number) => s !== -1).length}/{currentShipType.shieldSlots}</div>
              </div>
              <div className="text-center">
                <div className="text-neon-cyan">Gadgets</div>
                <div>{actualState.ship.gadget.filter((g: number) => g !== -1).length}/{currentShipType.gadgetSlots}</div>
              </div>
            </div>
          </div>

          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Ship Cargo:</div>
            <div className="text-sm text-palm-gray">
              {actualState.ship.cargo.some((c: number) => c > 0) ? (
                <div className="space-y-1">
                  {actualState.ship.cargo.map((qty: number, index: number) => 
                    qty > 0 ? (
                      <div key={index} className="flex justify-between">
                        <span>Item {index}:</span>
                        <span>{qty} units</span>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="text-center text-palm-gray">Cargo hold is empty</div>
              )}
            </div>
          </div>

          {crewInfo.length > 0 && (
            <div className="space-panel bg-space-black mb-4">
              <div className="text-neon-amber mb-2">Crew Members:</div>
              <div className="text-sm text-palm-gray">
                <div>Commander {actualState.nameCommander} (You)</div>
                {crewInfo.map((name, index) => (
                  <div key={index}>{name}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
