# Source inbox

Place manually downloaded official PDFs or HTML files here. Do not put secrets in this directory. For a file named `document.pdf`, an optional `document.pdf.json` sidecar can contain:

```json
{
  "originalUrl": "https://example.gov.in/document.pdf",
  "publisher": "Issuing government institution",
  "publishedDate": "2025-11-13",
  "policySlug": "dpdp-act-2023",
  "title": "Exact document title",
  "sourceType": "Gazette notification"
}
```

Run `npm run data:import:files`. The importer records the URL and metadata, SHA-256 file hash, extracted text, page references, extraction quality, and a review item for possible legal events. It never verifies or changes a legislative status by itself. A human must review the extracted text and use the approval workflow.
