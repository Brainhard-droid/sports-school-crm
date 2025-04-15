import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

// Определение пути
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Определение режима разработки
const isDev = process.env.NODE_ENV !== "production" || process.env.NODE_ENV === undefined;

// Функция для определения плагинов
const getPlugins = async () => {
  const basePlugins = [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
  ];

  // Добавляем плагины только для режима разработки
  if (isDev && process.env.REPL_ID !== undefined) {
    const cartographer = await import("@replit/vite-plugin-cartographer")
      .then(m => m.cartographer());
    return [...basePlugins, cartographer];
  }

  return basePlugins;
};

// Функция для определения путей
const getPaths = () => ({
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  }
});

// Функция для определения алиасов
const getResolve = () => ({
  alias: {
    "@": path.resolve(__dirname, "client", "src"),
    "@shared": path.resolve(__dirname, "shared"),
  }
});

// Функция для определения серверных настроек
const getServer = () => ({
  hmr: {
    overlay: true,
  },
  watch: {
    usePolling: true,
  },
  fs: {
    strict: false,
  }
});

// Экспортируем конфигурацию Vite
export default defineConfig(async () => ({
  plugins: await getPlugins(),
  resolve: getResolve(),
  ...getPaths(),
  server: getServer(),
  // Форсируем режим разработки, чтобы избежать проблем с обработкой файлов
  mode: 'development',
  // Отключаем оптимизацию, которая может вызывать проблемы
  optimizeDeps: {
    force: true
  },
  // Обеспечиваем корректное кэширование
  cacheDir: '.vite',
}));