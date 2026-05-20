/** Camel YAML DSL route model (plain routes array, Karavan-compatible). */

export interface YamlEndpoint {
  uri: string;
  parameters?: Record<string, string>;
}

export type YamlStep =
  | { to: YamlEndpoint }
  | { filter: { expression: { simple: string } } }
  | { log: { message: string } }
  | { transform: Record<string, string> }
  | { split: Record<string, string> }
  | { unmarshal: Record<string, unknown> }
  | { marshal: Record<string, unknown> };

export interface YamlRouteDefinition {
  route: {
    id: string;
    from: YamlEndpoint & { steps: YamlStep[] };
  };
}
