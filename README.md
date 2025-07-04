# R2 Bucket File Explorer

A simple, beautiful file explorer for Cloudflare R2 buckets built with SvelteKit. This is a static website that can be hosted on GitHub Pages or any static hosting service.

## 🚀 Live Demo

**[Try the Live Demo →](https://freehuntx.github.io/r2-bucket-ui)**

## Features

- 📁 **File Browser**: Navigate through folders and files in your R2 bucket
- 🔼 **Upload Files**: Drag and drop or select multiple files to upload
- 📥 **Download Files**: Download files directly from your bucket
- 👁️ **Preview**: Preview images and other supported file types
- 🗑️ **Delete Files**: Remove unwanted files from your bucket
- 🔐 **Secure**: Credentials are stored locally in your browser
- 📱 **Responsive**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- A Cloudflare R2 bucket
- R2 API credentials (Access Key ID and Secret Access Key)

### Setup R2 Credentials

1. Log in to your Cloudflare dashboard
2. Navigate to R2 Object Storage
3. Go to "Manage R2 API Tokens"
4. Create a new API token with R2 permissions
5. Note down your:
   - Access Key ID
   - Secret Access Key
   - Your account's R2 endpoint URL (usually `https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com`)
   - Your bucket name

### Development

1. Clone this repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Start the development server:
   ```bash
   bun run dev
   ```
4. Open your browser and navigate to the local development URL
5. Enter your R2 credentials to start exploring your bucket

### Building for Production

To create a production build:

```bash
bun run build
```

The built files will be in the `build` directory, ready to be deployed to any static hosting service.

### Deploying to GitHub Pages

1. Build the project: `bun run build`
2. Deploy the `build` directory to GitHub Pages
3. Or use GitHub Actions to automatically build and deploy

## Security Notes

- Your R2 credentials are stored only in your browser's local storage
- Credentials are never sent to any external servers except directly to your R2 bucket
- This is a client-side only application with no backend server
- Make sure your R2 API token has only the necessary permissions

## Browser Compatibility

This application uses modern web APIs and requires a recent browser version. It has been tested on:
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
