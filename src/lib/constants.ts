// Shared constants. Bracketed legal placeholders should be filled before launch.
export const CONSENT_VERSION = '2026-06-08';

export const LEGAL = {
  entity: '[LEGAL ENTITY NAME]',
  address: '[ADDRESS], Madrid, Spain',
  privacyEmail: '[PRIVACY EMAIL]',
  supportEmail: '[SUPPORT EMAIL]',
  contactEmail: '[EMAIL]',
  hostingRegion: '[REGION]',
  inactivePeriod: '[PERIOD]',
  jurisdiction: '[JURISDICTION]',
  effectiveDate: '[DATE]',
};

export const ROLES = ['Head chef', 'Sole chef', 'Sous chef', 'Freelance', 'Other'];
export const VESSEL_TYPES: { value: string; label: string }[] = [
  { value: 'motor', label: 'Motor' },
  { value: 'sail', label: 'Sail' },
  { value: 'catamaran', label: 'Catamaran' },
  { value: 'other', label: 'Other' },
];
export const USAGE_TYPES: { value: string; label: string }[] = [
  { value: 'charter', label: 'Charter' },
  { value: 'private', label: 'Private' },
  { value: 'both', label: 'Both' },
  { value: 'other', label: 'Other' },
];
