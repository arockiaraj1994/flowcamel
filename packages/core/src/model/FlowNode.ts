export interface FlowNode {
  id: string;
  blockType: string;
  label: string;
  /** Optional short description shown under label on the canvas node */
  subtitle?: string;
  position: { x: number; y: number };
  props: Record<string, string>;
}
