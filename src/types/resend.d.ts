declare module 'resend' {
  export class Resend {
    constructor(apiKey: string)
    emails: {
      send(input: any): Promise<any>
    }
  }
}
