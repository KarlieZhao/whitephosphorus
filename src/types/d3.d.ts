declare module 'd3' {
    const d3: any;
    export = d3;
  }
  
declare module "d3-textwrap" {
  export function textwrap(): {
    width(width: number): any;
    text(text: string): any;
  };
}