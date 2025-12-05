import plugin from './index'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DEFAULT_BASE, AVP } from '@webspatial/shared'

describe('@webspatial/vite-plugin default export', () => {
  beforeEach(() => {
    // Each test needs to set process.env.XR_ENV if it expects a value
    delete process.env.XR_ENV
  })

  it('returns three plugins with expected names', () => {
    const plugins = plugin()
    expect(plugins).toHaveLength(3)
    expect(plugins.map(p => p.name)).toEqual([
      'vite-plugin-webspatial-common',
      'vite-plugin-webspatial-serve',
      'vite-plugin-webspatial-build',
    ])
  })

  it('common config sets jsxImportSource for avp mode', () => {
    const plugins = plugin({ mode: 'avp' })
    const common = plugins[0]
    const cfg = common.config({})
    expect(cfg.esbuild?.jsxImportSource).toBe('@webspatial/react-sdk/default')
  })

  it('common config sets jsxImportSource for web mode', () => {
    const plugins = plugin()
    const common = plugins[0]
    const cfg = common.config({})
    expect(cfg.esbuild?.jsxImportSource).toBe('@webspatial/react-sdk/web')
  })

  it('serve config computes base with trailing slash for default base (avp)', () => {
    const plugins = plugin({ mode: 'avp' })
    const serve = plugins[1]
    const cfg = serve.config({})
    expect(cfg.base).toBe(`${DEFAULT_BASE}/`)
    expect(cfg.resolve.alias[0].replacement).toBe(
      '@webspatial/react-sdk/default',
    )
    expect(cfg.build?.outDir).toBe(`dist/${DEFAULT_BASE.slice(1)}`)
    expect(cfg.define['process.env.XR_ENV']).toBe(JSON.stringify(AVP))
    expect(cfg.define.__XR_ENV_BASE__).toBe(JSON.stringify(`${DEFAULT_BASE}/`))
  })

  it('serve config preserves custom base and computes outDir (avp)', () => {
    const plugins = plugin({ mode: 'avp' })
    const serve = plugins[1]
    const userCfg = { base: '/custom/base', build: { outDir: 'out' } }
    const cfg = serve.config(userCfg)
    expect(cfg.base).toBe('/custom/base')
    expect(cfg.build?.outDir).toBe('out/webspatial/avp')
    expect(cfg.resolve.alias[0].replacement).toBe(
      '@webspatial/react-sdk/default',
    )
  })

  it('serve config uses web mode when not avp', () => {
    const plugins = plugin()
    const serve = plugins[1]
    const userCfg = { base: '/site', build: { outDir: 'dist' } }
    const cfg = serve.config(userCfg)
    expect(cfg.base).toBe('/site')
    expect(cfg.resolve.alias[0].replacement).toBe('@webspatial/react-sdk/web')
    expect(cfg.build?.outDir).toBe('dist')
    expect(cfg.define['process.env.XR_ENV']).toBeUndefined()
    expect(cfg.define.__XR_ENV_BASE__).toBe(JSON.stringify('/site'))
  })

  it('serve config handles empty outputDir option for avp', () => {
    const plugins = plugin({ mode: 'avp', outputDir: '' })
    const serve = plugins[1]
    const userCfg = { build: { outDir: 'dist' } }
    const cfg = serve.config(userCfg)
    expect(cfg.base).toBe('')
    expect(cfg.build?.outDir).toBe('dist/')
  })

  it('build config uses mode for base and env for outDir/emptyOutDir', () => {
    const plugins = plugin({ mode: 'avp' })
    const build = plugins[2]
    const userCfg = { base: undefined, build: { outDir: 'dist' } }
    delete process.env.XR_ENV
    const cfg1 = build.config(userCfg, { command: 'build', mode: 'production' })
    expect(cfg1.base).toBe(`${DEFAULT_BASE}/`)
    expect(cfg1.build?.outDir).toBe('dist')
    expect(cfg1.build?.emptyOutDir).toBe(true)
    process.env.XR_ENV = 'avp'
    const cfg2 = build.config(userCfg, { command: 'build', mode: 'production' })
    expect(cfg2.build?.outDir).toBe(`dist/${DEFAULT_BASE.slice(1)}`)
    expect(cfg2.build?.emptyOutDir).toBe(false)
  })

  it('build config uses web mode when mode is undefined', () => {
    const plugins = plugin()
    const build = plugins[2]
    const cfg = build.config(
      { base: '/x', build: { outDir: 'o' } },
      { command: 'build', mode: 'production' },
    )
    expect(cfg.base).toBe('/x')
    expect(cfg.resolve.alias[0].replacement).toBe('@webspatial/react-sdk/web')
  })
})
