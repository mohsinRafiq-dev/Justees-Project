This folder contains split modules for product-related logic.

Files:
- utils.js - helper functions (slug, SKU, validation)
- queries.js - read/query operations (getAllProducts, featured, search, analytics)
- crud.js - create/update/delete/get product
- admin.js - categories, sizes, colors administration helpers
- orders.js - basic order operations
- index.js - re-exports all functions to keep legacy imports working

Notes:
- The top-level `src/services/products.service.js` was replaced with a re-export to preserve existing imports.
- If you need to change Firestore server-side timestamps, prefer using `serverTimestamp()` in operations that require server time.
