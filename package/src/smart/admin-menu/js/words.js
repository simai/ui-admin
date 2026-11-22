// The words of sf-admin-menu (standard simai.smart-component 1.3.8 §11): they
// live in lang/<locale>.json, the one source the Studio, the docs and a
// product's SF.language.register read. The menu's three dictionaries -- the
// navigation's, the settings menu's and the counter's -- are made from them
// here, by the key each one has always used, so every word is written once.
import en from "../lang/en.json";
import ru from "../lang/ru.json";
import zh from "../lang/zh.json";
import es from "../lang/es.json";
import pt from "../lang/pt.json";
import de from "../lang/de.json";
import fr from "../lang/fr.json";
import it from "../lang/it.json";
import ja from "../lang/ja.json";
import ko from "../lang/ko.json";
import ar from "../lang/ar.json";

// The registry's eleven languages (owner decision C278, AM-38): each one in
// full, so a page in Arabic or Japanese reads no English word of the menu.
const LANG = {en: en.runtime, ru: ru.runtime, zh: zh.runtime, es: es.runtime, pt: pt.runtime, de: de.runtime, fr: fr.runtime, it: it.runtime, ja: ja.runtime, ko: ko.runtime, ar: ar.runtime};

/** {<dictionary key>: <lang key>} -> {en: {...}, ru: {...}, ...}, as pageText reads a dictionary. */
export function wordsOf(map) {
    return Object.fromEntries(Object.entries(LANG).map(([locale, words]) => [locale, Object.fromEntries(
        Object.entries(map).filter(([, name]) => words[name] !== undefined).map(([key, name]) => [key, words[name]]),
    )]));
}
