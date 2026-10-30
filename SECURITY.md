# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in Plotwise Kit, please do not open a public issue. Instead, report it privately via GitHub Security Advisories or by contacting the maintainer.

## Security Architecture

1. **Client-Side Execution**: Plotwise Kit performs all GeoJSON parsing and validation locally in the user's browser runtime. No files are uploaded to remote servers or analytics endpoints.
2. **Formula Injection Defense**: CSV inventory export neutralizes spreadsheet formula execution by prepending a single apostrophe (`'`) to any cell beginning with `=`, `+`, `-`, `@`, `\t`, or `\r`.
3. **Harmless Text Rendering**: Custom metadata properties and parcel labels are rendered strictly as escaped text, preventing HTML or script tag injection (XSS).
4. **Bounded Input Resources**: Input sizes, feature counts, and vertex limits are validated before complex geometry processing.
