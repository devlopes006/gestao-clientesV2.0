import { expect } from 'vitest'

// Extend Vitest matchers with custom DOM assertions
expect.extend({
  toBeInTheDocument(received: Element | null) {
    const pass = received !== null && document.body.contains(received)
    return {
      pass,
      message: () =>
        pass
          ? `expected element not to be in the document`
          : `expected element to be in the document`,
    }
  },
})

declare module 'vitest' {
  interface Assertion {
    toBeInTheDocument(): void
  }
  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): void
  }
}
