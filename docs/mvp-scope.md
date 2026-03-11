# MVP Scope — Index Mapper

## In Scope (Must Have)

### Authentication
- Simple credentials-based auth (NextAuth.js)
- Single admin role for MVP
- Protect all routes

### Client Management
- List clients with search
- Create client (name, domain, niche, notes, active status)
- Edit client
- Archive client (soft delete)

### Project Runs
- List runs per client
- Create new run (name, date, description)
- Run status tracking (draft, processing, classified, in_review, completed)
- Delete run (with confirmation)

### CSV Upload
- Multi-file upload per run
- File type detection via header inspection
- Column mapping with best-effort auto-detection
- Upload progress indication
- File list management per run

### Data Normalization
- URL normalization and deduplication
- Field mapping from common SEO tools
- Record merging across multiple CSVs
- Derived field computation
- Graceful handling of missing columns

### Classification Engine
- Hard rules
- Weighted scoring across 7 dimensions
- Confidence scoring
- Manual review trigger detection
- Page type detection from URL patterns
- Reason generation

### URL Mapping Table
- Paginated server-side table
- Column sorting
- Filters: action bucket, page type, confidence, review flag, indexability
- Quick stats row counts by bucket
- Click to open detail

### URL Detail / Review
- Full signal display
- Scoring breakdown
- Classification result with reasons
- Manual override capability
- Notes field
- Review status tracking

### Summary & Export
- Counts by bucket
- Counts by page type
- Manual review queue count
- Export full mapping as CSV
- Export filtered subset as CSV

### Settings
- View/edit classification weights
- View/edit hard rules
- View/edit manual review triggers
- Default rule config

## Out of Scope (Future)

### Deferred to Post-MVP
- GA4 API integration
- GSC API integration
- Ahrefs/SEMrush API integration
- Screaming Frog API integration
- Real-time crawling
- User roles and permissions
- Audit logging
- Charts and visualizations
- Saved filter presets
- Bulk actions on URL table
- Duplicate content detection via content similarity
- Scheduled re-runs
- Slack/email notifications
- Client portal / external access
- Multi-workspace / agency white-label
