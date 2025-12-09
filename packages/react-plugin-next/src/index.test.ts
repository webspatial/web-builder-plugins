import withWebspatial from './index'
import { describe, it, expect } from 'vitest'
import type { Configuration as WebpackConfig } from 'webpack'

class FakeDefinePlugin {
  definitions: Record<string, unknown>
  constructor(defs: Record<string, unknown>) {
    this.definitions = defs
  }
}

interface WebpackContext {
  webpack: { DefinePlugin: new (defs: Record<string, unknown>) => unknown }
  dev: boolean
}

describe('@webspatial/next-plugin config', () => {
  it('sets basePath and distDir for avp and augments webpack config', () => {
    const wrap = withWebspatial({ mode: 'avp' })
    const nextCfg = wrap({})

    expect(nextCfg.basePath).toBe('/webspatial/avp')
    expect(nextCfg.distDir).toBe('.next/webspatial/avp')

    const initial: WebpackConfig = {
      name: 'client',
      plugins: [],
      resolve: {},
    }
    const ctx: WebpackContext = {
      webpack: { DefinePlugin: FakeDefinePlugin },
      dev: true,
    }

    const out = nextCfg.webpack(initial, ctx)

    const alias = out.resolve?.alias as Record<string, string>
    expect(alias['@webspatial/react-sdk$']).toBe(
      '@webspatial/react-sdk/default',
    )
    expect(alias['@webspatial/react-sdk/jsx-runtime']).toBe(
      '@webspatial/react-sdk/default/jsx-runtime',
    )

    const added = out.plugins?.filter(p => p instanceof FakeDefinePlugin) ?? []
    expect(added.length).toBe(1)
    const defs = (added[0] as FakeDefinePlugin).definitions
    expect(defs['process.env.XR_ENV']).toBe('"avp"')
    expect(defs['__XR_ENV_BASE__']).toBe('"/webspatial/avp"')

    // Ensure DefinePlugin was added
    expect(out.plugins?.some(p => p instanceof FakeDefinePlugin)).toBe(true)
  })

  it('preserves custom basePath and web aliases in web mode', () => {
    const wrap = withWebspatial()
    const nextCfg = wrap({ basePath: '/site', distDir: 'dist' })
    expect(nextCfg.basePath).toBe('/site')
    expect(nextCfg.distDir).toBe('dist')

    const initial: WebpackConfig = { name: 'client', plugins: [], resolve: {} }
    const ctx: WebpackContext = {
      webpack: { DefinePlugin: FakeDefinePlugin },
      dev: false,
    }

    const out = nextCfg.webpack(initial, ctx)
    const alias = out.resolve?.alias as Record<string, string>
    expect(alias['@webspatial/react-sdk$']).toBe('@webspatial/react-sdk/web')
  })
})
