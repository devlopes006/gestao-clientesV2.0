import { getMaxUploadSizeBytes, getMaxUploadSizeMB } from '@/lib/upload-config'
import { describe, expect, it } from 'vitest'

// Backup original env
const original = process.env.UPLOAD_MAX_SIZE_MB

describe('upload-config', () => {
  it('defaults to 1536MB when unset', () => {
    delete process.env.UPLOAD_MAX_SIZE_MB
    expect(getMaxUploadSizeMB()).toBe(1536)
  })

  it('parses valid numeric value', () => {
    process.env.UPLOAD_MAX_SIZE_MB = '512'
    expect(getMaxUploadSizeMB()).toBe(512)
    expect(getMaxUploadSizeBytes()).toBe(512 * 1024 * 1024)
  })

  it('caps value at 10240MB', () => {
    process.env.UPLOAD_MAX_SIZE_MB = '20000'
    expect(getMaxUploadSizeMB()).toBe(10240)
  })

  it('fallbacks on invalid values', () => {
    process.env.UPLOAD_MAX_SIZE_MB = 'abc'
    expect(getMaxUploadSizeMB()).toBe(1536)
    process.env.UPLOAD_MAX_SIZE_MB = '-5'
    expect(getMaxUploadSizeMB()).toBe(1536)
  })
})

afterAll(() => {
  if (original) process.env.UPLOAD_MAX_SIZE_MB = original
  else delete process.env.UPLOAD_MAX_SIZE_MB
})
