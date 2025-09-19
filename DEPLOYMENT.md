# Deployment Guide

This project is configured to automatically deploy to GitHub Pages when code is pushed to the `main` branch.

## Automatic Deployment

### Setup Required (One-time)

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Select "GitHub Actions" as the source
   - Save the configuration

2. **Repository Settings** (if needed):
   - Ensure the repository is public, or you have GitHub Pro/Team for private repo Pages
   - Verify that GitHub Actions are enabled for the repository

### How It Works

The deployment process uses GitHub Actions (`.github/workflows/deploy.yml`) and runs automatically on every push to `main`:

1. **Build Process**:
   - Installs Node.js 22 and dependencies
   - Runs TypeScript backend tests (1300+ tests)
   - Runs UI component tests (React/Vitest)
   - Performs TypeScript type checking 
   - Builds the React UI for production with correct GitHub Pages paths

2. **Deployment Process**:
   - Uploads the built UI assets to GitHub Pages
   - Makes the site available at `https://[username].github.io/spacetrader-ts-4/`

### Current Build Status

✅ **TypeScript Backend**: Fully tested with 1300+ passing tests  
✅ **UI Tests**: Fixed TypeScript errors and re-enabled in CI  
✅ **Production Build**: Working with Vite handling TypeScript compilation  
✅ **GitHub Pages**: Configured with correct base paths  

**All systems ready for deployment!**  

### Local Development

To run the project locally:

```bash
# Install dependencies
npm ci

# Start development server
npm run dev:ui

# Run backend tests
npm run test:ts

# Build for production (same as CI)
cd ui && npm run build
```

### Project Structure

```
├── .github/workflows/deploy.yml  # GitHub Actions deployment
├── ts/                          # TypeScript game engine (✅ fully tested)
├── ui/                          # React UI (gets deployed)
│   ├── dist/                    # Build output (created by Vite)
│   ├── src/                     # React source code
│   └── vite.config.ts           # Configured for GitHub Pages
└── package.json                 # Workspace scripts
```

### Configuration Details

- **Base Path**: The UI is configured to work with GitHub Pages' subdirectory structure (`/spacetrader-ts-4/`)
- **Build Tool**: Vite with React and TypeScript (handles compilation without separate tsc step)
- **Testing**: Node.js native test runner for TS backend, Vitest for React components
- **Node Version**: 22+ required (uses experimental TypeScript support)

### Troubleshooting

If deployment fails:

1. Check the Actions tab in GitHub for detailed error logs
2. Ensure backend tests pass locally with `cd ts && npm test`
3. Ensure UI tests pass locally with `cd ui && npm run test:run`
4. Verify the build works locally with `cd ui && npm run build`
5. Check that GitHub Pages is enabled in repository settings

### Notes

- The project requires Node.js 22+ locally due to experimental TypeScript support
- GitHub Actions CI uses Node.js 22 automatically 
- All TypeScript type errors have been resolved for both backend and UI
- Full test coverage ensures deployment stability

### Manual Deployment

If needed, you can manually trigger a deployment by pushing to `main` or re-running the failed workflow in the GitHub Actions tab.
