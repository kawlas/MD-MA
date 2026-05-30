import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';

export type Locale = 'en' | 'pl';

export type TranslationKey = keyof typeof EN;

const EN = {
  // App
  'app.title': 'MD MA',
  'app.unsaved.title': 'Unsaved Changes',
  'app.unsaved.body': 'You have unsaved changes. What would you like to do?',
  'app.unsaved.cancel': 'Cancel',
  'app.unsaved.discard': 'Discard',
  'app.unsaved.save': 'Save',
  'app.toast.opened': 'Opened',
  'app.toast.saved': 'Saved',
  'app.toast.downloaded': 'File downloaded!',
  'app.toast.save_cancelled': 'Save cancelled',
  'app.toast.new_document': 'New document created',
  'app.toast.copied_rich': 'Copied as rich text!',
  'app.toast.copied_plain': 'Copied as plain text',
  'app.toast.copy_failed': 'Copy failed — try manually',
  'app.toast.preview_needed': 'Switch to Preview or Split mode first',
  'app.toast.printing': 'Opening print dialog...',
  'app.toast.font_reset': 'Font reset to defaults',
  'app.toast.image_added': 'Image added',
  'app.toast.image_pasted': 'Image pasted as base64',
  'app.toast.theme_saved': 'Theme saved',
  'app.toast.theme_deleted': 'Theme deleted',
  'app.toast.theme_name_required': 'Theme name is required',
  'app.toast.theme_json_invalid': 'Invalid JSON',
  'app.toast.theme_bg_required': 'Must at minimum define --bg-primary',
  'app.toast.pdf_not_supported': 'PDF files are not supported — this app edits Markdown (.md) files only',
  'app.toast.drop_hint': 'Please drop a .md, .txt, .html, .json, .csv, or image file',
  'app.about': 'MD MA v0.1.0 — a premium Markdown editor',
  'app.font': 'Font',

  // Toolbar
  'toolbar.new': 'New',
  'toolbar.open': 'Open',
  'toolbar.save': 'Save',
  'toolbar.pdf': 'PDF',
  'toolbar.copy': 'Copy',
  'toolbar.focus': 'Focus',
  'toolbar.undo': 'Undo',
  'toolbar.redo': 'Redo',
  'toolbar.code': 'Code',
  'toolbar.preview': 'Preview',
  'toolbar.split': 'Split',
  'toolbar.outline': 'Outline',

  // Preview
  'preview.empty': 'Start writing or drop a .md file to begin...',
  'preview.edit_hint_cancel': 'cancel',
  'preview.edit_hint_save': 'save',
  'preview.edit_hint_newline': 'newline',
  'preview.click_to_edit': 'Click to edit',

  // Settings
  'settings.title': 'Preferences',
  'settings.theme': 'Theme',
  'settings.font': 'Font',
  'settings.density': 'Reading density',
  'settings.display': 'Display',
  'settings.focus_mode': 'Focus mode',
  'settings.custom_themes': 'Custom themes…',
  'settings.font_size_down': 'A-',
  'settings.font_size_up': 'A+',
  'settings.line_height_down': 'Tight',
  'settings.line_height_up': 'Roomy',
  'settings.font_reset': 'Reset',

  // Status bar
  'status.lines': 'lines',
  'status.words': 'words',
  'status.chars': 'chars',

  // Focus mode
  'focus.exit': 'Exit Focus',

  // Drag overlay
  'drag.drop_hint': 'Drop your .md or .txt file here',

  // Command palette
  'palette.view': 'View',
  'palette.file': 'File',
  'palette.export': 'Export',
  'palette.edit': 'Edit',
  'palette.font': 'Font',
  'palette.app': 'App',
  'palette.code_view': 'Code View',
  'palette.preview_view': 'Preview View',
  'palette.split_view': 'Split View',
  'palette.toggle_focus': 'Toggle Focus Mode',
  'palette.toggle_outline': 'Toggle Outline',
  'palette.new_file': 'New File',
  'palette.open_file': 'Open File',
  'palette.save': 'Save',
  'palette.save_as': 'Save As',
  'palette.export_pdf': 'Export PDF',
  'palette.copy_rtf': 'Copy as Rich Text',
  'palette.undo': 'Undo',
  'palette.redo': 'Redo',
  'palette.font_inc': 'Increase Font Size',
  'palette.font_dec': 'Decrease Font Size',
  'palette.font_reset': 'Reset Font',
  'palette.line_inc': 'Increase Line Height',
  'palette.line_dec': 'Decrease Line Height',
  'palette.settings': 'Open Settings',
  'palette.placeholder': 'Search commands…',

  // Theme dialog
  'theme.title': 'Custom Themes',
  'theme.no_themes': 'No custom themes yet.',
  'theme.name_placeholder': 'Theme name (e.g. Monokai)',
  'theme.json_placeholder': '{\n  "--bg-primary": "#1e1e1e",\n  "--bg-secondary": "#252526",\n  "--text-primary": "#d4d4d4",\n  "--accent": "#569cd6"\n}',
  'theme.save': 'Save Theme',
  'theme.delete': 'Delete',

  // Code block copy
  'code.copy': 'Copy',
  'code.copied': 'Copied',

  // File types
  'app.filetype.markdown': 'Markdown',
  'app.filetype.plain_text': 'Plain Text',

  // Misc
  'app.toast.hide_others': 'Hide Others',
  'app.toast.show_all': 'Show All',

  // Font sets
  'font_sets.title': 'Font Sets',
  'font_sets.sample': 'Aa Bb Cc — The quick brown fox jumps over the lazy dog.',
};

const PL: Record<TranslationKey, string> = {
  // App
  'app.title': 'MD MA',
  'app.unsaved.title': 'Niezapisane zmiany',
  'app.unsaved.body': 'Masz niezapisane zmiany. Co chcesz zrobić?',
  'app.unsaved.cancel': 'Anuluj',
  'app.unsaved.discard': 'Odrzuć',
  'app.unsaved.save': 'Zapisz',
  'app.toast.opened': 'Otworzono',
  'app.toast.saved': 'Zapisano',
  'app.toast.downloaded': 'Plik pobrany!',
  'app.toast.save_cancelled': 'Zapis anulowany',
  'app.toast.new_document': 'Utworzono nowy dokument',
  'app.toast.copied_rich': 'Skopiowano jako tekst sformatowany!',
  'app.toast.copied_plain': 'Skopiowano jako czysty tekst',
  'app.toast.copy_failed': 'Kopiowanie nieudane — spróbuj ręcznie',
  'app.toast.preview_needed': 'Przełącz na tryb Podgląd lub Split',
  'app.toast.printing': 'Otwieranie okna drukowania...',
  'app.toast.font_reset': 'Czcionka zresetowana',
  'app.toast.image_added': 'Dodano obraz',
  'app.toast.image_pasted': 'Obraz wklejony jako base64',
  'app.toast.theme_saved': 'Motyw zapisany',
  'app.toast.theme_deleted': 'Motyw usunięty',
  'app.toast.theme_name_required': 'Nazwa motywu jest wymagana',
  'app.toast.theme_json_invalid': 'Nieprawidłowy JSON',
  'app.toast.theme_bg_required': 'Musisz zdefiniować --bg-primary',
  'app.toast.pdf_not_supported': 'Pliki PDF nie są obsługiwane — ta aplikacja edytuje pliki Markdown (.md)',
  'app.toast.drop_hint': 'Przeciągnij plik .md, .txt, .html, .json, .csv lub obraz',
  'app.about': 'MD MA v0.1.0 — zaawansowany edytor Markdown',
  'app.font': 'Czcionka',

  // Toolbar
  'toolbar.new': 'Nowy',
  'toolbar.open': 'Otwórz',
  'toolbar.save': 'Zapisz',
  'toolbar.pdf': 'PDF',
  'toolbar.copy': 'Kopiuj',
  'toolbar.focus': 'Focus',
  'toolbar.undo': 'Cofnij',
  'toolbar.redo': 'Ponów',
  'toolbar.code': 'Kod',
  'toolbar.preview': 'Podgląd',
  'toolbar.split': 'Split',
  'toolbar.outline': 'Spis treści',

  // Preview
  'preview.empty': 'Zacznij pisać lub upuść plik .md...',
  'preview.edit_hint_cancel': 'anuluj',
  'preview.edit_hint_save': 'zapisz',
  'preview.edit_hint_newline': 'nowa linia',
  'preview.click_to_edit': 'Kliknij by edytować',

  // Settings
  'settings.title': 'Preferencje',
  'settings.theme': 'Motyw',
  'settings.font': 'Czcionka',
  'settings.density': 'Gęstość czytania',
  'settings.display': 'Wyświetlanie',
  'settings.focus_mode': 'Tryb focus',
  'settings.custom_themes': 'Własne motywy…',
  'settings.font_size_down': 'A-',
  'settings.font_size_up': 'A+',
  'settings.line_height_down': 'Wąskie',
  'settings.line_height_up': 'Szerokie',
  'settings.font_reset': 'Reset',

  // Status bar
  'status.lines': 'linii',
  'status.words': 'słów',
  'status.chars': 'znaków',

  // Focus mode
  'focus.exit': 'Wyjdź z Focus',

  // Drag overlay
  'drag.drop_hint': 'Upuść plik .md lub .txt tutaj',

  // Command palette
  'palette.view': 'Widok',
  'palette.file': 'Plik',
  'palette.export': 'Eksport',
  'palette.edit': 'Edycja',
  'palette.font': 'Czcionka',
  'palette.app': 'Aplikacja',
  'palette.code_view': 'Widok kodu',
  'palette.preview_view': 'Widok podglądu',
  'palette.split_view': 'Widok podzielony',
  'palette.toggle_focus': 'Przełącz tryb focus',
  'palette.toggle_outline': 'Przełącz spis treści',
  'palette.new_file': 'Nowy plik',
  'palette.open_file': 'Otwórz plik',
  'palette.save': 'Zapisz',
  'palette.save_as': 'Zapisz jako',
  'palette.export_pdf': 'Eksportuj PDF',
  'palette.copy_rtf': 'Kopiuj jako tekst sformatowany',
  'palette.undo': 'Cofnij',
  'palette.redo': 'Ponów',
  'palette.font_inc': 'Zwiększ czcionkę',
  'palette.font_dec': 'Zmniejsz czcionkę',
  'palette.font_reset': 'Resetuj czcionkę',
  'palette.line_inc': 'Zwiększ odstęp',
  'palette.line_dec': 'Zmniejsz odstęp',
  'palette.settings': 'Otwórz ustawienia',
  'palette.placeholder': 'Szukaj poleceń…',

  // Theme dialog
  'theme.title': 'Własne motywy',
  'theme.no_themes': 'Brak własnych motywów.',
  'theme.name_placeholder': 'Nazwa motywu (np. Monokai)',
  'theme.json_placeholder': '{\n  "--bg-primary": "#1e1e1e",\n  "--bg-secondary": "#252526",\n  "--text-primary": "#d4d4d4",\n  "--accent": "#569cd6"\n}',
  'theme.save': 'Zapisz motyw',
  'theme.delete': 'Usuń',

  // Code block copy
  'code.copy': 'Kopiuj',
  'code.copied': 'Skopiowano',

  // File types
  'app.filetype.markdown': 'Markdown',
  'app.filetype.plain_text': 'Zwykły tekst',

  // Misc
  'app.toast.hide_others': 'Ukryj pozostałe',
  'app.toast.show_all': 'Pokaż wszystko',

  // Font sets
  'font_sets.title': 'Zestawy czcionek',
  'font_sets.sample': 'Aa Bb Cc — Szybki brązowy lis przeskakuje nad leniwym psem.',
};

export function t(locale: Locale, key: TranslationKey): string {
  const map = locale === 'pl' ? PL : EN;
  return map[key] ?? EN[key] ?? key;
}

const LOCALE_KEY = 'md-editor-locale';
function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === 'en' || saved === 'pl') return saved;
  } catch { /* ignore */ }
  return navigator.language.startsWith('pl') ? 'pl' : 'en';
}

export const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  _t: (key: TranslationKey) => string;
}>({ locale: 'en', setLocale: () => {}, _t: (k) => t('en', k) });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(getInitialLocale);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(LOCALE_KEY, l); } catch { /* ignore */ }
  }, []);
  const _t = useCallback((key: TranslationKey) => t(locale, key), [locale]);
  return (
    <LocaleContext.Provider value={{ locale, setLocale, _t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useT() {
  return useContext(LocaleContext)._t;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  return { locale: ctx.locale, setLocale: ctx.setLocale };
}
