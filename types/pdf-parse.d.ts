declare module "pdf-parse" {
  type PdfData = { text: string; numpages: number };
  const parse: (data: Buffer, options?: { pagerender?: (page: unknown) => Promise<string> }) => Promise<PdfData>;
  export default parse;
}
