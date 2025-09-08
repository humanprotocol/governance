declare module '@lingui/cli/api/extractors/babel' {
  const extractor: {
    match(filename: string): boolean;
    extract(filename: string, code: string, ...options: any[]): any;
  };
  export default extractor;
}