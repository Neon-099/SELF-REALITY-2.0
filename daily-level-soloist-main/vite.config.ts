import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { handleApi } from "./src/server/api";

// Custom Vite plugin for API handling
function apiPlugin(): Plugin {
  return {
    name: 'vite-plugin-api',
    configureServer(server) {
      console.log('[Vite Plugin API] Configuring server for API middleware...');
      console.log('[Vite Plugin API] Server will handle /api routes');
      
      server.middlewares.use('/api', (req, res, next) => {
        if (req.url && req.url.startsWith('/')) {
          console.log(`[Vite Plugin API] Request received for: ${req.method} ${req.url}`);
          console.log(`[Vite Plugin API] Full URL: ${req.headers.host}${req.url}`);
          
          handleApi(req, res).catch((err) => {
            console.error('[Vite Plugin API] Error in handleApi:', err);
            console.error('[Vite Plugin API] Error details:', err.message || String(err));
            if (!res.writableEnded) {
              next(err);
            }
          });
        } else {
          next();
        }
      });
      
      // Add a basic health check route directly
      server.middlewares.use('/health', (_req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', message: 'Vite dev server is healthy' }));
      });
      
      console.log('[Vite Plugin API] API middleware configuration complete');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    root: ".",
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        }
      }
    },
    plugins: [
      react(),
      apiPlugin(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Expose environment variables to the client
      '__MONGODB_URI__': JSON.stringify(env.MONGODB_URI),
      '__MONGODB_DB_NAME__': JSON.stringify(env.MONGODB_DB_NAME),
      // For backward compatibility
      'process.env.MONGODB_URI': JSON.stringify(env.MONGODB_URI),
      'process.env.MONGODB_DB_NAME': JSON.stringify(env.MONGODB_DB_NAME)
    }
  };
});
