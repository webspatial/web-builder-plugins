import Plugin from './index'
import { describe, it, expect, beforeEach } from 'vitest'

interface Hook {
  cb?: () => void
  tap: (name: string, cb: () => void) => void
}

function makeHook(): Hook {
  return {
    cb: undefined,
    tap(_name: string, cb: () => void) {
      this.cb = cb
    },
  }
}

interface CompilerLike {
  options: {
    output: { publicPath?: string | undefined; path?: string | undefined }
    resolve: { alias?: Record<string, string> }
    plugins: unknown[]
  }
  hooks: { beforeRun: Hook; beforeCompile: Hook; done: Hook }
}

describe('@webspatial/rspack-plugin', () => {
  let compiler: CompilerLike
  beforeEach(() => {
    compiler = {
      options: {
        output: { publicPath: 'auto', path: 'out' },
        resolve: { alias: {} },
        plugins: [],
      },
      hooks: {
        beforeRun: makeHook(),
        beforeCompile: makeHook(),
        done: makeHook(),
      },
    }
  })

  it('sets publicPath, alias and adds DefinePlugin for avp', () => {
    const plugin = new Plugin({ mode: 'avp' })
    plugin.apply(compiler as unknown as any)

    // Define plugin added immediately
    expect(compiler.options.plugins.length).toBeGreaterThan(0)

    // Trigger beforeRun to apply runtime config mutations
    compiler.hooks.beforeRun.cb?.()
    expect(compiler.options.output.publicPath).toBe('/webspatial/avp')
    expect(compiler.options.resolve.alias?.['@webspatial/react-sdk$']).toBe(
      '@webspatial/react-sdk/default',
    )
  })

  it('uses web aliases and preserves custom base when mode is undefined', () => {
    const plugin = new Plugin()
    // user publicPath set
    compiler.options.output.publicPath = '/site'
    plugin.apply(compiler as unknown as any)
    compiler.hooks.beforeRun.cb?.()
    expect(compiler.options.output.publicPath).toBe('/site')
    expect(compiler.options.resolve.alias?.['@webspatial/react-sdk$']).toBe(
      '@webspatial/react-sdk/web',
    )
  })
})
