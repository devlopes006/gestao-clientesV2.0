// Helper para limite máximo de upload configurável via env
// UPLOAD_MAX_SIZE_MB: número (em MB). Default 1536 (1.5GB)
// Limite superior de proteção: 10240 MB (10GB)
export function getMaxUploadSizeMB(): number {
  const raw = process.env.UPLOAD_MAX_SIZE_MB
  const parsed = raw ? parseFloat(raw) : 1536
  if (isNaN(parsed) || parsed <= 0) return 1536
  return Math.min(parsed, 10240)
}

export function getMaxUploadSizeBytes(): number {
  return getMaxUploadSizeMB() * 1024 * 1024
}
