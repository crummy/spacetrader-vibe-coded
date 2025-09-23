# Space Trader Port ✨ 100% Vibe Coded

A faithful TypeScript port of the classic Palm OS space trading game **Space Trader 1.2.2** by Pieter Spronck. This project recreates the complete gameplay experience with pixel-perfect Palm Pilot styling, comprehensive test coverage, and modern web technologies.

![Space Trader](https://img.shields.io/badge/Space%20Trader-Palm%20OS%20Port-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-1,434%20passing-brightgreen?style=flat-square)
![Vibe Coded](https://img.shields.io/badge/✨%20100%25%20Vibe%20Coded-purple?style=flat-square)

## 🚀 What is Space Trader?

Space Trader is a beloved space trading and combat game originally created for the Palm Pilot platform. Players take on the role of a space trader, navigating between solar systems, buying and selling goods, engaging in combat with pirates and police, and completing various quests to build wealth and reputation in the galaxy.

## 🎯 Project Purpose

This project aims to preserve and modernize the classic Space Trader experience by:

- **Faithful Recreation**: Complete 1:1 port of all game mechanics, encounters, and systems from the original Palm OS version
- **Modern Technology**: Built with TypeScript, React, and modern web technologies while maintaining the retro Palm Pilot aesthetic
- **Comprehensive Testing**: Over 1,400 tests ensuring accuracy and reliability
- **Web Accessibility**: Playable in any modern web browser without requiring Palm OS emulation

## 🤖 LLM-Driven Development Approach

This entire project was developed using an **LLM-driven "vibe coding" approach**, leveraging AI assistance to:

### Code Generation & Analysis
- **Systematic Palm OS Analysis**: AI-driven examination of the original C source code to understand game mechanics
- **TypeScript Port Generation**: Automated conversion of Palm OS logic to modern TypeScript with functional programming patterns
- **Test-Driven Development**: AI-generated comprehensive test suites covering all game systems

### Quality Assurance
- **Palm OS Compliance Testing**: Automated verification that TypeScript behavior matches original Palm OS logic
- **Integration Testing**: AI-designed tests ensuring seamless interaction between game systems
- **Regression Prevention**: Continuous validation of game mechanics against Palm OS reference implementation

### Architecture & Design
- **Functional Programming**: AI-guided transformation from OOP C code to functional TypeScript patterns
- **Modern Web Standards**: Leveraging AI knowledge of current best practices in React, TypeScript, and web development
- **Performance Optimization**: AI-assisted optimization of game loops, state management, and rendering

The result is a codebase that combines the precision of the original Palm OS implementation with modern development practices and comprehensive testing.

## 🏗️ Architecture & Design

### Monorepo Structure
```
spacetrader-ts-4/
├── ts/                 # Core TypeScript game engine
│   ├── combat/         # Combat and encounter systems
│   ├── economy/        # Trading and pricing mechanics  
│   ├── engine/         # Core game engine and state management
│   ├── trading/        # Market and orbital trading systems
│   └── travel/         # Navigation and warp mechanics
├── ui/                 # React frontend with Palm Pilot styling
│   ├── src/components/ # React components
│   └── src/styles/     # Tailwind CSS with retro Palm styling
└── palm/               # Original Palm OS source code (reference)
```

### Key Design Principles

**🎯 Faithful Port**: Every system matches the original Palm OS behavior exactly, verified through comprehensive testing

**🧪 Test-Driven**: Over 1,400 tests covering game mechanics, edge cases, and Palm OS compliance

**⚡ Functional Programming**: Modern TypeScript patterns emphasizing immutability and pure functions

**🎨 Retro Aesthetics**: Pixel-perfect recreation of the Palm Pilot interface using Tailwind CSS

**🔧 Modern Tools**: Built with current web technologies while preserving classic gameplay

## 🚀 Getting Started

### Prerequisites

- **Node.js 22+** (managed via [mise](https://mise.jdx.dev/))
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/crummy/spacetrader-vibe-coded.git
   cd spacetrader-vibe-coded
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests** (verify everything works)
   ```bash
   npm test
   ```

### Development

#### Start the UI Development Server
```bash
npm run dev:ui
```
Visit `http://localhost:5173` to play the game in your browser.

#### Run TypeScript Game Engine
```bash
cd ts
npm run dev
```

#### Run All Tests
```bash
npm test                    # Run all tests
npm run test:parallel       # Run tests in parallel
npm run test:watch          # Watch mode for development
```

#### Build for Production
```bash
npm run build              # Build both TypeScript and UI
npm run build:ui           # Build just the UI
npm run build:ts           # Build just the TypeScript
```

### Testing & Quality

#### TypeScript Tests
```bash
cd ts
npm test                   # Run game engine tests
npm run check              # TypeScript type checking
```

#### UI Tests  
```bash
cd ui
npm test                   # Run React component tests
npm run build              # Verify UI builds correctly
```

## 🎮 Game Features

### Complete Palm OS Feature Set
- **Trading System**: Buy and sell goods across 150+ solar systems
- **Combat Encounters**: Fight pirates, police, aliens, and space monsters
- **Quest System**: Complete story missions and special events
- **Ship Upgrades**: Customize your ship with weapons, shields, and gadgets
- **Economic Simulation**: Dynamic pricing based on government types and events
- **Reputation System**: Build relationships with various factions
- **Random Events**: Encounters with famous captains and mysterious artifacts

### Modern Enhancements
- **Web-Based**: No emulation required - runs in any modern browser
- **Responsive Design**: Optimized for desktop and mobile devices
- **Save System**: Local storage with import/export capabilities
- **Intelligent Bot**: AI trader for automated gameplay testing

## 📊 Project Stats

- **Lines of Code**: ~15,000+ TypeScript
- **Test Coverage**: 1,434 passing tests
- **Game Systems**: 20+ interconnected modules
- **Palm OS Compliance**: 100% behavior match verified
- **Development Time**: ~3 months of LLM-assisted coding

## 🤝 Contributing

This project demonstrates the power of LLM-assisted development. While contributions are welcome, the current codebase represents a complete and faithful port of the original game.

### Development Guidelines
- All changes must maintain Palm OS compliance
- New features require comprehensive test coverage
- Follow the existing functional programming patterns
- Maintain the retro Palm Pilot aesthetic

## 📜 License

This project is licensed under the GPL-2.0 License, matching the original Space Trader license.

## 🙏 Credits

- **Original Game**: Space Trader 1.2.2 by **Pieter Spronck**
- **TypeScript Port**: **Malcolm Crum**
- **Development Approach**: 100% LLM-assisted "vibe coding"

## 🔗 Links

- [Original Space Trader](http://www.spronck.net/spacetrader/) by Pieter Spronck
- [Palm OS Source Code](./palm/) (included in this repository)
- [Live Demo](https://your-deployment-url.com) *(coming soon)*

---

*Built with ❤️ and AI assistance - preserving classic gaming history for the modern web.*
