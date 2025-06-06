// plugins/webspatial.ts
import type { RsbuildPlugin } from '@rsbuild/core'
import {
  AVP,
  getDefineByMode,
  getDefineXrEnvBase,
  getEnv,
  getFinalBase,
  getFinalOutdir,
  getReactSDKAliasByMode,
  ModeKind,
} from '@webspatial/shared'
export type * from '@webspatial/shared'

interface WebspatialOptions {
  mode?: ModeKind
  outputDir?: string
}

export default function webspatialPlugin(
  options?: WebspatialOptions,
): RsbuildPlugin {
  let { mode = getEnv(), outputDir } = options ?? {}

  return {
    name: 'webspatial-plugin',
    setup(api) {
      // server
      api.modifyRsbuildConfig(config => {
        let userbase = config?.server?.base
        // default is / which is undefined in other build tools
        if (userbase === '/') userbase = undefined
        console.log('🚀 ~ setup ~ userbase:', userbase)

        const finalbase = getFinalBase(userbase, mode, outputDir)
        console.log('🚀 ~ setup ~ finalbase:', finalbase)

        config.server = config.server || {}
        config.dev = config.dev ?? {}
        config.dev.assetPrefix = finalbase

        config.server.base = finalbase
        // alias
        config.resolve = config.resolve ?? {}
        config.resolve.alias = {
          ...config.resolve.alias,
          ...getReactSDKAliasByMode(mode),
        }
        // define
        config.source = config.source || {}
        config.source.define = {
          ...config.source.define,
          ...getDefineByMode(mode),
          ...getDefineXrEnvBase(finalbase),
        }
        // output
        config.output = config.output || {}
        const userOutDir = config.output.distPath?.root
        console.log('🚀 ~ setup ~ userbase:', userbase)

        const assetPrefix = getFinalBase(userbase, mode, outputDir)
        console.log('🚀 ~ setup ~ assetPrefix:', assetPrefix)

        config.output.assetPrefix = assetPrefix
        config.output.distPath = {
          // only affect root dir
          root: getFinalOutdir(userOutDir, mode, outputDir),
        }
        return config
      })
    },
  }
}
