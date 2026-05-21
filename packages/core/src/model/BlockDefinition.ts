import { BlockCategory } from './BlockCategory.js';

export interface PropOption {
  value: string;
  title: string;
  sub?: string;
}

export interface PropSchema {
  key: string;
  label: string;
  /** Handover baseline: text | number | password | select; catalog also uses chips, radio, textarea */
  type: 'text' | 'number' | 'password' | 'select' | 'chips' | 'radio' | 'textarea';
  placeholder?: string;
  required: boolean;
  options?: string[] | PropOption[];
  defaultValue?: string | number;
  /** Plain-English wizard question shown above the field */
  q?: string;
  /** Helper sentence below the question */
  help?: string;
  /** When true, block wizard/config can bind this field to Application properties. */
  linkable?: boolean;
}

export interface BlockDefinition {
  type: string;
  label: string;
  /** One-liner shown under block icon on sidebar */
  short: string;
  category: BlockCategory;
  icon: string;
  /** Which abstract EIP glyph to show in the wizard panel */
  glyph: 'source' | 'filter' | 'transform' | 'split' | 'log' | 'router' | 'destination';
  /** Plain-English explanation shown on step 1 of the wizard */
  explain: string;
  camelComponent: string;
  /** Camel catalog scheme (e.g. kafka, ftp). Omitted for pure EIP actions. */
  scheme?: string;
  camelUri: string;
  description: string;
  props: PropSchema[];
}
