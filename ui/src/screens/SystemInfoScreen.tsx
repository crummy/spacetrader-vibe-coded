// System Information Screen - Display current system details
import React, { useState, useEffect } from 'react';
import { getUiFields } from '@game-ui';
import { getSolarSystemName } from '@game-data/systems.ts';
import { getPoliticalSystem } from '@game-data/politics.ts';
import { getMercenaryForHire, getMercenaryName } from '@game-data/crew.ts';
import { getTradeItemName } from '@game-data/tradeItems.ts';
import { getSystemSpecialEvent, canExecuteSpecialEvent, executeSpecialEvent } from '../../../ts/events/special.ts';
import type { ScreenProps } from '../types.ts';

const SYSTEM_SIZE_NAMES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];
const TECH_LEVEL_NAMES = [
  'Pre-agricultural', 'Agricultural', 'Medieval', 'Renaissance', 
  'Early Industrial', 'Industrial', 'Post-industrial', 'Hi-tech'
];
const SPECIAL_RESOURCES = [
  'Nothing special', 'Mineral rich', 'Mineral poor', 'Desert', 
  'Sweetwater oceans', 'Rich soil', 'Poor soil', 'Rich fauna', 
  'Lifeless', 'Weird mushrooms', 'Special herbs', 'Artistic populace', 'Warlike populace'
];
const SYSTEM_STATUS = [
  'under no particular pressure', 'at war', 'ravaged by a plague', 
  'suffering from a drought', 'suffering from extreme boredom', 
  'suffering from a cold spell', 'suffering from a crop failure', 'lacking enough workers'
];
const ACTIVITY_LEVELS = ['Absent', 'Minimal', 'Few', 'Some', 'Moderate', 'Many', 'Abundant', 'Swarms'];

interface SystemInfoProps extends ScreenProps {
  state?: any;
  onAction?: (action: any) => Promise<any>;
}

export function SystemInfoScreen({ state, onAction, onNavigate, onBack }: SystemInfoProps) {
  // Fallback for when state/onAction aren't provided (like in ScreenRouter)
  if (!state || !onAction) {
    return (
      <div className="palm-content">
        <div className="palm-header">
          <div className="retro-title text-sm">SYSTEM INFO</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-neon-cyan text-sm">System information unavailable</div>
          <div className="text-palm-gray text-xs mt-2">
            Use the System tab in the main interface to view system details.
          </div>
        </div>
      </div>
    );
  }
  
  const [newsContent, setNewsContent] = useState<string>('');
  
  const uiFields = getUiFields(state);
  const currentSystem = state.solarSystem[state.currentSystem];
  const systemName = getSolarSystemName(state.currentSystem);
  const politics = getPoliticalSystem(currentSystem.politics);
  
  // Check for mercenary availability in current system
  const mercenaryForHireIndex = getMercenaryForHire(state);
  const mercenaryForHire = mercenaryForHireIndex !== -1 ? getMercenaryName(mercenaryForHireIndex) : null;
  
  // Check for special event availability in current system
  const specialEvent = getSystemSpecialEvent(state, state.currentSystem);
  const canExecuteEvent = specialEvent ? canExecuteSpecialEvent(state, specialEvent.id) : null;

  // Load news content if already paid for in this system, clear when changing systems
  useEffect(() => {
    // Clear news content when changing systems
    setNewsContent('');
    
    // Load news if already paid for in current system
    if (state.alreadyPaidForNewspaper) {
      handleReadNews();
    }
  }, [state.currentSystem]);

  // Load news if payment status changes
  useEffect(() => {
    if (state.alreadyPaidForNewspaper && !newsContent) {
      handleReadNews();
    }
  }, [state.alreadyPaidForNewspaper]);
  
  const handleReadNews = async () => {
    try {
      const result = await onAction({ type: 'read_news', parameters: {} });
      if (result.success) {
        setNewsContent(result.message);
      } else {
        alert(result.message || 'Failed to read news');
      }
    } catch (error) {
      console.error('Failed to read news:', error);
      alert('Failed to read news');
    }
  };

  const handleSpecialEvent = async () => {
    if (!specialEvent || !canExecuteEvent?.possible) {
      alert(canExecuteEvent?.reason || 'Special event not available');
      return;
    }

    try {
      const result = executeSpecialEvent(state, specialEvent.id);
      if (result.success) {
        alert(result.message);
        // The state will be updated automatically by the parent component
      } else {
        alert(result.message || 'Special event failed');
      }
    } catch (error) {
      console.error('Failed to execute special event:', error);
      alert('Failed to execute special event');
    }
  };



  return (
    <div className="palm-content">
      {/* Header */}
      <div className="palm-header">
        <div className="retro-title text-sm">{systemName.toUpperCase()}</div>
        <div className="text-neon-green text-xs">Day {state.days}</div>
      </div>

      <div className="px-2 pt-2 space-y-3" style={{ height: '320px', overflow: 'auto' }}>
        
        {/* System Overview */}
        <div className="compact-panel" data-testid="system-information">
          <div className="compact-title">System Information</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div data-testid="system-size">
              <span className="text-neon-cyan">Size:</span>
              <span className="text-palm-gray ml-1">{SYSTEM_SIZE_NAMES[currentSystem.size]}</span>
            </div>
            <div data-testid="system-tech-level">
              <span className="text-neon-cyan">Tech Level:</span>
              <span className="text-palm-gray ml-1">{TECH_LEVEL_NAMES[currentSystem.techLevel]}</span>
            </div>
            <div className="col-span-2" data-testid="system-government">
              <span className="text-neon-cyan">Government:</span>
              <span className="text-palm-gray ml-1">{politics.name}</span>
            </div>
            <div className="col-span-2" data-testid="system-resources">
              <span className="text-neon-cyan">Resources:</span>
              <span className="text-palm-gray ml-1">{SPECIAL_RESOURCES[currentSystem.specialResources]}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-space-blue" data-testid="system-status">
              <span className="text-palm-gray">
                This system is <span className="text-neon-amber">{SYSTEM_STATUS[currentSystem.status]}</span>.
              </span>
            </div>
          </div>
        </div>

        {/* Activity Levels */}
        <div className="compact-panel" data-testid="activity-levels">
          <div className="compact-title">Activity Levels</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div data-testid="police-activity">
              <div className="text-neon-cyan">Police:</div>
              <div className="text-palm-gray">{ACTIVITY_LEVELS[politics.strengthPolice]}</div>
            </div>
            <div data-testid="pirates-activity">
              <div className="text-neon-cyan">Pirates:</div>
              <div className="text-palm-gray">{ACTIVITY_LEVELS[politics.strengthPirates]}</div>
            </div>
            <div data-testid="traders-activity">
              <div className="text-neon-cyan">Traders:</div>
              <div className="text-palm-gray">{ACTIVITY_LEVELS[politics.strengthTraders]}</div>
            </div>
          </div>
        </div>

        {/* Trade Information */}
        {politics.wanted !== undefined && (
          <div className="compact-panel" data-testid="trade-information">
            <div className="compact-title">Trade Information</div>
            <div className="text-xs space-y-1">
              <div data-testid="wanted-trade-good">
                <span className="text-neon-cyan">Wanted Trade Good:</span>
                <span className="text-palm-gray ml-1">
                  {politics.wanted === -1 ? 'None' : getTradeItemName(politics.wanted)}
                </span>
              </div>
              {!politics.drugsOK && (
                <div className="text-red-400" data-testid="drugs-illegal">⚠ Drugs are illegal here</div>
              )}
              {!politics.firearmsOK && (
                <div className="text-red-400" data-testid="firearms-illegal">⚠ Firearms are illegal here</div>
              )}
            </div>
          </div>
        )}

        {/* Interactive Buttons */}
        <div className="space-y-2">
          {/* News Button or News Content */}
          {state.alreadyPaidForNewspaper || newsContent ? (
            <div className="compact-panel" data-testid="news-content">
              <div className="compact-title">📰 {systemName} Daily News</div>
              <div>
                <pre className="whitespace-pre-wrap text-xs text-palm-gray font-mono leading-relaxed">
                  {newsContent ? newsContent.replace('Re-reading (already paid)\n\n', '') : 'Loading news...'}
                </pre>
              </div>
            </div>
          ) : (
            <button
              onClick={handleReadNews}
              className="w-full palm-button bg-space-dark border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-space-black"
              data-testid="read-news-button"
            >
              📰 Read News ({Math.max(1, state.difficulty + 1)} cr)
            </button>
          )}

          {/* Mercenary for Hire */}
          {mercenaryForHire && (
            <button
              onClick={() => onNavigate?.('personnel')}
              className="w-full palm-button bg-space-dark border border-neon-green text-neon-green hover:bg-neon-green hover:text-space-black"
              data-testid="mercenary-button"
            >
              👨‍🚀 {mercenaryForHire} Available for Hire
            </button>
          )}

          {/* Special Event */}
          {specialEvent && canExecuteEvent?.possible && (
            <button
              onClick={handleSpecialEvent}
              className="w-full palm-button bg-space-dark border border-neon-amber text-neon-amber hover:bg-neon-amber hover:text-space-black"
              data-testid="special-event-button"
            >
              ✨ {specialEvent.name}
            </button>
          )}
        </div>




      </div>
    </div>
  );
}
