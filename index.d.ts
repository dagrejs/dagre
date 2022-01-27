import "dagre";

declare module "dagre" {
  interface Constraint {
    high: string;
    low: string;
  }

  interface Options {
    constraints?: Constraint[];
  }

  function layout(g: graphlib.Graph, opts: Options): void;
}

