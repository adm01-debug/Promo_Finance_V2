# ⚡ Guia de Performance - Finance-Hub

## Objetivos

- **Bundle JS:** < 500 KB
- **Bundle CSS:** < 100 KB
- **FCP:** < 1.5s
- **LCP:** < 2.5s
- **FID:** < 100ms
- **CLS:** < 0.1
- **TTFB:** < 200ms

---

## 1. Code Splitting

### Route-based Splitting
```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ContasPagar = lazy(() => import('./pages/ContasPagar'));
const ContasReceber = lazy(() => import('./pages/ContasReceber'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contas-pagar" element={<ContasPagar />} />
        <Route path="/contas-receber" element={<ContasReceber />} />
      </Routes>
    </Suspense>
  );
}
```

### Component-based Splitting
```typescript
// Heavy components
const Chart = lazy(() => import('./components/Chart'));
const PDFViewer = lazy(() => import('./components/PDFViewer'));

<Suspense fallback={<Skeleton />}>
  <Chart data={data} />
</Suspense>
```

---

## 2. Tree Shaking

### Vite Config
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
```

### Import Specific
```typescript
// ❌ BAD
import _ from 'lodash';

// ✅ GOOD
import debounce from 'lodash/debounce';
```

---

## 3. Memoization

### React.memo
```typescript
export const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});
```

### useMemo
```typescript
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]);
```

### useCallback
```typescript
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

---

## 4. Virtualização

### React Window
```typescript
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

## 5. Image Optimization

### Lazy Loading
```tsx
<img src="image.jpg" loading="lazy" alt="Description" />
```

### Modern Formats
```tsx
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <source srcSet="image.avif" type="image/avif" />
  <img src="image.jpg" alt="Fallback" />
</picture>
```

---

## 6. PWA Optimization

### Service Worker (Workbox)
```javascript
// public/sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Background sync
const bgSyncPlugin = new BackgroundSyncPlugin('apiQueue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 hours
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/write'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  })
);
```

---

## 7. Prefetching

### Link Prefetch
```typescript
export function usePrefetchRoutes() {
  useEffect(() => {
    // Prefetch common routes
    import('./pages/ContasPagar');
    import('./pages/ContasReceber');
  }, []);
}
```

---

## 8. Debouncing & Throttling

```typescript
import { debounce } from 'lodash';

const handleSearch = debounce((query: string) => {
  // Expensive search operation
}, 300);
```

---

## 9. Web Vitals Monitoring

```typescript
// src/lib/vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
  });
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/analytics', body);
  } else {
    fetch('/analytics', {
      body,
      method: 'POST',
      keepalive: true,
    });
  }
}

export function initVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

---

## Checklist

### Bundle
- [ ] Code splitting implementado
- [ ] Tree shaking configurado
- [ ] Dependências não usadas removidas
- [ ] JS < 500 KB
- [ ] CSS < 100 KB

### Runtime
- [ ] React.memo em componentes pesados
- [ ] useMemo para cálculos
- [ ] useCallback para funções
- [ ] Virtualização em listas longas

### Assets
- [ ] Imagens otimizadas (WebP/AVIF)
- [ ] Lazy loading de imagens
- [ ] Fontes otimizadas

### Caching
- [ ] Service Worker configurado
- [ ] Cache strategy definida
- [ ] Background sync

### Monitoring
- [ ] Web Vitals configurado
- [ ] Performance marks
- [ ] Error tracking

---

**Meta:** 95+ no Lighthouse Performance
