import type { CamelCatalogProperty } from '../model/CamelCatalog.js';
import { resolvePropForEmit } from './ConfigRefs.js';
import { getCatalogComponent } from './CatalogRegistry.js';
import { getComponentProperties, type ComponentRole } from './ComponentProperties.js';

const SEPARATORS = ['://', '//', ':', '/', '#'];

export function parseSyntax(syntax: string): string[] {
  let simplified = syntax;
  for (const s of SEPARATORS) simplified = simplified.replaceAll(s, ':');
  return simplified.split(':').filter(Boolean);
}

export function getSyntaxSeparators(syntax: string): string[] {
  const result: string[] = [];
  const parts = parseSyntax(syntax);
  let str = '';
  parts.forEach((part, index) => {
    if (index < parts.length - 1) {
      const next = parts[index + 1];
      if (!next) return;
      const start = syntax.indexOf(part, str.length) + part.length;
      const end = syntax.indexOf(next, start);
      result.push(syntax.substring(start, end));
      str = str + part + syntax.substring(start, end);
    }
  });
  return result;
}

function getPathParamNames(scheme: string): string[] {
  const desc = getCatalogComponent(scheme);
  if (!desc) return [];
  const fromKind = desc.properties.filter((p) => p.kind === 'path').map((p) => p.name);
  if (fromKind.length > 0) return fromKind;
  return parseSyntax(desc.component.syntax).slice(1);
}

export function getUriParts(uri: string, scheme: string): Map<string, string> {
  const result = new Map<string, string>();
  const desc = getCatalogComponent(scheme);
  if (!desc || !uri) return result;

  const name = desc.component.name;

  if (name === 'salesforce') {
    const parts = uri.split(':');
    if (parts.length === 2) {
      result.set('operationName', parts[1] ?? '');
      result.set('topicName', '');
    } else if (parts.length === 3) {
      result.set('operationName', parts[1] ?? '');
      result.set('topicName', parts[2] ?? '');
    }
    return result;
  }

  if (name === 'cxf') {
    const cxfParts = uri.split(':');
    const firstPart = cxfParts[1];
    const secondPart = cxfParts[2];
    if (cxfParts.length === 3 && firstPart === 'bean' && secondPart) {
      result.set('beanId', `${firstPart}:${secondPart}`);
    }
    if (cxfParts.length === 2 && firstPart?.startsWith('//')) {
      result.set('address', firstPart);
    }
    return result;
  }

  if (name === 'jt400') {
    const jt400Parts = uri
      .split('.')
      .join(':')
      .split('/')
      .join(':')
      .split('@')
      .join(':')
      .split(':');
    result.set('userID', jt400Parts[1] ?? '');
    result.set('password', jt400Parts[2] ?? '');
    result.set('systemName', jt400Parts[3] ?? '');
    result.set('objectPath', jt400Parts[4] ?? '');
    result.set('type', jt400Parts[5] ?? '');
    return result;
  }

  const syntax = desc.component.syntax;
  const syntaxParts = parseSyntax(syntax);
  const syntaxSeparators = getSyntaxSeparators(syntax);
  let newUri = uri === name ? `${name}${syntaxSeparators.join('')}` : uri;

  syntaxParts
    .filter((_, i) => i > 0)
    .forEach((part, index) => {
      if (index < syntaxParts.length - 1) {
        const startSeparator = syntaxSeparators[index] ?? '';
        const endSeparator = syntaxSeparators[index + 1];
        const start = newUri.indexOf(startSeparator) + startSeparator.length;
        const end = endSeparator ? newUri.indexOf(endSeparator, start) : newUri.length;
        result.set(part, newUri.substring(start, end));
        newUri = newUri.substring(end);
      }
    });

  return result;
}

export interface EndpointDescriptor {
  uri: string;
  parameters?: Record<string, string>;
}

function parseQueryParams(fullUri: string): Record<string, string> {
  const qIdx = fullUri.indexOf('?');
  if (qIdx < 0) return {};
  const out: Record<string, string> = {};
  for (const pair of fullUri.slice(qIdx + 1).split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const key = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);
    const val = decodeURIComponent(eq >= 0 ? pair.slice(eq + 1) : '');
    if (key) out[key] = val;
  }
  return out;
}

/** Split a built endpoint URI into scheme + parameters (Karavan-style YAML DSL). */
export function splitEndpointUri(fullUri: string, scheme: string): EndpointDescriptor {
  if (!fullUri) return { uri: scheme };

  const pathParts = getUriParts(fullUri.split('?')[0] ?? fullUri, scheme);
  const parameters: Record<string, string> = {};
  for (const [k, v] of pathParts) {
    if (v !== undefined && v !== '') parameters[k] = v;
  }
  Object.assign(parameters, parseQueryParams(fullUri));

  const schemeOnly = scheme || fullUri.split(':')[0]?.split('?')[0] || fullUri;
  const hasComplexPath = fullUri.includes('://') || fullUri.includes('@');

  if (Object.keys(parameters).length === 0 || hasComplexPath) {
    return { uri: fullUri };
  }

  return { uri: schemeOnly, parameters };
}

function appendQuery(
  uri: string,
  props: Record<string, string>,
  catalogProps: CamelCatalogProperty[],
  pathNames: Set<string>
): string {
  const params: string[] = [];
  for (const p of catalogProps) {
    if (pathNames.has(p.name) || p.kind === 'path') continue;
    const val = resolvePropForEmit(props[p.name]);
    if (!val) continue;
    params.push(`${p.name}=${encodeURIComponent(val)}`);
  }
  if (params.length === 0) return uri;
  return uri + (uri.includes('?') ? '&' : '?') + params.join('&');
}

export function buildUriFromCatalog(
  scheme: string,
  role: ComponentRole,
  props: Record<string, string>
): string {
  const desc = getCatalogComponent(scheme);
  if (!desc) return '';

  const parts = parseSyntax(desc.component.syntax);
  const separators = getSyntaxSeparators(desc.component.syntax);
  const pathNames = new Set(getPathParamNames(scheme));

  let uri = parts[0] ?? scheme;
  for (let i = 1; i < parts.length; i++) {
    const param = parts[i];
    if (!param) return '';
    const val = resolvePropForEmit(props[param]);
    if (!val) return '';
    uri += (separators[i - 1] ?? ':') + val;
  }

  return appendQuery(uri, props, getComponentProperties(scheme, role), pathNames);
}
