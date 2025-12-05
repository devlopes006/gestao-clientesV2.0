import {
  MessageStatus,
  TemplateCategory,
  WhatsAppMessageType,
  formatPhoneNumber,
  getMessageTypeLabel,
  getStatusLabel,
  isValidPhoneNumber,
} from '@/lib/whatsapp/client'
import {
  NotificationTemplate,
  getAvailableTemplates,
  getTemplateConfig,
} from '@/lib/whatsapp/templates'
import { describe, expect, it } from 'vitest'

describe('WhatsApp Client', () => {
  describe('Message Types', () => {
    it('should have all message types defined', () => {
      expect(WhatsAppMessageType.TEXT).toBe('text')
      expect(WhatsAppMessageType.IMAGE).toBe('image')
      expect(WhatsAppMessageType.DOCUMENT).toBe('document')
      expect(WhatsAppMessageType.AUDIO).toBe('audio')
      expect(WhatsAppMessageType.VIDEO).toBe('video')
      expect(WhatsAppMessageType.TEMPLATE).toBe('template')
    })
  })

  describe('Template Categories', () => {
    it('should have template categories defined', () => {
      expect(TemplateCategory.MARKETING).toBe('MARKETING')
      expect(TemplateCategory.OTP).toBe('OTP')
      expect(TemplateCategory.TRANSACTIONAL).toBe('TRANSACTIONAL')
    })
  })

  describe('Message Status', () => {
    it('should have all status types defined', () => {
      expect(MessageStatus.ACCEPTED).toBe('accepted')
      expect(MessageStatus.PENDING).toBe('pending')
      expect(MessageStatus.SENT).toBe('sent')
      expect(MessageStatus.DELIVERED).toBe('delivered')
      expect(MessageStatus.READ).toBe('read')
      expect(MessageStatus.FAILED).toBe('failed')
    })
  })

  describe('Phone Number Formatting', () => {
    it('should format phone number with country code', () => {
      const formatted = formatPhoneNumber('11999999999')
      expect(formatted).toContain('55')
      expect(formatted).toMatch(/\d+/)
    })

    it('should remove non-numeric characters', () => {
      const formatted = formatPhoneNumber('(11) 99999-9999')
      expect(formatted).toMatch(/^\d+$/)
    })

    it('should not duplicate country code', () => {
      const formatted = formatPhoneNumber('5511999999999')
      expect(formatted).toBe('5511999999999')
    })

    it('should handle different country codes', () => {
      const formatted = formatPhoneNumber('2125552368', '1')
      expect(formatted).toContain('1')
    })
  })

  describe('Phone Number Validation', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhoneNumber('5511999999999')).toBe(true)
      expect(isValidPhoneNumber('11999999999')).toBe(true)
    })

    it('should reject short phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false)
      expect(isValidPhoneNumber('1234567')).toBe(false)
    })

    it('should reject very long phone numbers', () => {
      expect(isValidPhoneNumber('1234567890123456')).toBe(false)
    })

    it('should handle phone numbers with special characters', () => {
      const valid = isValidPhoneNumber('(11) 99999-9999')
      expect(valid).toBe(true)
    })

    it('should have valid range 10-15 digits', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true) // 10 digits
      expect(isValidPhoneNumber('123456789012345')).toBe(true) // 15 digits
      expect(isValidPhoneNumber('12345678901234567')).toBe(false) // 16 digits
    })
  })

  describe('Status Labels', () => {
    it('should return Portuguese labels for status', () => {
      expect(getStatusLabel(MessageStatus.SENT)).toBe('Enviada')
      expect(getStatusLabel(MessageStatus.DELIVERED)).toBe('Entregue')
      expect(getStatusLabel(MessageStatus.READ)).toBe('Lida')
      expect(getStatusLabel(MessageStatus.FAILED)).toBe('Falhou')
    })

    it('should handle pending status', () => {
      expect(getStatusLabel(MessageStatus.PENDING)).toBe('Pendente')
    })

    it('should handle accepted status', () => {
      expect(getStatusLabel(MessageStatus.ACCEPTED)).toBe('Aceita')
    })
  })

  describe('Message Type Labels', () => {
    it('should return Portuguese labels for message types', () => {
      expect(getMessageTypeLabel(WhatsAppMessageType.TEXT)).toBe('Texto')
      expect(getMessageTypeLabel(WhatsAppMessageType.IMAGE)).toBe('Imagem')
      expect(getMessageTypeLabel(WhatsAppMessageType.DOCUMENT)).toBe(
        'Documento'
      )
      expect(getMessageTypeLabel(WhatsAppMessageType.AUDIO)).toBe('Áudio')
      expect(getMessageTypeLabel(WhatsAppMessageType.VIDEO)).toBe('Vídeo')
      expect(getMessageTypeLabel(WhatsAppMessageType.TEMPLATE)).toBe('Template')
    })
  })
})

describe('WhatsApp Templates', () => {
  describe('Notification Templates', () => {
    it('should have all notification templates', () => {
      expect(NotificationTemplate.INVOICE_CREATED).toBe('invoice_created')
      expect(NotificationTemplate.INVOICE_PAID).toBe('invoice_paid')
      expect(NotificationTemplate.INVOICE_OVERDUE).toBe('invoice_overdue')
      expect(NotificationTemplate.PAYMENT_REMINDER).toBe('payment_reminder')
      expect(NotificationTemplate.WELCOME).toBe('welcome')
      expect(NotificationTemplate.PASSWORD_RESET).toBe('password_reset')
      expect(NotificationTemplate.MEETING_REMINDER).toBe('meeting_reminder')
    })

    it('should have 7 templates available', () => {
      expect(Object.values(NotificationTemplate).length).toBe(7)
    })
  })

  describe('Template Configuration', () => {
    it('should get invoice created template config', () => {
      const config = getTemplateConfig(NotificationTemplate.INVOICE_CREATED)
      expect(config.templateName).toBe('invoice_created')
      expect(config.languageCode).toBe('pt_BR')
      expect(config.category).toBe('TRANSACTIONAL')
    })

    it('should get invoice paid template config', () => {
      const config = getTemplateConfig(NotificationTemplate.INVOICE_PAID)
      expect(config.category).toBe('TRANSACTIONAL')
    })

    it('should get payment reminder template config', () => {
      const config = getTemplateConfig(NotificationTemplate.PAYMENT_REMINDER)
      expect(config.category).toBe('MARKETING')
    })

    it('should get welcome template config', () => {
      const config = getTemplateConfig(NotificationTemplate.WELCOME)
      expect(config.templateName).toBe('welcome')
    })

    it('should throw for unknown template', () => {
      expect(() => {
        getTemplateConfig('unknown' as NotificationTemplate)
      }).toThrow()
    })
  })

  describe('Available Templates', () => {
    it('should return all available templates', () => {
      const templates = getAvailableTemplates()
      expect(templates.length).toBe(7)
    })

    it('should include template and config for each', () => {
      const templates = getAvailableTemplates()
      templates.forEach((item) => {
        expect(item.template).toBeDefined()
        expect(item.config).toBeDefined()
        expect(item.config.templateName).toBeDefined()
        expect(item.config.languageCode).toBe('pt_BR')
      })
    })

    it('should have mix of categories', () => {
      const templates = getAvailableTemplates()
      const categories = new Set(templates.map((t) => t.config.category))

      expect(categories.has('TRANSACTIONAL')).toBe(true)
      expect(categories.has('MARKETING')).toBe(true)
      expect(categories.has('OTP')).toBe(true)
    })
  })

  describe('Template Categories Distribution', () => {
    it('should have transactional templates for critical actions', () => {
      const transactional = ['invoice_created', 'invoice_paid']
      transactional.forEach((templateName) => {
        const found = getAvailableTemplates().find((t) =>
          t.config.templateName.includes(templateName)
        )
        expect(found?.config.category).toBe('TRANSACTIONAL')
      })
    })

    it('should have OTP templates for security', () => {
      const config = getTemplateConfig(NotificationTemplate.PASSWORD_RESET)
      expect(config.category).toBe('OTP')
    })

    it('should have marketing templates for promotions', () => {
      const config = getTemplateConfig(NotificationTemplate.PAYMENT_REMINDER)
      expect(config.category).toBe('MARKETING')
    })
  })
})

describe('WhatsApp Integration Patterns', () => {
  it('should support all required message types', () => {
    const types = Object.values(WhatsAppMessageType)
    expect(types.length).toBeGreaterThanOrEqual(5)
    expect(types).toContain('text')
    expect(types).toContain('template')
  })

  it('should have status tracking for all lifecycle stages', () => {
    const statuses = Object.values(MessageStatus)
    expect(statuses.length).toBeGreaterThanOrEqual(4)
    expect(statuses).toContain('sent')
    expect(statuses).toContain('delivered')
    expect(statuses).toContain('failed')
  })

  it('should format phone numbers correctly for API', () => {
    const phone1 = formatPhoneNumber('11 99999-9999', '55')
    const phone2 = formatPhoneNumber('5511999999999')

    expect(phone1).toMatch(/^\d+$/)
    expect(phone2).toMatch(/^\d+$/)
    expect(phone1.length).toBeGreaterThanOrEqual(10)
    expect(phone2.length).toBeGreaterThanOrEqual(10)
  })

  it('should have template for every common notification', () => {
    const templates = getAvailableTemplates()
    const templateNames = templates.map((t) => t.config.templateName)

    expect(templateNames).toContain('invoice_created')
    expect(templateNames).toContain('invoice_paid')
    expect(templateNames).toContain('payment_reminder')
  })
})

describe('WhatsApp Error Handling', () => {
  it('should handle invalid template gracefully', () => {
    expect(() => {
      getTemplateConfig('invalid_template' as NotificationTemplate)
    }).toThrow('Unknown template')
  })

  it('should validate phone numbers before formatting', () => {
    expect(isValidPhoneNumber('')).toBe(false)
    expect(isValidPhoneNumber('abc')).toBe(false)
  })

  it('should consistently format phone numbers', () => {
    const phone = '11999999999'
    const formatted1 = formatPhoneNumber(phone)
    const formatted2 = formatPhoneNumber(phone)

    expect(formatted1).toBe(formatted2)
  })
})
