# Security Notes

## Known Issues

### XLSX Package Vulnerability (Low Risk)

The `xlsx` package has a known Prototype Pollution vulnerability. However, this presents **minimal risk** for this application because:

1. ✅ **Client-side only**: All processing happens in the browser, not on a server
2. ✅ **User's own data**: Users only process their own files
3. ✅ **No data storage**: No files are stored or shared
4. ✅ **Alternative available**: Users can use CSV format instead of Excel

### Mitigation

- Use CSV format instead of Excel when possible
- Only upload files from trusted sources (your own Cobra statements)
- Keep browser updated for latest security patches

### Future Plans

We're monitoring the xlsx package for security updates and will upgrade as soon as a fix is available.

## Security Best Practices

When using this app:

1. ✅ Only upload your own trading statements
2. ✅ Don't share your statement files with untrusted parties
3. ✅ Use the "Clear All Data" button when done analyzing
4. ✅ Use CSV format for maximum security
5. ✅ Keep your browser updated

## Data Privacy

- **No server uploads**: All file processing happens in your browser
- **No tracking**: No analytics or tracking cookies
- **No storage**: Data is cleared when you refresh or clear
- **Local only**: Your data never leaves your device

## Reporting Security Issues

If you discover a security issue, please email security@yourcompany.com or open a private security advisory on GitHub.

## Regular Updates

We regularly update dependencies to ensure the latest security patches are applied. Check the repository for updates periodically.


