import { merge } from 'lodash';
import en from './en.yaml';
import _de from './de.yaml';
import _fr from './fr.yaml';
import _sv from './sv.yaml';
import _nl from './nl.yaml';

// Merge languages with English. This provides English fallbacks to untranslated
// fields without breaking the UI (with blanks)
const de = {};
merge(de, en, _de);
const fr = {};
merge(fr, en, _fr);
const sv = {};
merge(sv, en, _sv);
const nl = {};
merge(nl, en, _nl);

const available = [
  { key: 'en', name: en.name },
  { key: 'de', name: de.name },
  { key: 'fr', name: fr.name },
  { key: 'nl', name: nl.name },
];

export default {
  en,
  de,
  fr,
  sv,
  nl,
  available,
};

export {
  en,
  de,
  fr,
  sv,
  nl,
  available,
};
