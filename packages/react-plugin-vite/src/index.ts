import { ConfigEnv, UserConfig, mergeConfig, Plugin } from 'vite'
import {
  AVP,
  DEFAULT_BASE,
  getDefineByMode,
  getDefineXrEnvBase,
  getEnv,
  getFinalBase,
  getFinalOutdir,
  getReactSDKAliasReplacementByMode,
} from '@webspatial/shared'
export type * from '@webspatial/shared'
interface WebSpatialOptions {
  // XR_ENV
  mode?: 'avp'

  // base path
  outputDir?: string
}

function getFinalBaseVite(
  ...args: Parameters<typeof getFinalBase>
): ReturnType<typeof getFinalBase> {
  const base = getFinalBase(...args)
  /**
   * Add missing slash to the end of the URL so that relative URLs correctly map to
   * http://localhost:5173/webspatial/avp/image.png for Vite Dev server instead of
   * http://localhost:5173/webspatial/image.png
   **/
  return base === DEFAULT_BASE ? `${base}/` : base
}

export default function (options: WebSpatialOptions = {}) {
  let mode = options?.mode ?? getEnv()
  let outputDir = options?.outputDir
  console.log('🚀 ~ mode:', mode)
  return [
    {
      name: 'vite-plugin-webspatial-common',
      config: (config: UserConfig) => {
        const myConfig = {
          esbuild: {
            jsxImportSource:
              mode === 'avp'
                ? '@webspatial/react-sdk/default'
                : '@webspatial/react-sdk/web',
          },
        } as const
        const finalConfig = mergeConfig(config, myConfig)

        return finalConfig
      },
    },
    {
      name: 'vite-plugin-webspatial-serve',
      apply: 'serve',
      config: (userCfg: UserConfig) => {
        const userBase = userCfg.base
        const finalBase = getFinalBaseVite(userBase, mode, outputDir)
        console.log('🚀 ~ finalBase:', finalBase)
        const userOutDir = userCfg.build?.outDir
        const finalOutdir = getFinalOutdir(userOutDir, mode, outputDir)
        const config = {
          define: {
            // Define environment variables for both Node and browser
            ...getDefineByMode(mode),
            ...getDefineXrEnvBase(finalBase),
          },
          resolve: {
            alias: [getReactSDKAliasReplacementByMode(mode)],
          },
          build: {
            // Set output directory
            outDir: finalOutdir,
          },
          base: finalBase,
        } as const
        console.log('🚀 ~ config:', config)
        return config
      },
    },

    {
      name: 'vite-plugin-webspatial-build',
      apply: 'build',
      config: (config: UserConfig, { command }: ConfigEnv) => {
        const userOutDir = config.build?.outDir
        const xrEnv = getEnv()
        const userBase = config.base
        const finalBase = getFinalBaseVite(userBase, mode, outputDir)
        const finalOutdir = getFinalOutdir(userOutDir, xrEnv, outputDir)

        return {
          base: finalBase,
          resolve: {
            alias: [getReactSDKAliasReplacementByMode(mode)],
          },
          define: {
            // Define environment variables for both Node and browser
            ...getDefineByMode(mode),
            ...getDefineXrEnvBase(finalBase),
          },
          build: {
            // Set output directory
            outDir: finalOutdir,
            // Do not empty the output directory for AVP build
            emptyOutDir: xrEnv !== AVP,
            // Remove custom rollup naming logic; use Vite defaults
          },
        }
      },
    },
  ] as const satisfies Plugin[]
}
