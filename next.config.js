/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuração para Webpack - necessário para pdf.js
  webpack: (config, { isServer }) => {
    // PDF.js canvas alias
    config.resolve.alias.canvas = false;
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
      };
    }

    // Ignorar warnings de módulos opcionais
    config.ignoreWarnings = [
      { module: /node_modules\/tesseract\.js/ },
      { module: /node_modules\/pdfjs-dist/ },
    ];

    return config;
  },

  // REMOVIDO: Headers COOP/COEP que bloqueavam CDN do PDF.js worker
  // Tesseract funciona sem SharedArrayBuffer (mais lento, mas funciona)
};

module.exports = nextConfig;
