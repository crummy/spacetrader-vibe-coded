# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

This repository contains the source code for Space Trader 1.2.2, a classic Palm OS space trading game originally written by Pieter Spronck in C. The project appears to be named "spacetrader-ts-4" suggesting it may be part of a TypeScript port or modernization effort.

## Palm Pilot Original Code

The `palm/` directory contains the complete original Palm OS source code written in C with CodeWarrior for Palm. For detailed information about the Palm OS codebase, build process, and architecture, see [AGENTS.palm.md](AGENTS.palm.md).

## Current Development

This is a TypeScript port of the Palm Pilot game Space Trader, currently focusing solely on the backend implementation. The project follows these principles:

- **Modern TypeScript**: Using current TypeScript features and best practices
- **Node.js Backend**: Server-side implementation only (no frontend yet)
- **Functional Programming Style**: Emphasizing functional programming patterns over OOP
- **Heavy Testing**: Comprehensive test coverage using native Node testing tools
- **Lightweight Dependencies**: Minimal external libraries, preferring native Node.js capabilities
- **Native Testing**: Using Node.js built-in test runner and assertion libraries rather than external frameworks

## Environment Setup

- **Node.js Version Management**: This project uses [mise](https://mise.jdx.dev/) to manage Node.js versions
- **Required Node.js Version**: Node.js v22+ (configured in `ts/.mise.toml`)
- **Running Commands**: Use `mise exec --` prefix when running npm scripts if mise environment is not automatically activated

## Development Guidelines

For detailed coding conventions, development practices, and tooling requirements, see [AGENTS.code.md](AGENTS.code.md).