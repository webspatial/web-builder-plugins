import webspatialPlugin from './index'
import { describe, it, expect } from 'vitest'

type Dict = Record<string, string | undefined>

interface RsConfig {
  server?: { base?: string }
  dev?: { assetPrefix?: string }
  resolve?: { alias?: Record<string, string> }
  source?: { define?: Dict }
  output?: {
    distPath?: { root?: string }
    assetPrefix?: string
  }
}

interface API {
  modifyRsbuildConfig: (cb: (cfg: RsConfig) => RsConfig) => void
}

describe('@webspatial/rsbuild-plugin', () => {
  it('modifies rsbuild config for avp mode', () => {
    const plugin = webspatialPlugin({ mode: 'avp' })

    const cfg: RsConfig = {}
    const api: API = {
      modifyRsbuildConfig(cb) {
        const out = cb(cfg)
        Object.assign(cfg, out)
      },
    }

    plugin.setup!(api as any)

    expect(cfg.server?.base).toBe('/webspatial/avp')
    expect(cfg.dev?.assetPrefix).toBe('/webspatial/avp')
    expect(cfg.output?.assetPrefix).toBe('/webspatial/avp')
    expect(cfg.output?.distPath?.root).toBe('dist/webspatial/avp')
    expect(cfg.resolve?.alias?.['@webspatial/react-sdk$']).toBe(
      '@webspatial/react-sdk/default',
    )
    expect(cfg.source?.define?.['process.env.XR_ENV']).toBe('"avp"')
    expect(cfg.source?.define?.['__XR_ENV_BASE__']).toBe('"/webspatial/avp"')
  })

  it('uses web mode when mode is undefined', () => {
    const plugin = webspatialPlugin()
    const cfg: RsConfig = {
      server: { base: '/site' },
      output: { distPath: { root: 'dist' } },
    }
    const api: API = {
      modifyRsbuildConfig(cb) {
        const out = cb(cfg)
        Object.assign(cfg, out)
      },
    }
    plugin.setup!(api as any)
    expect(cfg.server?.base).toBe('/site')
    expect(cfg.resolve?.alias?.['@webspatial/react-sdk$']).toBe(
      '@webspatial/react-sdk/web',
    )
    expect(cfg.output?.distPath?.root).toBe('dist')
  })
})
