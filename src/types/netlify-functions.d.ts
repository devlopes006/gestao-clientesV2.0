declare module '@netlify/functions' {
  export type Handler = (event: any, context: any) => Promise<any>
}
