import nodemailer from 'nodemailer'

export interface SmtpOptions {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

const smtpOptions: SmtpOptions = {
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'false' ? false : true,
  user: process.env.SMTP_USER!,
  pass: process.env.SMTP_PASS!,
  from: process.env.SMTP_FROM!,
}

const transporter = nodemailer.createTransport({
  host: smtpOptions.host,
  port: smtpOptions.port,
  secure: smtpOptions.secure,
  auth: {
    user: smtpOptions.user,
    pass: smtpOptions.pass,
  },
})

export async function sendSmtpMail({
  to,
  subject,
  html,
  text,
  from,
}: {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}) {
  return transporter.sendMail({
    from: from || smtpOptions.from,
    to,
    subject,
    html,
    text,
  })
}
