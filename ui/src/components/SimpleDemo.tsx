// Simple demo component showcasing Space Trader UI design
export function SimpleDemo() {
  return (
    <div className="space-y-6">
      {/* System Information */}
      <div className="space-panel">
        <h2 className="retro-title text-lg mb-3">SYSTEM STATUS</h2>
        <div className="space-y-2">
          <div className="text-neon-cyan font-bold">Acamar</div>
          <div className="text-sm">The system is under no particular pressure</div>
          <div className="text-xs text-palm-gray">• High-tech market with advanced goods available</div>
          <div className="text-xs text-neon-amber italic">• Mineral rich</div>
        </div>
      </div>
      
      {/* Ship Status */}
      <div className="space-panel">
        <h2 className="retro-title text-lg mb-3">SHIP STATUS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm status-good">No repairs are needed.</div>
            <div className="text-sm">You have fuel to fly 14 parsecs.</div>
            <div className="text-sm">No cargo.</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-palm-gray">Equipment:</div>
            <div className="text-xs text-neon-green">• Pulse laser</div>
            <div className="text-xs text-neon-green">• Energy shield</div>
          </div>
        </div>
      </div>
      
      {/* Financial Status */}
      <div className="space-panel">
        <h2 className="retro-title text-lg mb-3">FINANCIAL STATUS</h2>
        <div className="space-y-2">
          <div className="text-xl font-bold text-neon-green">1,000 cr.</div>
          <div className="text-xs text-neon-amber">• You need 2000 cr. for an escape pod.</div>
        </div>
      </div>
      
      {/* Trading Interface */}
      <div className="space-panel">
        <h2 className="retro-title text-lg mb-3">COMMODITY EXCHANGE</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-neon-cyan border-b border-space-blue">
                <th className="text-left p-2">Item</th>
                <th className="text-right p-2">Buy</th>
                <th className="text-right p-2">Sell</th>
                <th className="text-right p-2">Have</th>
              </tr>
            </thead>
            <tbody className="text-palm-gray">
              <tr className="border-b border-space-blue hover:bg-space-blue hover:bg-opacity-30">
                <td className="p-2">Water</td>
                <td className="text-right p-2 text-neon-green">30 cr.</td>
                <td className="text-right p-2 text-neon-amber">25 cr.</td>
                <td className="text-right p-2">0</td>
              </tr>
              <tr className="border-b border-space-blue hover:bg-space-blue hover:bg-opacity-30">
                <td className="p-2">Food</td>
                <td className="text-right p-2 text-neon-green">100 cr.</td>
                <td className="text-right p-2 text-neon-amber">90 cr.</td>
                <td className="text-right p-2">0</td>
              </tr>
              <tr className="border-b border-space-blue hover:bg-space-blue hover:bg-opacity-30">
                <td className="p-2">Medicine</td>
                <td className="text-right p-2 text-neon-green">650 cr.</td>
                <td className="text-right p-2 text-neon-amber">600 cr.</td>
                <td className="text-right p-2">0</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button className="neon-button flex-1">BUY</button>
          <button className="neon-button flex-1">SELL</button>
          <button className="neon-button flex-1">DUMP</button>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="space-panel">
        <h2 className="retro-title text-lg mb-3">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button className="neon-button">SHIPYARD</button>
          <button className="neon-button">BANK</button>
          <button className="neon-button">EQUIPMENT</button>
          <button className="neon-button">CHARTER</button>
        </div>
      </div>
    </div>
  );
}
