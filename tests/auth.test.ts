import { expect, test } from 'bun:test'
import { Hono } from 'hono'
import {
  appOrigin,
  authMode,
  currentUser,
  getAuth,
  requireUser,
} from '../src/worker/auth'
import type { AppContext, Env } from '../src/worker/env'

const request = new Request('http://localhost:5173/')

test('only an entirely unconfigured loopback preview gets a development user', async () => {
  expect(authMode({}, request)).toBe('development')
  expect(await currentUser({}, request)).toMatchObject({ sub: 'dev-user' })
  expect(authMode({}, new Request('https://app.example.test/'))).toBe('off')
  for (const env of [
    { APP_ORIGIN: 'https://app.example.test' },
    { FREEBUFF_CLIENT_ID: 'test-client' },
  ]) {
    expect(authMode(env, request)).toBe('off')
    expect(await currentUser(env, request)).toBeNull()
    expect(getAuth(env)).toBeNull()
  }
})

test('configured auth uses the canonical origin and reuses its SDK instance', () => {
  const env = {
    FREEBUFF_CLIENT_ID: 'test-client',
    APP_ORIGIN: 'https://app.example.test',
  }
  expect(appOrigin(env, new Request('https://other.example/'))).toBe(
    'https://app.example.test',
  )
  expect(getAuth(env)).toBe(getAuth(env))
  expect(appOrigin({}, new Request('https://other.example/'))).toBeNull()
})

test('private routes refuse anonymous and foreign-origin requests without caching them', async () => {
  const app = new Hono<AppContext>()
  app.use('*', requireUser)
  app.all('*', (c) => c.json({ user: c.get('user').sub }))
  const anonymous = await app.request(
    'https://app.example.test/private',
    {},
    {} as Env,
  )
  expect(anonymous.status).toBe(401)
  expect(anonymous.headers.get('Cache-Control')).toBe('private, no-store')
  for (const origin of ['https://foreign.example', '']) {
    const response = await app.request(
      'http://localhost:5173/private',
      { method: 'POST', headers: { Origin: origin } },
      {} as Env,
    )
    expect(response.status).toBe(403)
  }
  const own = await app.request(
    'http://localhost:5173/private',
    { method: 'POST', headers: { Origin: 'http://localhost:5173' } },
    {} as Env,
  )
  expect(own.status).toBe(200)
})
