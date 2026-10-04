# DAM Asset Selector for Kevel Ads

## Overview

This Edge extension helps upload and select assets for Kevel Ad Modals, integrating with AEM DAM and auto-filling modal fields.

## Getting Started

### 1. Clone or Download

Download or clone this repository to your local machine.

### 2. Load Extension in Edge

1. Open Edge and go to `Edge://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the folder containing your extension files (`assets-selector.js`, `content.js`, `manifest.json`, `popup.html`, `popup.js`).

### 3. Usage

- Navigate to a page with a Kevel Ad Modal.
- Open the extension popup.
- Follow instructions to select and upload assets.

### 4. Development

- Edit files as needed.
- Reload the extension in Edge after changes.

## Files

- `manifest.json`: Edge extension manifest.
- `content.js`: Content script for interacting with web pages.
- `popup.html`: Extension popup UI.
- `popup.js`: Popup logic.
- `assets-selector.js`: Asset selector plugin.

## Requirements

- Edge browser
- Access to AEM DAM instance

## Troubleshooting

- If the extension doesn’t work, ensure the Kevel Ad Modal is open on the page.
- Refresh the page and reopen the extension if you see errors.

## License

MIT
