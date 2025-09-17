import React, { useState } from 'react';

interface OptionsScreenProps {
  state: any;
  onAction: (action: any) => Promise<any>;
  onBack: () => void;
}

export function OptionsScreen({ state, onAction, onBack }: OptionsScreenProps) {
  const [options, setOptions] = useState(state.options);
  const [isSaving, setIsSaving] = useState(false);

  const handleOptionChange = (key: string, value: boolean | number) => {
    setOptions((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleBack = async () => {
    // Auto-save options when going back
    setIsSaving(true);
    try {
      // Directly update the state options instead of using action system
      Object.keys(options).forEach(key => {
        if (key in state.options) {
          (state.options as any)[key] = options[key];
        }
      });
      
      onBack();
    } catch (error) {
      console.error('Error updating options:', error);
      // Still go back even if there was an error
      onBack();
    } finally {
      setIsSaving(false);
    }
  };

  const renderCheckbox = (key: string, label: string, description?: string) => (
    <div className="flex items-center justify-between py-1 border-b border-space-blue" key={key}>
      <div className="flex-1 mr-2">
        <div className="text-neon-cyan text-xs font-bold">{label}</div>
        {description && <div className="text-space-gray text-xs">{description}</div>}
      </div>
      <input
        type="checkbox"
        checked={options[key] || false}
        onChange={(e) => handleOptionChange(key, e.target.checked)}
        className="w-3 h-3 accent-neon-cyan"
        data-testid={`option-${key}`}
        aria-label={label}
      />
    </div>
  );

  const renderNumberInput = (key: string, label: string, min: number = 0, max: number = 10) => (
    <div className="flex items-center justify-between py-1 border-b border-space-blue" key={key}>
      <div className="text-neon-cyan text-xs font-bold flex-1 mr-2">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        value={options[key] || 0}
        onChange={(e) => handleOptionChange(key, parseInt(e.target.value) || 0)}
        className="w-12 h-5 bg-space-black border border-space-blue text-neon-cyan text-xs text-center"
        data-testid={`option-${key}`}
        aria-label={label}
      />
    </div>
  );

  return (
    <div className="palm-content">
      {/* Header */}
      <div className="palm-header">
        <div className="retro-title text-sm">OPTIONS</div>
        <button 
          onClick={handleBack}
          disabled={isSaving}
          className="text-neon-cyan text-xs hover:text-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="back-button"
        >
          {isSaving ? 'SAVING...' : '← Back'}
        </button>
      </div>

      <div className="p-2 space-y-4 overflow-y-auto">
        {/* Auto Services */}
        <div>
          <div className="text-neon-green text-xs font-bold mb-2 border-b border-neon-green">AUTO SERVICES</div>
          {renderCheckbox('autoFuel', 'Auto-fuel', 'Fill tank when arriving in systems')}
          {renderCheckbox('autoRepair', 'Auto-repair', 'Repair hull when arriving in systems')}
        </div>

        {/* Always Ignore Options */}
        <div>
          <div className="text-neon-green text-xs font-bold mb-2 border-b border-neon-green">ALWAYS IGNORE (WHEN SAFE)</div>
          {renderCheckbox('alwaysIgnorePolice', 'Ignore Police', 'Auto-ignore police encounters when safe')}
          {renderCheckbox('alwaysIgnorePirates', 'Ignore Pirates', 'Auto-ignore pirate encounters when safe')}
          {renderCheckbox('alwaysIgnoreTraders', 'Ignore Traders', 'Auto-ignore trader encounters when safe')}
          {renderCheckbox('alwaysIgnoreTradeInOrbit', 'Ignore Trade in Orbit', 'Auto-ignore orbital trading offers')}
        </div>

        {/* Game Preferences */}
        <div>
          <div className="text-neon-green text-xs font-bold mb-2 border-b border-neon-green">GAME PREFERENCES</div>
          {renderCheckbox('reserveMoney', 'Reserve Money', 'Keep money for warp costs and insurance')}
          {renderCheckbox('continuous', 'Continuous Mode', 'Auto-continue after encounters')}
          {renderCheckbox('attackFleeing', 'Attack Fleeing', 'Continue attacking fleeing ships')}
          {renderCheckbox('alwaysInfo', 'Always Show Info', 'Show additional information')}
          {renderNumberInput('leaveEmpty', 'Empty Cargo Bays', 0, 50)}
        </div>

        {/* Combat Options */}
        <div>
          <div className="text-neon-green text-xs font-bold mb-2 border-b border-neon-green">COMBAT</div>
          {renderCheckbox('autoAttack', 'Auto-attack', 'Automatically attack in combat')}
          {renderCheckbox('autoFlee', 'Auto-flee', 'Automatically flee from combat')}
        </div>

        {/* Interface Options */}
        <div>
          <div className="text-neon-green text-xs font-bold mb-2 border-b border-neon-green">INTERFACE</div>
          {renderCheckbox('textualEncounters', 'Text Encounters', 'Use text instead of graphics')}
          {renderCheckbox('newsAutoPay', 'Auto-buy News', 'Automatically pay for newspapers')}
          {renderCheckbox('remindLoans', 'Loan Reminders', 'Get reminders about loans')}
          {renderCheckbox('priceDifferences', 'Show Price Differences', 'Show price difference indicators')}
          {renderCheckbox('tribbleMessage', 'Tribble Messages', 'Show tribble-related messages')}
          {renderCheckbox('useHWButtons', 'Hardware Buttons', 'Enable hardware button shortcuts')}
          {renderCheckbox('rectangularButtonsOn', 'Rectangular Buttons', 'Use rectangular button style')}
        </div>

        {/* Advanced Options */}
        <div>
          <div className="text-neon-green text-xs font-bold mb-2 border-b border-neon-green">ADVANCED</div>
          {renderCheckbox('sharePreferences', 'Share Preferences', 'Share settings between games')}
          {renderCheckbox('identifyStartup', 'Identify on Startup', 'Show app identification on startup')}
        </div>
      </div>


    </div>
  );
}
