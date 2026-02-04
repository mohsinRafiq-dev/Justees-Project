This folder contains split modules for storage-related logic.

Files:
- utils.js - helper utilities (compression, validation, naming)
- upload.js - upload helpers (single/multiple uploads)
- delete.js - deletion and moving helpers
- index.js - re-exports all functions to keep legacy imports working

Notes:
- The top-level `src/services/storage.service.js` was replaced with a re-export wrapper for compatibility.
- Keep browser APIs (fetch, canvas) in mind when running storage functions outside the browser (e.g., server-side).