declare module "*.lua?raw" {
  const source: string;
  export default source;
}

declare module "*.css" {
  const css: string;
  export default css;
}
