import { describe, it, expect } from "vitest";
import { t, type TranslationKey } from "./i18n.tsx";

const EN_KEYS: TranslationKey[] = [
  "app.title",
  "app.unsaved.title",
  "app.unsaved.body",
  "app.unsaved.cancel",
  "app.unsaved.discard",
  "app.unsaved.save",
  "app.toast.opened",
  "app.toast.saved",
  "app.toast.downloaded",
  "app.toast.save_cancelled",
  "app.toast.new_document",
  "app.toast.copied_rich",
  "app.toast.copied_plain",
  "app.toast.copy_failed",
  "app.toast.preview_needed",
  "app.toast.printing",
  "app.toast.font_reset",
  "app.toast.image_added",
  "app.toast.image_pasted",
  "app.toast.theme_saved",
  "app.toast.theme_deleted",
  "app.toast.theme_name_required",
  "app.toast.theme_json_invalid",
  "app.toast.theme_bg_required",
  "app.toast.pdf_not_supported",
  "app.toast.drop_hint",
  "app.about",
  "app.font",
  "toolbar.new",
  "toolbar.open",
  "toolbar.save",
  "toolbar.pdf",
  "toolbar.copy",
  "toolbar.focus",
  "toolbar.undo",
  "toolbar.redo",
  "toolbar.code",
  "toolbar.preview",
  "toolbar.split",
  "toolbar.outline",
  "preview.empty",
  "preview.edit_hint_cancel",
  "preview.edit_hint_save",
  "preview.edit_hint_newline",
  "preview.click_to_edit",
  "settings.title",
  "settings.theme",
  "settings.font",
  "settings.density",
  "settings.display",
  "settings.focus_mode",
  "settings.custom_themes",
  "settings.font_size_down",
  "settings.font_size_up",
  "settings.line_height_down",
  "settings.line_height_up",
  "settings.font_reset",
  "status.lines",
  "status.words",
  "status.chars",
  "focus.exit",
  "drag.drop_hint",
  "palette.view",
  "palette.file",
  "palette.export",
  "palette.edit",
  "palette.font",
  "palette.app",
  "palette.code_view",
  "palette.preview_view",
  "palette.split_view",
  "palette.toggle_focus",
  "palette.toggle_outline",
  "palette.new_file",
  "palette.open_file",
  "palette.save",
  "palette.save_as",
  "palette.export_pdf",
  "palette.copy_rtf",
  "palette.undo",
  "palette.redo",
  "palette.font_inc",
  "palette.font_dec",
  "palette.font_reset",
  "palette.line_inc",
  "palette.line_dec",
  "palette.settings",
  "palette.placeholder",
  "theme.title",
  "theme.no_themes",
  "theme.name_placeholder",
  "theme.json_placeholder",
  "theme.save",
  "theme.delete",
  "code.copy",
  "code.copied",
  "font_sets.title",
  "font_sets.sample",
  "font_sets.embedded",
  "font_sets.system",
  "font_sets.note_literata",
  "font_sets.note_sourceserif4",
  "font_sets.note_lora",
  "font_sets.note_atkinson",
  "font_sets.note_jetbrains_mono",
  "app.storage.error.quota_exceeded",
  "app.storage.error.security",
  "app.storage.error.unavailable",
  "app.storage.error.recoverable",
  "app.storage.error.retry",
  "app.storage.error.retry_success",
  "app.storage.error.retry_failed",
];

describe("i18n", () => {
  it("returns English for 'en' locale", () => {
    expect(t("en", "app.title")).toBe("MD MA");
    expect(t("en", "toolbar.new")).toBe("New");
    expect(t("en", "preview.empty")).toContain("Start writing");
  });

  it("returns Polish for 'pl' locale", () => {
    expect(t("pl", "app.title")).toBe("MD MA");
    expect(t("pl", "toolbar.new")).toBe("Nowy");
    expect(t("pl", "preview.empty")).toContain("Zacznij");
  });

  it("returns key as fallback for unknown key", () => {
    expect(t("en", "unknown.key" as TranslationKey)).toBe("unknown.key");
  });

  it("all English keys have Polish translations", () => {
    for (const key of EN_KEYS) {
      const plVal = t("pl", key);
      expect(plVal).toBeTruthy();
      expect(typeof plVal).toBe("string");
      expect(plVal.length).toBeGreaterThan(0);
    }
  });

  it("EN and PL define the same set of keys", () => {
    const enDefined = new Set(EN_KEYS);
    const plDefined = new Set(EN_KEYS);
    expect(plDefined.size).toBe(enDefined.size);
  });
});
