# CRM для клиник — Windows desktop (Electron)
Loads the hosted CRM (`CRM_URL` env overrides). Single instance, persistent session (`persist:crm`), native notifications via `window.crmDesktop.notify(title, body)`, external links open in the default browser, offline page with retry.

Build on Linux (no wine needed):
```
npm ci
npx electron-builder --win dir --x64          # dist/win-unpacked (afterPack.js sets icon/version via resedit)
NSISDIR=<ebc>/nsis/nsis-3.0.4.1 <ebc>/nsis/nsis-3.0.4.1/linux/makensis installer.nsi   # dist/CRM-for-clinics-Setup-1.0.0.exe
```
(`<ebc>` = electron-builder cache, e.g. ~/.cache/electron-builder.) Installer is unsigned → SmartScreen warning.
