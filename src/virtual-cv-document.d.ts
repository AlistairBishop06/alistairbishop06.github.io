declare module 'virtual:cv-document' {
  interface CvDocument {
    fileName: string;
    size: number;
    url: string;
  }

  const cvDocument: CvDocument | null;
  export default cvDocument;
}
