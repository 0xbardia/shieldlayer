# Contributing to ShieldLayer

Thank you for your interest in contributing to ShieldLayer! This document provides guidelines and instructions for contributing.

## Reporting Bugs

1. **Check existing issues** first to avoid duplicates.
2. **Open a new issue** with a clear title and description.
3. **Include steps to reproduce** the bug, expected behavior, and actual behavior.
4. **Add environment details**: OS, Python version, Node.js version, browser.

## Submitting Pull Requests

1. **Fork the repository** and create a branch from `main`.
2. **Make your changes** following the code style guidelines below.
3. **Write or update tests** for any new functionality.
4. **Run the full test suite** before submitting:
   ```bash
   npm run test        # vitest + pytest
   npm run type-check  # TypeScript
   npm run lint        # ESLint
   ```
5. **Open a pull request** with a clear description of what changed and why.

## Code Style

### Python (Smart Contract & API)
- Follow **PEP 8** conventions.
- Use **Black** for formatting: `black contract/ api/ tests/`.
- Add **Google-style docstrings** to all public functions and classes.
- Type hints are encouraged but not required for GenLayer contract code.

### TypeScript / JavaScript (Frontend)
- Follow the existing **ESLint** configuration.
- Use **TypeScript** for all new code.
- Prefer functional components with hooks for React.
- Use **Tailwind CSS** classes for styling.

## Development Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- Redis (optional, for production rate limiting)

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/shieldlayer.git
cd shieldlayer

# Install Python dependencies
python3 -m pip install -r requirements.txt

# Install Node.js dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Run development servers
npm run dev
```

### Running Tests
```bash
# All tests
npm run test

# JavaScript tests only
npm run test:js

# Python tests only
npm run test:py

# Type checking
npm run type-check

# Linting
npm run lint
```

## Architecture

- **`contract/`** — GenLayer smart contract (Python)
- **`api/`** — FastAPI backend (Python)
- **`src/`** — Next.js frontend (TypeScript/React)
- **`scripts/`** — Deployment and utility scripts
- **`tests/`** — Test suites (Python + TypeScript)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

## Questions?

Open an issue or start a discussion on GitHub.
