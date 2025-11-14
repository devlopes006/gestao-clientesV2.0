import { ImageResponse } from 'next/og'

// Metadados da imagem
export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

// Gerador de ícone
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '20%',
        }}
      >
        M
      </div>
    ),
    {
      ...size,
    }
  )
}
