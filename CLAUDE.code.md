# Coding Conventions

This file contains coding conventions and development practices for the Space Trader TypeScript project.

## Testing

- **Test Framework**: Use `node:test` (Node.js built-in test runner)
- **Test Files**: Place tests alongside source files or in `__tests__` directories
- **Test Coverage**: Aim for comprehensive test coverage of all business logic
- **Test Style**: Write clear, descriptive test names and use Node.js built-in assertions

## Version Control

- **Git Usage**: Use git for all version control
- **Commit Frequency**: Commit after every reasonable chunk of work
- **Commit Messages**: Write clear, descriptive commit messages that explain the "why" not just the "what"
- **Small Commits**: Prefer smaller, focused commits over large monolithic ones

## Module System

- **Import Style**: Use modern ESM imports exclusively
- **File Extensions**: Use `.js` extensions in import statements even when importing TypeScript files
- **No CommonJS**: Avoid `require()` and `module.exports` - use `import`/`export` only

## Runtime and Build

- **Execution**: Run TypeScript directly using `node --experimental-strip-types`
- **No Build Step**: Take advantage of Node.js native TypeScript support to eliminate separate build processes
- **Development Workflow**: Run and develop in the same language without transpilation

## Code Style

- **Functional Programming**: Prefer functional programming patterns over object-oriented approaches
- **Immutability**: Favor immutable data structures and pure functions
- **Type Safety**: Use TypeScript's type system extensively for compile-time safety
- **Minimal Dependencies**: Prefer native Node.js capabilities over external libraries

## Architecture Patterns

### State Management

- **Single State Object**: The entire game state should be stored in a single `State` object containing:
  - Player information (name, credits, reputation, etc.)
  - Ship stats and equipment
  - Galaxy state with all planets and their market prices
  - Current game mode (in space between planets, or docked at a planet)
  - Any other game state that changes during play

### Action Pattern

- **Pure Functions**: All game actions should be implemented as pure functions
- **Action Signature**: Every action takes a `State` parameter plus any additional parameters needed
- **State Updates**: Actions return a new updated `State` object (immutable updates)
- **Available Actions**: Implement a method to list currently available actions based on current state
- **Example**: `BuyShip(state: State, shipId: number): State` - takes current state and ship identifier, returns updated state with new ship

### Static Data

- **Immutable Definitions**: Store static game data (ship types, equipment specs, etc.) as immutable objects
- **Separation of Concerns**: Keep static definitions separate from mutable game state
- **Reference by ID**: Static objects should be referenced by ID/name from the State object

### Testing Strategy

- **Action Testing**: Each action should be thoroughly tested by:
  - Creating sample `State` objects
  - Calling the action with known parameters  
  - Verifying the returned state matches expected changes
- **Pure Function Benefits**: Since actions are pure functions, testing is straightforward and deterministic
- **Regression Prevention**: Run tests regularly between changes to catch any regressions immediately

## Development Principles

### Game Design Fidelity

- **Exact 1:1 Implementation**: Every feature must work exactly the same as the Palm Pilot original
- **Source Code Reference**: When uncertain about any behavior, consult the Palm Pilot C source code in the `palm/` directory
- **No Modifications**: Do not change game mechanics, balance, or behavior from the original
- **Authentic Experience**: The TypeScript version should feel identical to someone who played the original

### Error Handling

- **Input Validation**: Validate all action parameters before processing
- **Graceful Failures**: Invalid actions should return original state with clear error info
- **Type Safety**: Use TypeScript's type system to prevent runtime errors
- **Boundary Checks**: Always validate array indices, credit amounts, cargo space, etc.