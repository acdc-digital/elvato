# MeiliSearch Dashboard Access

## Built-in Mini Dashboard

MeiliSearch includes a browser-based dashboard for inspecting indexes, browsing documents, and running test searches.

### Enabling the Dashboard

The dashboard is only available when `MEILI_ENV=development`. To enable it:

1. Go to the MeiliSearch service on Railway
2. Change `MEILI_ENV` from `production` to `development`
3. Wait for the service to redeploy

### Accessing the Dashboard

Navigate to your instance URL:

```
https://meilisearch-production-3595.up.railway.app
```

Enter the master key when prompted:

```
m/11cZ+eoKdBIz4JxAsmDOrMhbKfkJpLalFqiGcqav4=
```

### Dashboard Features

- Browse the `products` index and all indexed documents
- Run test searches with filters and sorting
- View index settings (searchable attributes, filterable attributes, etc.)
- Check task queue and indexing status

## Alternative: Hosted Mini Dashboard

If you want to keep `MEILI_ENV=production`, you can use the standalone hosted dashboard:

```
https://meilisearch.github.io/mini-dashboard/
```

Enter your instance URL and master key to connect from your browser.

## Notes

- `development` mode also enables more verbose error messages
- The instance URL is not publicly advertised, so the security risk of development mode is minimal
- If MeiliSearch restarts, you may need to re-sync products before the dashboard shows data
