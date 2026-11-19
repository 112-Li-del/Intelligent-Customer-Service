import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const requireFromMedusa = createRequire(require.resolve("@medusajs/medusa/package.json"))
const dashboardRoot = dirname(require.resolve("@medusajs/dashboard/package.json"))
const reactQueryRoot = dirname(require.resolve("@tanstack/react-query/package.json"))

module.exports = defineConfig({
  admin: {
    vite: () => ({
      plugins: [{
        name: "laicai-admin-locale",
        transformIndexHtml: {
          order: "pre",
          handler: () => [{
            tag: "script",
            injectTo: "head-prepend",
            children: `
              try {
                const initialized = "laicai-admin-locale-initialized"
                if (!localStorage.getItem(initialized)) {
                  document.cookie = "lng=zhCN; Path=/; SameSite=Lax"
                  localStorage.setItem("lng", "zhCN")
                  localStorage.setItem(initialized, "1")
                }
              } catch {}
            `,
          }],
        },
      }],
      resolve: {
        alias: {
          // The generated admin entry imports Cloud from the app, but pnpm links it under Medusa.
          "@medusajs/cloud/admin": requireFromMedusa.resolve("@medusajs/cloud/admin"),
          // Cloud's CommonJS entry must share the dashboard's ESM permission context.
          "@medusajs/dashboard/hooks": join(dashboardRoot, "dist/hooks.mjs"),
          "@tanstack/react-query": join(reactQueryRoot, "build/modern/index.js"),
        },
      },
    }),
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  }
})
