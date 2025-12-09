import { DefinePlugin } from '@rspack/core'
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
import path from 'node:path'

export interface WebSpatialOptions {
  mode?: ModeKind
  outputDir?: string
}

export interface RspackHook {
  tap: (name: string, cb: () => void) => void
}

export interface RspackCompilerLike {
  options: {
    output: {
      publicPath?: string | undefined | 'auto'
      path?: string | undefined
    }
    resolve?: { alias?: Record<string, string> }
    plugins?: unknown[]
    devServer?: { port?: number }
    clean?: boolean
  }
  hooks: { beforeRun: RspackHook; beforeCompile: RspackHook; done: RspackHook }
}

export default class WebSpatialRspackPlugin {
  private options: WebSpatialOptions
  constructor(options: WebSpatialOptions = {}) {
    this.options = options
  }

  apply(compiler: RspackCompilerLike) {
    const mode = this.options.mode ?? getEnv()
    const outputDir = this.options.outputDir
    console.log('[WebSpatialRspackPlugin] mode:', mode)

    let userBase = compiler.options.output.publicPath
    if (userBase === 'auto') {
      userBase = undefined
    }

    const finalBase = getFinalBase(userBase, mode, outputDir) ?? ''
    console.log('[WebSpatialRspackPlugin] finalBase:', finalBase)
    const userOutDir = compiler.options.output?.path
    const finalOutdir = path.resolve(
      getFinalOutdir(userOutDir, mode, outputDir),
    )
    console.log('[WebSpatialRspackPlugin] finalOutdir:', finalOutdir)

    // DefinePlugin
    compiler.options.plugins = compiler.options.plugins || []
    compiler.options.plugins.push(
      new DefinePlugin({
        ...getDefineByMode(mode),
        ...getDefineXrEnvBase(finalBase),
      }),
    )

    // run
    compiler.hooks.beforeRun.tap('WebSpatialRspackPlugin', () => {
      // set publicPath
      if (compiler.options.output) {
        compiler.options.output.publicPath = finalBase
      } else {
        compiler.options.output = { publicPath: finalBase }
      }

      // set alias
      compiler.options.resolve = compiler.options.resolve || {}
      compiler.options.resolve.alias = {
        ...compiler.options.resolve.alias,
        ...getReactSDKAliasByMode(mode),
      }
    })

    // build
    compiler.hooks.beforeCompile.tap('WebSpatialRspackPluginBuild', () => {
      // set output publicPath and dist path
      if (compiler.options.output) {
        compiler.options.output.publicPath = finalBase
        compiler.options.output.path = finalOutdir
      }

      // set alias
      compiler.options.resolve = compiler.options.resolve || {}
      compiler.options.resolve.alias = {
        ...compiler.options.resolve.alias,
        ...getReactSDKAliasByMode(mode),
      }

      // clean dist when web version
      compiler.options.clean = mode !== AVP
    })

    compiler.hooks.done.tap('WebSpatialRspackPlugin', () => {
      // only run when devServer up
      if (process.env.WEBPACK_SERVE) {
        // get devServer port, fallback to 8080
        const port = compiler.options.devServer?.port ?? 8080
        console.log(
          `\n [WebSpatialRspackPlugin]  service running: http://localhost:${port}${finalBase}\n`,
        )
      }
    })
  }
}
