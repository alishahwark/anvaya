declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfData = { text: string; numpages: number };
  const parse: (data: Buffer, options?: { pagerender?: (page: unknown) => Promise<string> }) => Promise<PdfData>;
  export default parse;
}
