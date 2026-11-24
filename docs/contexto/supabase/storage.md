# Storage

Policies de `storage.objects`/`storage.buckets` em `policies.md`. Contagens em `stats.md`.

| bucket | público | limite por arquivo | mime permitidos | criado em |
|---|---|---|---|---|
| comprovantes-financeiro | não | 20.0 MB | image/jpeg, image/png, image/webp, image/heic, application/pdf | 2026-05-21 17:15:28.357928+00:00 |
| financeiro | não |  |  | 2026-10-22 19:04:17.641651+00:00 |
| nfe-certificados | não | 5.0 MB | application/x-pkcs12, application/octet-stream | 2026-08-25 16:24:12.262487+00:00 |
| nfe-xml | não | 50.0 MB | application/xml, text/xml | 2026-08-25 16:24:12.262487+00:00 |
| notas-fiscais-upload | não |  |  | 2026-11-13 14:47:24.023293+00:00 |
| relatorios-tributarios | não |  |  | 2026-11-13 14:47:24.023293+00:00 |

## Configuração (Management API)

```json
{
  "capabilities": {
    "iceberg_catalog": true,
    "list_v2": true,
    "object_versioning": false
  },
  "external": {
    "upstreamTarget": "main"
  },
  "features": {
    "icebergCatalog": {
      "enabled": true,
      "maxCatalogs": 2,
      "maxNamespaces": 10,
      "maxTables": 10
    },
    "imageTransformation": {
      "enabled": true
    },
    "purgeCache": {
      "enabled": true
    },
    "s3Protocol": {
      "enabled": true
    },
    "vectorBuckets": {
      "enabled": true,
      "maxBuckets": 10,
      "maxIndexes": 5
    }
  },
  "fileSizeLimit": 52428800,
  "migrationVersion": "s3-multipart-uploads-parts-index"
}
```
