// The types for the host the page and the conformance runner share. The module
// itself is plain JavaScript so both can import it without a build step between
// them; this says what it offers.
export type PropertyViewAnswer = {
  answer: 'applied' | 'conflict' | 'refused' | 'unavailable';
  [key: string]: unknown;
};

export type PropertyViewHost = {
  version: string;
  capabilities: string[];
  raise(intent: string, payload?: Record<string, unknown>): Promise<PropertyViewAnswer>;
};

export declare const RECORD: Record<string, unknown>;

export declare function createPropertyViewHost(options?: {
  record?: Record<string, unknown>;
  capabilities?: string[];
}): PropertyViewHost;
