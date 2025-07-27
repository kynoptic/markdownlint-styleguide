# Passing fixture for no-dead-internal-links

This file contains valid internal links that should not trigger any violations.

## Valid headings in current file

These anchors refer to headings that exist in this file:

- Link to [valid headings section](#valid-headings-in-current-file) <!-- ✅ -->
- Link to [file links section](#valid-file-links) <!-- ✅ -->
- Link to [directory links section](#valid-directory-links) <!-- ✅ -->
- Link to [external links section](#external-links-ignored) <!-- ✅ -->

## Valid file links

These links point to files that exist:

- Link to [existing file](existing-file.md) <!-- ✅ -->
- Link to [existing file with extension](./existing-file.md) <!-- ✅ -->
- Link to [nested file](subdirectory/nested-file.md) <!-- ✅ -->
- Link to [nested file with relative path](./subdirectory/nested-file.md) <!-- ✅ -->

## Valid file links with anchors

These links point to specific headings in existing files:

- Link to [section one in existing file](existing-file.md#section-one) <!-- ✅ -->
- Link to [section two in existing file](existing-file.md#section-two-with-special-characters) <!-- ✅ -->
- Link to [nested heading in existing file](existing-file.md#nested-heading) <!-- ✅ -->
- Link to [code examples in existing file](existing-file.md#code-examples) <!-- ✅ -->
- Link to [nested section in subdirectory](subdirectory/nested-file.md#nested-section) <!-- ✅ -->

## Valid directory links

These links point to directories that exist:

- Link to [subdirectory](subdirectory/) <!-- ✅ -->
- Link to [current directory](./) <!-- ✅ -->

## External links (ignored)

These external links should be ignored by the rule:

- Link to [Google](https://google.com) <!-- ✅ -->
- Link to [GitHub](https://github.com) <!-- ✅ -->
- Link to [email](mailto:test@example.com) <!-- ✅ -->
- Link to [file protocol](file:///etc/hosts) <!-- ✅ -->

## Mixed content

Some regular text with [valid links](existing-file.md) mixed in. <!-- ✅ -->

The [subdirectory](subdirectory/) contains useful files. <!-- ✅ -->

Check out the [section one](existing-file.md#section-one) for more details. <!-- ✅ -->