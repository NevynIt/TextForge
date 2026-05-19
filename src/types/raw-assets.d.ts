declare module "*.lua?raw" {
  const source: string;
  export default source;
}

declare module "*.md?raw" {
  const source: string;
  export default source;
}

declare module "*.itt?raw" {
  const source: string;
  export default source;
}

declare module "*.itm?raw" {
  const source: string;
  export default source;
}

declare module "*.css" {
  const css: string;
  export default css;
}
