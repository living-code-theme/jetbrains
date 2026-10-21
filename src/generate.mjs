// This port owns its application mappings. Inputs come only from the pinned local palette.
import { ANSI_ORDER } from '../scripts/palette.mjs';

function attrXml(name, a) {
  if (a.base) return `    <option name="${name}" baseAttributes="${a.base}" />`;
  const o = [];
  if (a.fg) o.push(["FOREGROUND", x(a.fg)]);
  if (a.bg) o.push(["BACKGROUND", x(a.bg)]);
  if (a.font != null) o.push(["FONT_TYPE", a.font]);
  if (a.fx) o.push(["EFFECT_COLOR", x(a.fx[1])], ["EFFECT_TYPE", a.fx[0]]);
  if (a.stripe) o.push(["ERROR_STRIPE_COLOR", x(a.stripe)]);
  return [`    <option name="${name}">`, "      <value>", ...o.map(([k, v]) => `        <option name="${k}" value="${v}" />`), "      </value>", "    </option>"].join("\n");
}

const x = (hex) => hex.replace("#", "");

const xmlEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const DOTTED = 5;

const BOX = 0;

const STRIKE = 3;

const UNDERLINE = 1;

const WAVE = 2;

const FONT = { bold: 1, italic: 2 };

function editorScheme(f) {
  const r = f.r, c = f.c;
  // Soft backgrounds: the editor ground mixed toward a role color.
  const tint = (role, t) => f.mix("bg", role, t);
  const font = (role) => FONT[f.styles[role]] ?? 0;
  // Syntax attribute for a role, with that role's font style (italic comments, italic parameters, ...).
  const syn = (role, extra = {}) => ({ fg: r(role), font: font(role), ...extra });
  const bgOnly = (bg, extra = {}) => ({ bg, ...extra });

  const colors = {
    CARET_COLOR: r("cursor"),
    CARET_ROW_COLOR: r("lineHighlight"),
    SELECTION_BACKGROUND: r("selection"),
    SELECTION_BACKGROUND_INACTIVE: f.mix("bg", "selection", 0.6),
    // Empty keeps the syntax color under a selection. The light parent scheme would otherwise force white text.
    SELECTION_FOREGROUND: "",
    GUTTER_BACKGROUND: r("bg"),
    LINE_NUMBERS_COLOR: r("lineNumber"),
    LINE_NUMBER_ON_CARET_ROW_COLOR: r("lineNumberActive"),
    ANNOTATIONS_COLOR: r("fgSubtle"),
    ANNOTATIONS_LAST_COMMIT_COLOR: r("fgAlt"),
    INDENT_GUIDE: r("border"),
    SELECTED_INDENT_GUIDE: c("surface2"),
    VISUAL_INDENT_GUIDE: r("lineHighlight"),
    STRING_CONTENT_INDENT_GUIDE: tint("string", 0.35),
    WHITESPACES: f.mix("bg", "lineNumber", 0.55),
    RIGHT_MARGIN_COLOR: r("border"),
    METHOD_SEPARATORS_COLOR: r("border"),
    TEARLINE_COLOR: r("border"),
    SELECTED_TEARLINE_COLOR: r("lineNumber"),
    SOFT_WRAP_SIGN_COLOR: r("lineNumber"),
    GRID_STRIPE_COLOR: r("bgAlt"),
    FOLDED_TEXT_BORDER_COLOR: r("border"),
    RECENT_LOCATIONS_SELECTION: r("lineHighlight"),
    READONLY_FRAGMENT_BACKGROUND: "",
    DOCUMENTATION_COLOR: r("bgAlt"),
    LOOKUP_COLOR: r("bgAlt"),
    NOTIFICATION_BACKGROUND: r("bgAlt"),
    PROMOTION_PANE: r("bgAlt"),
    INFORMATION_HINT: r("bgAlt"),
    QUESTION_HINT: r("bgAlt"),
    ERROR_HINT: f.mix("bgAlt", "error", 0.18),
    DOC_COMMENT_GUIDE: r("border"),
    DOC_COMMENT_LINK: r("link"),
    CONSOLE_BACKGROUND_KEY: r("bg"),
    DIFF_SEPARATORS_BACKGROUND: r("bgAlt"),
    DIFF_SEPARATOR_WAVE: r("border"),
    MODIFIED_TAB_ICON: r("modified"),
    // Gutter change markers and VCS annotations.
    ADDED_LINES_COLOR: r("added"),
    MODIFIED_LINES_COLOR: r("modified"),
    DELETED_LINES_COLOR: r("removed"),
    WHITESPACES_MODIFIED_LINES_COLOR: tint("modified", 0.45),
    IGNORED_ADDED_LINES_BORDER_COLOR: tint("added", 0.5),
    IGNORED_MODIFIED_LINES_BORDER_COLOR: tint("modified", 0.5),
    IGNORED_DELETED_LINES_BORDER_COLOR: tint("removed", 0.5),
    VCS_ANNOTATIONS_COLOR_1: tint("info", 0.55),
    VCS_ANNOTATIONS_COLOR_2: tint("info", 0.42),
    VCS_ANNOTATIONS_COLOR_3: tint("info", 0.3),
    VCS_ANNOTATIONS_COLOR_4: tint("info", 0.2),
    VCS_ANNOTATIONS_COLOR_5: tint("info", 0.1),
    // Project view and VCS file status colors.
    FILESTATUS_ADDED: r("added"),
    FILESTATUS_COPIED: r("added"),
    FILESTATUS_addedOutside: r("added"),
    FILESTATUS_MODIFIED: r("modified"),
    FILESTATUS_modifiedOutside: r("modified"),
    FILESTATUS_NOT_CHANGED_IMMEDIATE: r("modified"),
    FILESTATUS_NOT_CHANGED_RECURSIVE: r("modified"),
    FILESTATUS_RENAMED: r("info"),
    FILESTATUS_DELETED: r("fgSubtle"),
    FILESTATUS_IDEA_FILESTATUS_DELETED_FROM_FILE_SYSTEM: r("fgSubtle"),
    FILESTATUS_IDEA_FILESTATUS_IGNORED: r("lineNumber"),
    FILESTATUS_MERGED: r("decorator"),
    FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_CONFLICTS: r("error"),
    FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_BOTH_CONFLICTS: r("error"),
    FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_PROPERTY_CONFLICTS: r("error"),
    FILESTATUS_changelistConflict: r("error"),
    FILESTATUS_UNKNOWN: r("error"),
  };
  // Scrollbar thumbs, one set per platform flavor of the IDE scrollbar.
  for (const p of ["", "Transparent.", "Mac.", "Mac.Transparent."]) {
    colors[`ScrollBar.${p}thumbColor`] = alpha(c("surface2"), 0.55);
    colors[`ScrollBar.${p}thumbBorderColor`] = alpha(c("surface2"), 0.55);
    colors[`ScrollBar.${p}hoverThumbColor`] = alpha(c("surface2"), 0.9);
    colors[`ScrollBar.${p}hoverThumbBorderColor`] = alpha(c("surface2"), 0.9);
  }

  const rainbow = ["steel", "orchid", "amber", "moss", "copper"];
  const ansiKeys = ["BLACK", "RED", "GREEN", "YELLOW", "BLUE", "MAGENTA", "CYAN", "GRAY"];
  const brightKeys = ["DARKGRAY", "RED_BRIGHT", "GREEN_BRIGHT", "YELLOW_BRIGHT", "BLUE_BRIGHT", "MAGENTA_BRIGHT", "CYAN_BRIGHT", "WHITE"];
  // The IDE names ANSI white "gray" and bright white "white"; bright black is "darkgray".
  const ansi = [
    ...ANSI_ORDER.map((_, i) => [ansiKeys[i] + "_OUTPUT", f.ansi.normal[i]]),
    ...ANSI_ORDER.map((_, i) => [brightKeys[i] + "_OUTPUT", f.ansi.bright[i]]),
  ].map(([k, col]) => [`CONSOLE_${k}`, { fg: col, bg: col, font: 0 }]);

  const attributes = [
    // Base text
    ["TEXT", { fg: r("fg"), bg: r("bg") }],
    ["DEFAULT_IDENTIFIER", syn("variable")],
    ["DEFAULT_TEMPLATE_LANGUAGE_COLOR", bgOnly(r("bgAlt"))],

    // Comments and docs
    ["DEFAULT_LINE_COMMENT", syn("comment")],
    ["DEFAULT_BLOCK_COMMENT", syn("comment")],
    ["DEFAULT_DOC_COMMENT", syn("comment")],
    ["DEFAULT_DOC_COMMENT_TAG", { fg: r("fgMuted"), font: 0 }],
    ["DEFAULT_DOC_COMMENT_TAG_VALUE", syn("parameter")],
    ["DEFAULT_DOC_MARKUP", { fg: r("tag"), font: 0 }],
    ["DOC_CODE_INLINE", { fg: r("code"), font: 0 }],
    ["DOC_CODE_BLOCK", { fg: r("code"), font: 0 }],

    // Literals
    ["DEFAULT_KEYWORD", syn("keyword")],
    ["DEFAULT_STRING", syn("string")],
    ["DEFAULT_NUMBER", syn("number")],
    ["DEFAULT_CONSTANT", syn("constant")],
    ["DEFAULT_LABEL", syn("decorator")],
    ["DEFAULT_VALID_STRING_ESCAPE", syn("escape")],
    ["DEFAULT_INVALID_STRING_ESCAPE", { fg: r("error"), font: 0, fx: [WAVE, r("error")] }],
    ["DEFAULT_ENTITY", syn("escape")],
    ["CUSTOM_STRING_ATTRIBUTES", { base: "DEFAULT_STRING" }],
    ["CUSTOM_VALID_STRING_ESCAPE_ATTRIBUTES", { base: "DEFAULT_VALID_STRING_ESCAPE" }],
    ["CUSTOM_KEYWORD1_ATTRIBUTES", syn("keyword")],
    ["CUSTOM_KEYWORD2_ATTRIBUTES", syn("type")],
    ["CUSTOM_KEYWORD3_ATTRIBUTES", syn("function")],
    ["CUSTOM_KEYWORD4_ATTRIBUTES", syn("number")],

    // Symbols
    ["DEFAULT_FUNCTION_DECLARATION", syn("function")],
    ["DEFAULT_FUNCTION_CALL", syn("function")],
    ["DEFAULT_INSTANCE_METHOD", syn("function")],
    ["DEFAULT_STATIC_METHOD", syn("function")],
    ["STATIC_METHOD_ATTRIBUTES", syn("function")],
    ["DEFAULT_CLASS_NAME", syn("type")],
    ["DEFAULT_INTERFACE_NAME", syn("type")],
    ["DEFAULT_CLASS_REFERENCE", syn("type")],
    ["TYPE_PARAMETER_NAME_ATTRIBUTES", syn("type")],
    ["DEFAULT_LOCAL_VARIABLE", syn("variable")],
    ["DEFAULT_GLOBAL_VARIABLE", syn("variable")],
    ["DEFAULT_PARAMETER", syn("parameter")],
    ["DEFAULT_INSTANCE_FIELD", syn("property")],
    ["DEFAULT_STATIC_FIELD", syn("property")],
    ["DEFAULT_PREDEFINED_SYMBOL", syn("builtin")],
    ["DEFAULT_METADATA", syn("decorator")],
    ["ANNOTATION_NAME_ATTRIBUTES", syn("decorator")],
    ["ANNOTATION_ATTRIBUTE_NAME_ATTRIBUTES", syn("attribute")],
    ["DEFAULT_REASSIGNED_LOCAL_VARIABLE", { fg: r("variable"), font: 0, fx: [UNDERLINE, r("fgSubtle")] }],
    ["DEFAULT_REASSIGNED_PARAMETER", syn("parameter", { fx: [UNDERLINE, r("fgSubtle")] })],
    ["DEFAULT_HIGHLIGHTED_REFERENCE", { fx: [UNDERLINE, r("accent")] }],
    ["IMPLICIT_ANONYMOUS_CLASS_PARAMETER_ATTRIBUTES", syn("parameter")],

    // Punctuation
    ["DEFAULT_OPERATION_SIGN", syn("operator")],
    ["DEFAULT_BRACES", syn("punctuation")],
    ["DEFAULT_BRACKETS", syn("punctuation")],
    ["DEFAULT_PARENTHS", syn("punctuation")],
    ["DEFAULT_COMMA", syn("punctuation")],
    ["DEFAULT_DOT", syn("punctuation")],
    ["DEFAULT_SEMICOLON", syn("punctuation")],

    // Markup, HTML, XML
    ["DEFAULT_TAG", syn("tag")],
    ["DEFAULT_ATTRIBUTE", syn("attribute")],
    ["HTML_TAG_NAME", syn("tag")],
    ["HTML_CUSTOM_TAG_NAME", syn("tag")],
    ["HTML_TAG", syn("punctuation")],
    ["HTML_ATTRIBUTE_NAME", syn("attribute")],
    ["HTML_ATTRIBUTE_VALUE", { base: "DEFAULT_STRING" }],
    ["HTML_ENTITY_REFERENCE", syn("escape")],
    ["XML_TAG_NAME", syn("tag")],
    ["XML_CUSTOM_TAG_NAME", syn("tag")],
    ["XML_TAG", syn("punctuation")],
    ["XML_TAG_DATA", syn("fg")],
    ["XML_ATTRIBUTE_NAME", syn("attribute")],
    ["XML_ENTITY_REFERENCE", syn("escape")],
    ["XML_PROLOGUE", syn("comment")],
    ["CSS.COLOR", syn("number")],
    ["CSS.IMPORTANT", { fg: r("keyword"), font: FONT.bold }],
    ["CSS.URL", syn("string")],
    ["SASS_VARIABLE", syn("variable")],
    ["SASS_MIXIN", syn("function")],
    ["SASS_DIRECTIVE", syn("keyword")],
    ["SASS_COMMENT", syn("comment")],
    ["LESS_VARIABLE", syn("variable")],
    ["PROPERTIES.KEY", syn("property")],
    ["PROPERTIES.KEY_VALUE_SEPARATOR", syn("operator")],
    ["PROPERTIES.VALID_STRING_ESCAPE", syn("escape")],
    ["PROPERTIES.INVALID_STRING_ESCAPE", { fg: r("error"), font: 0, fx: [WAVE, r("error")] }],
    ["JS.GLOBAL_VARIABLE", syn("builtin")],
    ["JS.GLOBAL_FUNCTION", { base: "DEFAULT_FUNCTION_DECLARATION" }],
    ["JS.INSTANCE_MEMBER_FUNCTION", syn("function")],
    ["JS.REGEXP", syn("regex")],
    // Exported variables fall back to JS.GLOBAL_VARIABLE (library globals, the builtin role) in the IDE, and these
    // keys fall back to braces, an identifier and a keyword: set them to the roles every other editor gives the same
    // tokens (test/contract.mjs). Enum members are left to the IDE, which draws them as static members.
    ["JS.EXPORTED_VARIABLE", syn("variable")],
    ["TS.EXPORTED_VARIABLE", syn("variable")],
    ["JS.TEMPLATE_LITERAL_PLACEHOLDER_DELIMITERS", syn("keyword")],
    ["TS.TEMPLATE_LITERAL_PLACEHOLDER_DELIMITERS", syn("keyword")],
    ["TS.MODULE_NAME", syn("namespace")],
    ["TS.PRIMITIVE.TYPES", syn("type")],
    ["KOTLIN_LABEL", syn("decorator")],
    ["KOTLIN_NAMED_ARGUMENT", syn("parameter")],
    ["KOTLIN_TYPE_PARAMETER", { base: "TYPE_PARAMETER_NAME_ATTRIBUTES" }],
    ["KOTLIN_MUTABLE_VARIABLE", { fx: [UNDERLINE, r("fgSubtle")] }],
    ["KOTLIN_SMART_CAST_VALUE", bgOnly(tint("success", 0.15))],
    ["KOTLIN_SMART_CAST_RECEIVER", bgOnly(tint("success", 0.15))],
    ["KOTLIN_SMART_CONSTANT", bgOnly(tint("success", 0.15))],

    // Regular expressions
    ["REGEXP.META", { base: "DEFAULT_KEYWORD" }],
    ["REGEXP.CHAR_CLASS", syn("type")],
    ["REGEXP.ESC_CHARACTER", { base: "DEFAULT_VALID_STRING_ESCAPE" }],
    ["REGEXP.QUOTE_CHARACTER", { base: "DEFAULT_VALID_STRING_ESCAPE" }],
    ["REGEXP.REDUNDANT_ESCAPE", { fg: r("escape"), font: 0, fx: [UNDERLINE, r("fgSubtle")] }],
    ["REGEXP.BRACES", { base: "DEFAULT_BRACES" }],
    ["REGEXP.BRACKETS", { base: "DEFAULT_BRACKETS" }],
    ["REGEXP.PARENTHS", { base: "DEFAULT_PARENTHS" }],
    ["REGEXP_MATCHED_GROUPS", bgOnly(tint("regex", 0.18))],

    // Markdown
    ...[1, 2, 3, 4, 5, 6].map((n) => [`MARKDOWN_HEADER_LEVEL_${n}`, syn("heading")]),
    ["MARKDOWN_BOLD", { font: FONT.bold }],
    ["MARKDOWN_ITALIC", { font: FONT.italic }],
    ["MARKDOWN_CODE_SPAN", { fg: r("code"), font: 0 }],
    ["MARKDOWN_CODE_BLOCK", { fg: r("code"), font: 0 }],
    ["MARKDOWN_CODE_FENCE", { fg: r("code"), font: 0 }],
    ["MARKDOWN_BLOCK_QUOTE", syn("quote")],
    ["MARKDOWN_LINK_TEXT", { fg: r("link"), font: 0, fx: [UNDERLINE, r("link")] }],
    ["MARKDOWN_AUTO_LINK", { fg: r("link"), font: 0, fx: [UNDERLINE, r("link")] }],
    ["MARKDOWN_LINK_DESTINATION", { fg: r("fgSubtle"), font: 0 }],

    // Rainbow brackets and semantic highlighting
    ...rainbow.map((n, i) => [`RAINBOW_COLOR${i}`, { fg: c(n) }]),

    // Diagnostics
    ["ERRORS_ATTRIBUTES", { fx: [WAVE, r("error")], stripe: r("error") }],
    ["WARNING_ATTRIBUTES", { fx: [WAVE, r("warning")], stripe: r("warning") }],
    ["INFO_ATTRIBUTES", { fx: [WAVE, r("info")], stripe: r("info") }],
    ["GENERIC_SERVER_ERROR_OR_WARNING", { fx: [WAVE, r("warning")], stripe: r("warning") }],
    ["WRONG_REFERENCES_ATTRIBUTES", { fg: r("error"), fx: [WAVE, r("error")], stripe: r("error") }],
    ["RUNTIME_ERROR", { fx: [WAVE, r("error")], stripe: r("error") }],
    ["BAD_CHARACTER", { fg: r("error"), fx: [WAVE, r("error")] }],
    ["TYPO", { fx: [WAVE, r("hint")] }],
    ["DEPRECATED_ATTRIBUTES", { fx: [STRIKE, r("fgSubtle")] }],
    ["MARKED_FOR_REMOVAL_ATTRIBUTES", { fx: [STRIKE, r("error")] }],
    ["NOT_USED_ELEMENT_ATTRIBUTES", { fg: r("lineNumber") }],
    ["DUPLICATE_FROM_SERVER", bgOnly(tint("error", 0.15))],
    ["TEXT_STYLE_ERROR", { fx: [WAVE, r("error")] }],
    ["TEXT_STYLE_WARNING", { fx: [WAVE, r("warning")] }],
    ["UNMATCHED_BRACE_ATTRIBUTES", { fg: r("error"), bg: tint("error", 0.22) }],
    ["MATCHED_BRACE_ATTRIBUTES", { bg: tint("accent", 0.28), font: FONT.bold }],
    ["MATCHED_TAG_NAME", bgOnly(tint("accent", 0.18))],

    // Links and navigation
    ["CTRL_CLICKABLE", { fg: r("link"), fx: [UNDERLINE, r("link")] }],
    ["HYPERLINK_ATTRIBUTES", { fg: r("link"), fx: [UNDERLINE, r("link")] }],
    ["FOLLOWED_HYPERLINK_ATTRIBUTES", { fg: f.mix("link", "fgSubtle", 0.4), fx: [UNDERLINE, f.mix("link", "fgSubtle", 0.4)] }],
    ["INACTIVE_HYPERLINK_ATTRIBUTES", { fx: [UNDERLINE, r("fgSubtle")] }],
    ["FOLDED_TEXT_ATTRIBUTES", { fg: r("fgSubtle"), bg: r("lineHighlight") }],
    ["BREADCRUMBS_DEFAULT", { fg: r("fgSubtle") }],
    ["BREADCRUMBS_HOVERED", { fg: r("fg"), bg: r("lineHighlight") }],
    ["BREADCRUMBS_CURRENT", { fg: r("fg"), bg: r("lineHighlight") }],
    ["BREADCRUMBS_INACTIVE", { fg: r("lineNumber") }],
    ["BOOKMARKS_ATTRIBUTES", { stripe: r("warning") }],
    ["INJECTED_LANGUAGE_FRAGMENT", bgOnly(r("bgAlt"))],
    ["TODO_DEFAULT_ATTRIBUTES", { fg: r("info"), font: FONT.bold | FONT.italic, stripe: r("info") }],

    // Search, selection under caret
    ["SEARCH_RESULT_ATTRIBUTES", { bg: tint("match", 0.3), stripe: r("match") }],
    ["TEXT_SEARCH_RESULT_ATTRIBUTES", { bg: tint("match", 0.3), stripe: r("match") }],
    ["WRITE_SEARCH_RESULT_ATTRIBUTES", { bg: tint("match", 0.4), stripe: r("match") }],
    ["IDENTIFIER_UNDER_CARET_ATTRIBUTES", { bg: tint("info", 0.22), stripe: r("info") }],
    ["WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES", { bg: tint("modified", 0.24), stripe: r("modified") }],
    ["LIVE_TEMPLATE_ATTRIBUTES", { fx: [BOX, r("accent")] }],
    ["LIVE_TEMPLATE_INACTIVE_SEGMENT", bgOnly(r("lineHighlight"))],
    ["TEMPLATE_VARIABLE_ATTRIBUTES", { fg: r("accent"), font: FONT.bold }],

    // Inlays and hints
    ["INLAY_DEFAULT", { fg: r("fgSubtle"), bg: r("lineHighlight") }],
    ["INLAY_TEXT_WITHOUT_BACKGROUND", { fg: r("fgSubtle") }],
    ["INLINE_PARAMETER_HINT", { fg: r("fgSubtle"), bg: r("lineHighlight") }],
    ["INLINE_PARAMETER_HINT_CURRENT", { fg: r("fg"), bg: tint("accent", 0.25) }],
    ["INLINE_PARAMETER_HINT_HIGHLIGHTED", { fg: r("fg"), bg: tint("info", 0.22) }],
    ["INLINE_SUGGESTION", { fg: r("lineNumber") }],

    // Debugger and coverage
    ["BREAKPOINT_ATTRIBUTES", { bg: tint("error", 0.25), stripe: r("error") }],
    ["EXECUTIONPOINT_ATTRIBUTES", { bg: tint("accent", 0.25) }],
    ["NOT_TOP_FRAME_ATTRIBUTES", { bg: tint("accent", 0.12) }],
    ["EVALUATED_EXPRESSION_ATTRIBUTES", { bg: tint("info", 0.18) }],
    ["EVALUATED_EXPRESSION_EXECUTION_LINE_ATTRIBUTES", { bg: tint("accent", 0.2) }],
    ["DEBUGGER_INLINED_VALUES", { fg: r("fgMuted"), bg: tint("info", 0.1) }],
    ["DEBUGGER_INLINED_VALUES_MODIFIED", { fg: r("modified"), bg: tint("info", 0.1) }],
    ["DEBUGGER_INLINED_VALUES_EXECUTION_LINE", { fg: r("accent"), bg: tint("accent", 0.12) }],
    ["DEBUGGER_SMART_STEP_INTO_TARGET", { bg: tint("accent", 0.18), fx: [BOX, r("accent")] }],
    ["DEBUGGER_SMART_STEP_INTO_SELECTION", { bg: tint("accent", 0.35), fx: [BOX, r("accent")] }],
    ["LINE_FULL_COVERAGE", { fg: r("added") }],
    ["LINE_PARTIAL_COVERAGE", { fg: r("warning") }],
    ["LINE_NONE_COVERAGE", { fg: r("error") }],

    // Console, logs and ANSI palette (the terminal tool window reads the same CONSOLE_* keys)
    ["CONSOLE_NORMAL_OUTPUT", { fg: r("fg"), font: 0 }],
    ["CONSOLE_ERROR_OUTPUT", { fg: r("error"), font: 0 }],
    ["CONSOLE_SYSTEM_OUTPUT", { fg: r("success"), font: 0 }],
    ["CONSOLE_USER_INPUT", { fg: r("accent"), font: 0 }],
    ...ansi,
    ["LOG_ERROR_OUTPUT", { fg: r("error") }],
    ["LOG_WARNING_OUTPUT", { fg: r("warning") }],
    ["LOG_INFO_OUTPUT", { fg: r("fg") }],
    ["LOG_DEBUG_OUTPUT", { fg: r("fgMuted") }],
    ["LOG_VERBOSE_OUTPUT", { fg: r("fgSubtle") }],
    ["LOG_EXPIRED_ENTRY", { fg: r("lineNumber") }],

    // Diff and merge
    ["DIFF_INSERTED", { bg: tint("added", 0.2), stripe: r("added") }],
    ["DIFF_DELETED", { bg: tint("removed", 0.2), stripe: r("removed") }],
    ["DIFF_MODIFIED", { bg: tint("modified", 0.18), stripe: r("modified") }],
    ["DIFF_CONFLICT", { bg: tint("error", 0.24), stripe: r("error") }],
    ["DIFF_ABSENT", bgOnly(r("bgAlt"))],
    ["DIFF_DELETED_FROM_FS", bgOnly(tint("removed", 0.14))],
    ["DIFF_UNKNOWN", bgOnly(tint("warning", 0.14))],

    // Every key the IDE's own Default and Darcula schemes color (test/fixtures/jetbrains-parent-keys.json). A key
    // this scheme leaves out shows the parent scheme's color instead: TypeScript's RADIUS came out in Darcula's
    // #a9b7c6 while JS.LOCAL_VARIABLE was missing. Keys the IDE falls back from point at their fallback here.
    ...[
      ["JS.LOCAL_VARIABLE", "DEFAULT_LOCAL_VARIABLE"], ["JS.PARAMETER", "DEFAULT_PARAMETER"],
      ["INSTANCE_FIELD_ATTRIBUTES", "DEFAULT_INSTANCE_FIELD"], ["STATIC_FIELD_ATTRIBUTES", "DEFAULT_STATIC_FIELD"],
      ["STATIC_FINAL_FIELD_ATTRIBUTES", "STATIC_FIELD_ATTRIBUTES"], ["CUSTOM_NUMBER_ATTRIBUTES", "DEFAULT_NUMBER"],
      ["CUSTOM_LINE_COMMENT_ATTRIBUTES", "DEFAULT_LINE_COMMENT"], ["CUSTOM_MULTI_LINE_COMMENT_ATTRIBUTES", "DEFAULT_BLOCK_COMMENT"],
      ["CUSTOM_INVALID_STRING_ESCAPE_ATTRIBUTES", "DEFAULT_INVALID_STRING_ESCAPE"], ["TODO_ATTRIBUTES", "TODO_DEFAULT_ATTRIBUTES"],
      ["GROOVY_KEYWORD", "DEFAULT_KEYWORD"], ["BASH.FUNCTION_CALL", "DEFAULT_FUNCTION_CALL"],
      ["BASH.FUNCTION_DEF_NAME", "DEFAULT_FUNCTION_DECLARATION"],
    ].map(([key, base]) => [key, { base }]),
    ...[
      ["BASH.INTERNAL_COMMAND", "function"], ["BASH.EXTERNAL_COMMAND", "function"], ["TS.TYPE_PARAMETER", "type"],
      ["HAML_CLASS", "type"], ["HAML_ID", "type"], ["HAML_TAG", "tag"], ["HAML_COMMENT", "comment"],
      ["HTTP_REQUEST_PARAMETER_NAME", "property"], ["HTTP_REQUEST_PARAMETER_VALUE", "string"],
      ["HTTP_REQUEST_MULTIPART_BOUNDARY", "punctuation"], ["JSP_DIRECTIVE_NAME", "decorator"],
      ["KOTLIN_CONTEXT_ARGUMENT", "parameter"], ["List/map to object conversion", "decorator"], ["NG.SIGNAL", "function"],
      ["SASS_ATTRIBUTE", "property"], ["SASS_CONSTANT", "variable"], ["SASS_RULE", "keyword"],
      ["SQL_SYNTHETIC_ENTITY", "type"], ["Scala Type Alias", "type"], ["Scala Type parameter", "type"],
      ["Static method access", "function"], ["Static property reference ID", "property"],
      ["VELOCITY_DIRECTIVE", "decorator"], ["VELOCITY_KEYWORD", "keyword"], ["VELOCITY_REFERENCE", "variable"],
      ["XPATH.FUNCTION", "function"], ["XPATH.KEYWORD", "keyword"], ["XPATH.XPATH_NAME", "tag"],
      ["XPATH.XPATH_VARIABLE", "variable"], ["YAML_ANCHOR", "decorator"], ["ATTR_INTERNAL_CALL_ID", "function"],
      ["IntelliJComposableCallTextAttributes", "function"], ["MERMAID_CONSTANT", "constant"],
      ["MERMAID_DIAGRAM_NAME", "keyword"], ["MERMAID_EDGE", "operator"], ["MERMAID_FRONTMATTER_DELIMITER", "punctuation"],
      ["MERMAID_GENERIC", "type"], ["MERMAID_IDENTIFIER", "variable"], ["MERMAID_KEYWORD", "keyword"],
      ["MERMAID_TITLE", "heading"],
    ].map(([key, role]) => [key, syn(role)]),
    ["MARKDOWN_HEADER", { fg: r("heading"), font: FONT.bold }],
    ["SQL_OUTER_QUERY_COLUMN", syn("property", { fx: [UNDERLINE, r("property")] })],
    ["Unresolved reference access", { fg: r("fgSubtle"), fx: [UNDERLINE, r("fgSubtle")] }],
    ["KOTLIN_COROUTINE_DEBUGGER_VALUE", { fg: r("fgSubtle") }],
    ["KOTLIN_DEBUG_INFO", { fx: [BOX, r("fgSubtle")], stripe: r("fgSubtle") }],
    ["KOTLIN_RESOLVED_TO_ERROR", { fx: [BOX, r("error")], stripe: r("error") }],
    ["FILESTATUS_ERRORS", { fx: [WAVE, r("error")], stripe: r("error") }],
    ["GRAMMAR_ERROR", { fx: [WAVE, r("info")] }],
    ["TEXT_STYLE_SUGGESTION", { fx: [DOTTED, r("info")] }],
    ["DELETED_TEXT_ATTRIBUTES", { fg: r("fgSubtle"), bg: tint("removed", 0.2), fx: [STRIKE, r("removed")] }],
    ["DO_NOT_SHOW", { stripe: r("fgSubtle") }],
    ["NO_ANALYSIS", { stripe: r("lineNumber") }],
    ["JOIN_POINT", { fx: [BOX, r("decorator")] }],
    ["BEAN.INACTIVE", { fx: [STRIKE, r("fgSubtle")] }],
    ["BLINKING_HIGHLIGHTS_ATTRIBUTES", { fx: [BOX, r("accent")] }],
    ["CODE_LENS_BORDER_COLOR", { fx: [BOX, r("border")] }],
    ["CONSOLE_RANGE_TO_EXECUTE", { fx: [BOX, r("success")] }],
    ["TERMINAL_CLASS_NAME_LOG_REFERENCE", { fx: [DOTTED, r("fgSubtle")] }],
    ["DOC_TIPS_SHORTCUT", { fg: r("fgMuted"), fx: [BOX, r("border")] }],
    // Interface pieces drawn in the editor: inlay buttons, AI prompts, stack frames, service states.
    ...["DEFAULT", "FOCUSED", "HOVERED"].flatMap((state) => [
      [`INLAY_BUTTON_${state}`, { fg: r("fgMuted"), fx: [BOX, state === "DEFAULT" ? r("border") : r("accent")] }],
      [`AI_INLAY_BUTTON_${state}`, { fg: r("fgMuted"), fx: [BOX, state === "DEFAULT" ? r("border") : r("accent")] }],
    ]),
    ["INLAY_BUTTON_HINT", { fg: r("fgSubtle") }],
    ["INVISIBLE_INLAY_BUTTON", { fg: r("lineNumber"), fx: [BOX, r("border")] }],
    ["COMPOSE_INVISIBLE_PORT_BUTTON", { fg: r("lineNumber"), fx: [BOX, r("border")] }],
    ["INLINE_PROMPT", { fg: r("accent") }],
    ["INLINE_PROMPT_PROGRESS_DARK", { fg: r("accent") }],
    ["INLINE_PROMPT_PROGRESS_LIGHT", { fg: r("accent") }],
    ...[["COMPOSE_SERVICE_STATUS", ["ERROR", "NEUTRAL", "SUCCESS"]], ["KUBERNETES_POD_STATUS", ["ERROR", "OTHER", "SUCCESS"]]].flatMap(
      ([prefix, states]) => states.map((s, i) => {
        const role = ["error", "fgMuted", "success"][i];
        return [`${prefix}_${s}`, { fg: r(role), bg: tint(role, 0.15) }];
      }),
    ),
    ["SPY-JS.EXCEPTION", bgOnly(tint("error", 0.2))],
    ["SPY-JS.PATH_LEVEL_ONE", bgOnly(tint("success", 0.2))],
    ["SPY-JS.PATH_LEVEL_TWO", { fx: [UNDERLINE, r("fgMuted")] }],
    ["SPY-JS.FUNCTION_SCOPE", bgOnly(r("bgAlt"))],
    ["SPY-JS.PROGRAM_SCOPE", bgOnly(r("bgAlt"))],
    ["SPY-JS.VALUE_HINT", { fx: [BOX, r("fgMuted")] }],
    ["TS.TYPE_GUARD", bgOnly(r("bgAlt"))],
    ["BASH.BINARY_DATA", bgOnly(r("bgAlt"))],
    ["HAML_RUBY_CODE", bgOnly(r("bgAlt"))],
    ["VELOCITY_SCRIPTING_BACKGROUND", bgOnly(r("bgAlt"))],
    ["MERMAID_NOTE", bgOnly(r("bgAlt"))],
    ["CONSOLE_OUTPUT", bgOnly(r("bgAlt"))],
    ["INLINE_STACK_FRAMES", bgOnly(r("bgAlt"))],
    ["ComposeStateReadScopeHighlightingTextAttributes", bgOnly(r("lineHighlight"))],
    ["KOTLIN_PROPERTY_WITH_BACKING_FIELD", bgOnly(r("bgAlt"))],
    ["TERMINAL_COMMAND_TO_RUN_USING_IDE", bgOnly(tint("success", 0.2))],
    // The new (block) terminal: the same ANSI colors as every other terminal.
    ...ANSI_ORDER.flatMap((n, i) => [
      [`BLOCK_TERMINAL_${n.toUpperCase()}`, { fg: f.ansi.normal[i], bg: f.ansi.normal[i] }],
      [`BLOCK_TERMINAL_${n.toUpperCase()}_BRIGHT`, { fg: f.ansi.bright[i], bg: f.ansi.bright[i] }],
    ]),
    ["BLOCK_TERMINAL_COMMAND", { fg: r("fg"), font: FONT.bold }],
    ["BLOCK_TERMINAL_SEARCH_ENTRY", { fg: r("bg"), bg: r("fgSubtle") }],
    ["BLOCK_TERMINAL_CURRENT_SEARCH_ENTRY", { fg: r("bg"), bg: r("match") }],
    ["BLOCK_TERMINAL_GENERATE_COMMAND_PROMPT_TEXT", { fg: r("fgSubtle") }],
  ];

  const lines = [
    `<!-- Living Code theme. Maintained in this repository. -->`,
    `<scheme name="${xmlEsc(f.name)}" version="142" parent_scheme="${f.light ? "Default" : "Darcula"}">`,
    "  <colors>",
    ...Object.entries(colors).map(([k, v]) => `    <option name="${k}" value="${x(v)}" />`),
    "  </colors>",
    "  <attributes>",
    ...attributes.map(([name, a]) => attrXml(name, a)),
    "  </attributes>",
    "</scheme>",
  ];
  return lines.join("\n") + "\n";
}

const alpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, "0");

function namedColors(f) {
  const r = f.r, c = f.c;
  const soft = (role, t = 0.16) => f.mix("bgAlt", role, t);
  return {
    bg: r("bg"),
    bgAlt: r("bgAlt"),
    bgDeep: r("bgDeep"),
    fg: r("fg"),
    fgAlt: r("fgAlt"),
    fgMuted: r("fgMuted"),
    fgSubtle: r("fgSubtle"),
    disabled: r("lineNumber"),
    accent: r("accent"),
    accentHover: c("mint"),
    onAccent: r("bg"),
    selection: r("selection"),
    selectionInactive: f.mix("bgDeep", "selection", 0.6),
    hover: f.mix("bgDeep", "border", 0.6),
    pressed: r("border"),
    border: r("border"),
    borderStrong: c("surface2"),
    link: r("link"),
    match: r("match"),
    matchSoft: f.mix("bg", "match", 0.35),
    error: r("error"),
    warning: r("warning"),
    info: r("info"),
    success: r("success"),
    modified: r("modified"),
    errorSoft: soft("error"),
    warningSoft: soft("warning"),
    infoSoft: soft("info"),
    successSoft: soft("success"),
    accentSoft: soft("accent", 0.2),
    scrollThumb: alpha(c("surface2"), 0.55),
    scrollThumbHover: alpha(c("surface2"), 0.9),
    fileYellow: soft("amber", 0.2),
    fileGreen: soft("moss", 0.2),
    fileOrange: soft("copper", 0.2),
    fileRose: soft("flare", 0.2),
    fileViolet: soft("orchid", 0.2),
    fileBlue: soft("steel", 0.2),
    fileGray: f.mix("bgDeep", "border", 0.5),
  };
}

const VENDOR = { name: "Living Code", url: "https://github.com/living-code-theme/jetbrains" };

function themeJson(f) {
  const ui = {
    "*": {
      foreground: "fg",
      background: "bgDeep",
      borderColor: "border",
      disabledText: "disabled",
      disabledForeground: "disabled",
      inactiveForeground: "disabled",
      disabledBackground: "bgDeep",
      disabledBorderColor: "border",
      selectionBackground: "selection",
      lightSelectionBackground: "selection",
      selectionForeground: "fg",
      selectionInactiveBackground: "selectionInactive",
      selectionInactiveForeground: "fg",
      selectionBackgroundInactive: "selectionInactive",
      hoverBackground: "hover",
      infoForeground: "fgSubtle",
      acceleratorForeground: "fgSubtle",
      shortcutForeground: "fgSubtle",
      underlineColor: "accent",
      inactiveUnderlineColor: "borderStrong",
      focusColor: "accent",
      separatorColor: "border",
      separatorForeground: "fgSubtle",
      modifiedItemForeground: "modified",
    },
    Borders: { color: "border", ContrastBorderColor: "border" },
    OnePixelDivider: { background: "border" },

    // Text inputs sit on the editor ground, panels on the deeper one.
    TextField: { background: "bg" },
    PasswordField: { background: "bg" },
    FormattedTextField: { background: "bg" },
    TextArea: { background: "bg" },
    EditorPane: { background: "bg" },
    ComboBox: { background: "bg", nonEditableBackground: "bgAlt", ArrowButton: { background: "bg", nonEditableBackground: "bgAlt" } },
    Spinner: { background: "bg" },
    Component: {
      borderColor: "borderStrong",
      focusedBorderColor: "accent",
      errorFocusColor: "error",
      inactiveErrorFocusColor: "errorSoft",
      warningFocusColor: "warning",
      inactiveWarningFocusColor: "warningSoft",
    },
    Button: {
      startBackground: "bgAlt",
      endBackground: "bgAlt",
      startBorderColor: "borderStrong",
      endBorderColor: "borderStrong",
      focusedBorderColor: "accent",
      disabledText: "disabled",
      default: {
        foreground: "onAccent",
        startBackground: "accent",
        endBackground: "accent",
        startBorderColor: "accent",
        endBorderColor: "accent",
        focusedBorderColor: "accentHover",
      },
    },
    ActionButton: {
      hoverBackground: "hover",
      hoverBorderColor: "hover",
      pressedBackground: "pressed",
      pressedBorderColor: "pressed",
      focusedBorderColor: "accent",
    },
    Link: {
      activeForeground: "link",
      hoverForeground: "link",
      pressedForeground: "link",
      visitedForeground: "link",
      secondaryForeground: "fgSubtle",
    },
    Label: { errorForeground: "error", warningForeground: "warning", successForeground: "success", disabledForeground: "disabled", infoForeground: "fgSubtle" },
    Counter: { background: "accent", foreground: "onAccent" },
    ProgressBar: {
      progressColor: "accent",
      indeterminateStartColor: "accentHover",
      indeterminateEndColor: "accent",
      passedColor: "success",
      failedColor: "error",
      trackColor: "border",
    },
    Slider: { trackColor: "border", buttonColor: "accent" },

    // Lists, trees, tables
    List: { hoverBackground: "hover" },
    Tree: { background: "bgDeep", hoverBackground: "hover", hash: "border" },
    Table: { background: "bgDeep", gridColor: "border", stripeColor: "bgAlt", hoverBackground: "hover" },
    TableHeader: { background: "bgDeep", separatorColor: "border", bottomSeparatorColor: "border" },

    // Chrome: tool windows, toolbars, tabs, status bar
    ToolWindow: {
      background: "bgDeep",
      Header: { background: "bgDeep", inactiveBackground: "bgDeep" },
      HeaderTab: { selectedBackground: "bgDeep", selectedInactiveBackground: "bgDeep", hoverBackground: "hover" },
      Button: { hoverBackground: "hover", selectedBackground: "accent", selectedForeground: "onAccent" },
    },
    MainToolbar: { background: "bgDeep", separatorColor: "border" },
    TitlePane: { background: "bgDeep", inactiveBackground: "bgDeep" },
    ToolBar: { separatorColor: "border" },
    StatusBar: { background: "bgDeep", Widget: { foreground: "fgMuted", hoverForeground: "fg", hoverBackground: "hover" } },
    EditorTabs: {
      background: "bgDeep",
      underlineColor: "accent",
      inactiveUnderlineColor: "borderStrong",
      underlinedTabBackground: "bg",
      selectedBackground: "bg",
      hoverBackground: "hover",
      hoverInactiveBackground: "hover",
      underTabsBorderColor: "border",
      borderColor: "border",
    },
    DefaultTabs: {
      background: "bgDeep",
      underlineColor: "accent",
      inactiveUnderlineColor: "borderStrong",
      underlinedTabBackground: "bgDeep",
      hoverBackground: "hover",
    },
    TabbedPane: { contentAreaColor: "border", hoverColor: "hover", focusColor: "selection" },

    // Popups, menus, tooltips, notifications
    Popup: {
      borderColor: "border",
      inactiveBorderColor: "border",
      separatorColor: "border",
      Header: { activeBackground: "bgAlt", inactiveBackground: "bgAlt" },
      Toolbar: { background: "bgAlt" },
      Advertiser: { background: "bgAlt" },
    },
    PopupMenu: { background: "bgAlt" },
    Menu: { background: "bgAlt", separatorColor: "border", borderColor: "border" },
    MenuItem: { background: "bgAlt" },
    MainMenu: { foreground: "fg", selectionForeground: "fg", selectionBackground: "hover" },
    ToolTip: { background: "bgAlt", borderColor: "border", foreground: "fg", infoForeground: "fgSubtle" },
    Editor: {
      SearchField: { background: "bg" },
      Toolbar: { borderColor: "border" },
      ToolTip: { background: "bgAlt", border: "border", foreground: "fg" },
    },
    ValidationTooltip: {
      errorBackground: "errorSoft",
      errorBorderColor: "error",
      warningBackground: "warningSoft",
      warningBorderColor: "warning",
    },
    Notification: {
      background: "bgAlt",
      borderColor: "border",
      foreground: "fg",
      linkForeground: "link",
      MoreButton: { background: "bgDeep", innerBorderColor: "border" },
      ToolWindow: {
        errorBackground: "errorSoft",
        errorBorderColor: "error",
        warningBackground: "warningSoft",
        warningBorderColor: "warning",
        informativeBackground: "infoSoft",
        informativeBorderColor: "info",
      },
    },
    Banner: {
      infoBackground: "infoSoft",
      infoBorderColor: "info",
      successBackground: "successSoft",
      successBorderColor: "success",
      warningBackground: "warningSoft",
      warningBorderColor: "warning",
      errorBackground: "errorSoft",
      errorBorderColor: "error",
    },
    HelpTooltip: { borderColor: "border" },

    // Search, completion, parameter info
    SearchEverywhere: {
      Header: { background: "bgAlt" },
      SearchField: { background: "bg", borderColor: "border" },
      Tab: { selectedBackground: "selection", selectedForeground: "fg" },
      List: { separatorColor: "border", settingsBackground: "bgAlt" },
    },
    SearchMatch: { startBackground: "matchSoft", endBackground: "matchSoft" },
    SearchOption: { selectedBackground: "accentSoft" },
    SpeedSearch: { background: "bgAlt", borderColor: "border", errorForeground: "error" },
    CompletionPopup: {
      matchForeground: "accent",
      selectionBackground: "selection",
      selectionInactiveBackground: "selectionInactive",
      Advertiser: { background: "bgAlt", foreground: "fgSubtle" },
    },
    ParameterInfo: {
      background: "bgAlt",
      borderColor: "border",
      foreground: "fgAlt",
      currentParameterForeground: "fg",
      currentOverloadBackground: "selection",
      infoForeground: "fgSubtle",
      disabledForeground: "disabled",
      lineSeparatorColor: "border",
    },

    // VCS, debugger, plugins, file colors
    VersionControl: {
      Log: { Commit: { currentBranchBackground: "accentSoft", unmatchedForeground: "disabled", Reference: { foreground: "fgMuted" } } },
      FileHistory: { Commit: { selectedBranchBackground: "accentSoft" } },
      GitLog: { headIconColor: "warning", localBranchIconColor: "success", otherIconColor: "fgSubtle", remoteBranchIconColor: "info" },
      MarkerPopup: { borderColor: "border" },
    },
    Debugger: {
      Variables: {
        valueForeground: "fgAlt",
        collectingDataForeground: "fgSubtle",
        evaluatingExpressionForeground: "fgSubtle",
        changedValueForeground: "modified",
        modifyingValueForeground: "modified",
        errorMessageForeground: "error",
        exceptionForeground: "error",
        typeForeground: "fgSubtle",
      },
      EvaluateExpression: { background: "bgAlt" },
    },
    Plugins: {
      SectionHeader: { background: "bgAlt" },
      tagBackground: "border",
      tagForeground: "fgMuted",
      Button: {
        installFillBackground: "accent",
        installFillForeground: "onAccent",
        installBorderColor: "accent",
        installForeground: "accent",
        updateBackground: "accent",
        updateBorderColor: "accent",
        updateForeground: "onAccent",
      },
    },
    FileColor: {
      Yellow: "fileYellow",
      Green: "fileGreen",
      Orange: "fileOrange",
      Rose: "fileRose",
      Violet: "fileViolet",
      Blue: "fileBlue",
      Gray: "fileGray",
    },
    WelcomeScreen: {
      background: "bgDeep",
      borderColor: "border",
      separatorColor: "border",
      captionBackground: "bgDeep",
      headerBackground: "bgDeep",
      Projects: { background: "bgDeep", selectionBackground: "selection", selectionInactiveBackground: "selectionInactive" },
      Details: { background: "bg" },
    },
  };

  const theme = {
    name: f.name,
    dark: !f.light,
    author: VENDOR.name,
    editorScheme: `/themes/${f.slug}.xml`,
    colors: namedColors(f),
    ui,
    // Checkboxes and radio buttons are drawn from this palette in the new UI.
    icons: {
      ColorPalette: {
        "Checkbox.Background.Default": "bg",
        "Checkbox.Border.Default": "borderStrong",
        "Checkbox.Background.Selected": "accent",
        "Checkbox.Border.Selected": "accent",
        "Checkbox.Foreground.Selected": "onAccent",
        "Checkbox.Focus.Wide": "accentSoft",
      },
    },
  };
  return JSON.stringify(theme, null, 2) + "\n";
}

const flavorFiles = (f) => [
  { path: `themes/${f.slug}.theme.json`, content: themeJson(f) },
  { path: `themes/${f.slug}.xml`, content: editorScheme(f) },
];

const jetbrains = { files: flavorFiles };

export function generate(flavors) {
  return [...flavors.flatMap(f => jetbrains.files(f)), ...(jetbrains.all?.(flavors) ?? [])].filter(f => !["LICENSE", "README.md", "package.json", "extension.toml"].includes(f.path.split("/").at(-1)));
}
