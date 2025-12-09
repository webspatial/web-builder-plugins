import webspatialPlugin from './index'
import { describe, it, expect } from 'vitest'
import type { RsbuildConfigLike, RsbuildApiLike } from './index'

describe('@webspatial/rsbuild-plugin', () => {
  it('modifies rsbuild config for avp mode', () => {
    const plugin = webspatialPlugin({ mode: 'avp' })

    const cfg: RsbuildConfigLike = {}
    const api: RsbuildApiLike = {
      modifyRsbuildConfig(cb) {
        const out = cb(cfg)
        Object.assign(cfg, out)
      },
    }

    if (plugin.setup) plugin.setup(api)

    expect(cfg.server?.base).toBe('/webspatial/avp')
    expect(cfg.dev?.assetPrefix).toBe('/webspatial/avp')
    expect(cfg.output?.assetPrefix).toBe('/webspatial/avp')
    expect(cfg.output?.distPath?.root).toBe('dist/webspatial/avp')
    const aliasVal = cfg.resolve?.alias
    expect(aliasVal && JSON.stringify(aliasVal)).toContain(
      '"@webspatial/react-sdk$":"@webspatial/react-sdk/default"',
    )
    expect(cfg.source?.define?.['process.env.XR_ENV']).toBe('"avp"')
    expect(cfg.source?.define?.['__XR_ENV_BASE__']).toBe('"/webspatial/avp"')
  })

  it('uses web mode when mode is undefined', () => {
    const plugin = webspatialPlugin()
    const cfg: RsbuildConfigLike = {
      server: { base: '/site' },
      output: { distPath: { root: 'dist' } },
    }
    const api: RsbuildApiLike = {
      modifyRsbuildConfig(cb) {
        const out = cb(cfg)
        Object.assign(cfg, out)
      },
    }
    if (plugin.setup) plugin.setup(api)
    expect(cfg.server?.base).toBe('/site')
    const aliasVal = cfg.resolve?.alias
    expect(aliasVal && JSON.stringify(aliasVal)).toContain(
      '"@webspatial/react-sdk$":"@webspatial/react-sdk/web"',
    )
    expect(cfg.output?.distPath?.root).toBe('dist')
  })
})
