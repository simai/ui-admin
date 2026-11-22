import {wordsOf} from "../words.js";

// A row's counter (simai/ui-source#12): a number capped at 99+, nothing at 0,
// the digits hidden from assistive technology and the phrase («8
// непрочитанных») in the row's name. A word that is not a number is a dot,
// the word in the name. The menu draws it itself, with no data-count for the
// Framework's badge runtime to keep: each bundle that names the badges unit
// boots its own copy of that runtime, and on a count whose phrase it joins to
// an aria-label the copies took each other's names for the author's and the
// page never settled (2026-10-21). Moved here from the items menu's template,
// which went with the items path (AM-7).
const COUNTER_CAP = 99;
const COUNTER_TEXT = wordsOf({
  count: "count",
  dot: "dot",
});
const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"];

function pageLocale() {
  return String(document.documentElement?.lang || "en").toLowerCase().split("-")[0];
}

function countPhrase(count) {
  // The Framework's own phrase when its badge runtime is on the page (it knows
  // the languages registered with SF.language); the same words otherwise.
  try {
    const phrase = globalThis.SF?.AnchoredBadge?.state?.({count}, document.documentElement)?.phrase;
    if (phrase) return phrase;
  } catch {
    // The menu's own words below.
  }
  const locale = pageLocale();
  const forms = (COUNTER_TEXT[locale] || COUNTER_TEXT.en).count.split("|");
  let form = forms[forms.length - 1];
  try {
    const rules = new Intl.PluralRules(locale);
    const has = new Set(rules.resolvedOptions().pluralCategories);
    const index = PLURAL_CATEGORIES.filter((category) => has.has(category)).indexOf(rules.select(count));
    form = forms[Math.min(Math.max(index, 0), forms.length - 1)];
  } catch {
    // The last form.
  }
  return form.replaceAll("{count}", String(count));
}

/**
 * What a counter shows and says: null when it shows nothing (empty, 0 or
 * less); else {dot, text, phrase} -- `text` the figures drawn (capped), empty
 * for a dot; `phrase` what joins the name.
 */
export function counterOf(value, dotPhrase = "") {
  const source = String(value ?? "").trim();
  if (!source) return null;
  const number = Number(source);
  if (Number.isFinite(number)) {
    const count = Math.trunc(number);
    if (count <= 0) return null;
    return {dot: false, text: count > COUNTER_CAP ? `${COUNTER_CAP}+` : String(count), phrase: countPhrase(count)};
  }
  return {dot: true, text: "", phrase: dotPhrase || source};
}

/** A name with a counter's phrase after it: «Входящие, 8 непрочитанных». */
export function nameWithCounter(name, counter) {
  const words = String(name ?? "").trim();
  if (!counter?.phrase) return words;
  return words ? `${words}, ${counter.phrase}` : counter.phrase;
}

/** The dot phrase of the page language, for a dot that names nothing. */
export function dotPhrase() {
    return (COUNTER_TEXT[pageLocale()] || COUNTER_TEXT.en).dot;
}
