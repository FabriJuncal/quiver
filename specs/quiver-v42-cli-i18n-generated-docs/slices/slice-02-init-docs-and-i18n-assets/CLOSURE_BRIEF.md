# CLOSURE_BRIEF - slice-02 Init docs and i18n assets

## Summary

Completed. Init-generated human docs now use the generated-doc language router. `--lang` can produce Spanish docs and persists the project language; existing project config is used when no explicit language override is provided. Machine artifacts remain stable and are not routed through human template localization.

## Validation

- [x] `node --test tests/commands/init-profiles.test.js tests/lib/init-docs.test.js tests/lib/i18n-templates.test.js`
- [x] `node --test tests/commands/demo.test.js`
- [x] `git diff --check`
