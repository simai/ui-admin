// The types of the polygon's host and of the dataset it answers over.
//
// This file is also the written contract for a consumer: Larena is meant to be
// able to serve `PolygonDataset` from its own backend and keep the answers, so
// what the dataset holds and what each property type's value looks like belongs
// somewhere a reader can check rather than in a page.
//
// The module itself is plain JavaScript so the page, the conformance runner and
// the checks import the same file with no build step between them.

/** Every property type the Framework's renderer set draws. */
export type PolygonPropertyType =
  | 'string' | 'text' | 'integer' | 'number' | 'date' | 'datetime' | 'boolean'
  | 'choice' | 'choices' | 'user' | 'record' | 'relation' | 'file' | 'color' | 'include';

export type PolygonOption = { value: string; label: string; scheme?: string; icon?: string };

/** What a reference value carries: enough to show it and to follow it. */
export type PolygonReference = { value: string; label: string; href?: string; avatarText?: string };

export type PolygonFile = {
  value: string;
  label: string;
  mime: string;
  size?: number;
  href?: string;
};

export type PolygonField = {
  key: string;
  label: string;
  property_type: PolygonPropertyType;
  width?: 'half' | 'full';
  required?: boolean;
  readonly?: boolean;
  /** choice and choices read their labels from here. */
  options?: PolygonOption[];
  /** `image`, `image-card` or `image-list` makes a file field show the image. */
  variant?: string;
  /** An include field's language, the host's to say and never guessed. */
  language?: string;
  multiple?: boolean;
  inheritedValue?: string;
};

export type PolygonColumn = {
  key: string;
  width?: string;
  sortable?: boolean;
  pinned?: boolean;
  visible?: boolean;
  align?: 'start' | 'end';
};

export type PolygonGroup = { key: string; label: string; columns?: number; fields: string[] };
export type PolygonSection = { key: string; label: string; groups: PolygonGroup[] };

export type PolygonStructure = {
  structure_id: string;
  label: string;
  fields: PolygonField[];
  sections: PolygonSection[];
  list: {
    columns: PolygonColumn[];
    per_page: number;
    filter_fields: string[];
    sort_fields: string[];
    default_sort?: { field: string; direction: 'asc' | 'desc' };
  };
  interaction: { create: boolean; update: boolean; delete: boolean; restore: boolean };
};

export type PolygonRecord = {
  record_id: string;
  revision: number;
  label: string;
  editable?: boolean;
  actions?: string[];
  values: Record<string, unknown>;
};

export type PolygonDataset = {
  schema: string;
  structure: PolygonStructure;
  references: {
    sections: PolygonReference[];
    users: PolygonReference[];
    relations: PolygonReference[];
    statuses: PolygonOption[];
    tags: PolygonOption[];
    files: PolygonFile[];
  };
  records: PolygonRecord[];
};

export type PolygonAnswer = {
  answer: 'applied' | 'conflict' | 'refused' | 'unavailable';
  [key: string]: unknown;
};

export type PolygonPort = {
  version: string;
  capabilities: string[];
  raise(intent: string, payload?: Record<string, unknown>): Promise<PolygonAnswer>;
};

export type PolygonHost = PolygonPort & {
  /** The structure the list and the panel both read. */
  structure: PolygonStructure;
  /** The records as they now are, after whatever has been saved or deleted. */
  readonly records: PolygonRecord[];
  /** The record panel's port, over the same records the list is reading. */
  propertyView(options?: { capabilities?: string[] }): PolygonPort;
};

/** What the host can be made to answer like, so the hard states are reachable. */
export type PolygonScenario = 'default' | 'empty' | 'forbidden' | 'unavailable';

export declare function createPolygonHost(options: {
  dataset: PolygonDataset;
  capabilities?: string[];
  scenario?: PolygonScenario;
  latencyMs?: number;
}): PolygonHost;
