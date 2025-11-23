import { isAllowedMimeType, mimeRejectionReason } from '@/lib/storage'
import { describe, expect, it } from 'vitest'

describe('mime type validation', () => {
  it('allows common image types', () => {
    expect(isAllowedMimeType('image/jpeg')).toBe(true)
    expect(isAllowedMimeType('image/png')).toBe(true)
    expect(isAllowedMimeType('image/webp')).toBe(true)
  })

  it('allows video, audio, text and pdf', () => {
    expect(isAllowedMimeType('video/mp4')).toBe(true)
    expect(isAllowedMimeType('audio/mpeg')).toBe(true)
    expect(isAllowedMimeType('text/plain')).toBe(true)
    expect(isAllowedMimeType('application/pdf')).toBe(true)
  })

  it('allows application/octet-stream as generic binary', () => {
    expect(isAllowedMimeType('application/octet-stream')).toBe(true)
  })

  it('blocks dangerous executable mimetypes', () => {
    expect(isAllowedMimeType('application/x-msdownload')).toBe(false)
    expect(mimeRejectionReason('application/x-msdownload')).toBe('blocked')
  })

  it('marks unknown application types as unsupported', () => {
    expect(isAllowedMimeType('application/x-php')).toBe(false)
    expect(mimeRejectionReason('application/x-php')).toBe('unsupported')
  })

  it('returns null reason for allowed types', () => {
    expect(mimeRejectionReason('image/jpeg')).toBeNull()
  })
})
