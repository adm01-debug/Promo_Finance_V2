# Guia de Testes

## Tipos de Testes

### Unit Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
bun test:e2e
bun test:e2e:ui
```
Os testes ponta a ponta estão localizados em `tests/` e cobrem fluxos críticos:
- `auth-flow.spec.ts`: Login, Logout, proteção de rotas e navegação.
- `visual-regression.spec.ts`: Testes de regressão visual em diferentes viewports.


### Integration Tests
```bash
npm run test:integration
```

## Cobertura Mínima

- Unit: 80%
- E2E: Critical paths
- Integration: Main flows

## Writing Tests

### Hooks
```typescript
import { renderHook } from '@testing-library/react';

it('should work', () => {
  const { result } = renderHook(() => useMyHook());
  expect(result.current).toBeDefined();
});
```

### Components
```typescript
import { render, screen } from '@testing-library/react';

it('should render', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## CI/CD

Tests run automatically on:
- Every commit
- Every PR
- Before deploy
