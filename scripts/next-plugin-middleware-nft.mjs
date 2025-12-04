 
// Archived: Turbopack is active, this webpack plugin is unused.
// Kept for reference; not included in build.
/**
 * Next.js Plugin to generate middleware.js.nft.json
 * Runs immediately after compilation, before page optimization
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export function withMiddlewareNftWorkaround(nextConfig = {}) {
  return {
    ...nextConfig,
    webpack(config, options) {
      const { isServer, nextRuntime } = options

      // Run default webpack config
      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, options)
      }

      // Only run on server build, after compilation
      if (isServer && !nextRuntime) {
        class MiddlewareNftPlugin {
          apply(compiler) {
            compiler.hooks.afterCompile.tap('MiddlewareNftPlugin', () => {
              const projectRoot = process.cwd()
              const middlewareNftPath = resolve(
                projectRoot,
                '.next/server/middleware.js.nft.json'
              )

              // Skip if already exists
              if (existsSync(middlewareNftPath)) {
                return
              }

              const manifestPath = resolve(
                projectRoot,
                '.next/server/middleware-manifest.json'
              )

              // Skip if manifest doesn't exist yet
              if (!existsSync(manifestPath)) {
                return
              }

              try {
                const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
                const files = new Set()

                for (const config of Object.values(manifest.middleware || {})) {
                  if (config.files) {
                    config.files.forEach((file) => {
                      const relativePath = file.replace(/^server\//, '')
                      files.add(relativePath)
                    })
                  }
                }

                const nftContent = {
                  version: 1,
                  files: [
                    ...Array.from(files),
                    'middleware-manifest.json',
                    'middleware-build-manifest.js',
                  ].filter(Boolean),
                }

                writeFileSync(
                  middlewareNftPath,
                  JSON.stringify(nftContent, null, 2),
                  'utf-8'
                )
                console.log(
                  '[next-plugin] Created middleware.js.nft.json with',
                  nftContent.files.length,
                  'files'
                )
              } catch (error) {
                console.warn(
                  '[next-plugin] Could not generate middleware.js.nft.json:',
                  error.message
                )
              }
            })
          }
        }

        config.plugins.push(new MiddlewareNftPlugin())
      }

      return config
    },
  }
}
