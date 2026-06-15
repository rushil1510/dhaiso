# Contributing to Dhaiso

Thank you for contributing to Dhaiso! To ensure a consistent codebase and smooth collaboration, please follow these guidelines.

---

## Code of Conduct

- Maintain a professional and respectful environment.
- Focus on constructive feedback and collaboration.
- Respect all contributors and maintainers.

---

## Getting Started

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/yourusername/dhaiso.git
   cd dhaiso
   ```

2. **Branching**:
   Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install Dependencies**:
   ```bash
   # Frontend
   cd client && npm install

   # Backend
   cd ../server && npm install
   ```

4. **Run Development Servers**:
   Refer to the [README](README.md) for local setup instructions.

---

## Coding Standards

### TypeScript
- **Strict Typing**: Avoid using `any`. Define explicit interfaces and types for all variables, parameters, and function returns.
- **Shared Contracts**: Ensure any additions to the websocket event payloads are updated in the `types.ts` file on both the frontend and backend.

### React Components
- **Structure**: Write functional components using TypeScript definitions.
- **Prop Types**: Declare prop interfaces explicitly.

### Naming Conventions
- **Components**: PascalCase (e.g., `GameTable.tsx`).
- **Functions & Variables**: camelCase (e.g., `handlePlayCard`).
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PLAYERS`).
- **Files**: Filenames must match the main exported symbol or component.

---

## Verification Checklist

Before opening a pull request, verify that all changes pass the following local checks:

```bash
# Type check the frontend and backend
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit

# Verify production builds succeed
cd client && npm run build
cd server && npm run build
```

---

## Commit Messages

This repository follows the Conventional Commits specification:

```
<type>(<scope>): <description>
```

### Common Types:
- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `docs`: Documentation changes.
- `style`: Formatting, missing semi-colons, etc. (no production code changes).
- `refactor`: Code restructuring that neither fixes a bug nor adds a feature.
- `test`: Adding or correcting tests.

### Example:
```bash
feat(client): add visual indicators for secret teammate cards
fix(server): resolve race condition in player turn incrementation
```

---

## Pull Request Process

1. Rebase your branch against the latest `main` branch.
2. Push your changes to your fork.
3. Open a Pull Request with:
   - A clear description of the problem solved or the feature introduced.
   - Summaries of the visual or architectural changes.
   - Details of how you tested the changes.
