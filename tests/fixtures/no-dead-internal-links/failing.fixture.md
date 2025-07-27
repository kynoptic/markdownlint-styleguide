# Failing fixture for no-dead-internal-links

This file contains invalid internal links that should trigger violations.

## Invalid headings in current file

These anchors refer to headings that do not exist in this file:

- Link to [non-existent heading](#this-heading-does-not-exist) <!-- ❌ -->
- Link to [another missing heading](#missing-section) <!-- ❌ -->
- Link to [wrong case heading](#Invalid-Headings-In-Current-File) <!-- ❌ -->

## Invalid file links

These links point to files that do not exist:

- Link to [missing file](non-existent-file.md) <!-- ❌ -->
- Link to [missing file with path](./path/to/missing.md) <!-- ❌ -->
- Link to [missing nested file](subdirectory/missing-file.md) <!-- ❌ -->
- Link to [file without extension](missing-file) <!-- ❌ -->

## Invalid file links with anchors

These links point to valid files but invalid headings:

- Link to [missing section in existing file](existing-file.md#non-existent-section) <!-- ❌ -->
- Link to [wrong anchor format](existing-file.md#Section One) <!-- ❌ -->
- Link to [missing heading in nested file](subdirectory/nested-file.md#missing-heading) <!-- ❌ -->

## Invalid directory links

These links point to directories that do not exist:

- Link to [missing directory](missing-directory/) <!-- ❌ -->
- Link to [non-existent nested directory](path/to/missing/) <!-- ❌ -->

## Mixed invalid content

Some regular text with [invalid links](missing-file.md) mixed in. <!-- ❌ -->

The [missing directory](non-existent-dir/) does not exist. <!-- ❌ -->

Check out the [wrong section](existing-file.md#wrong-section) for details. <!-- ❌ -->

Another [broken link](subdirectory/missing.md#also-missing) here. <!-- ❌ -->

## Valid mixed with invalid

This section mixes valid and invalid links:

- Valid link: [existing file](existing-file.md) <!-- ✅ -->
- Invalid link: [missing file](missing.md) <!-- ❌ -->
- Valid link: [valid heading](existing-file.md#section-one) <!-- ✅ -->
- Invalid link: [invalid heading](existing-file.md#missing-section) <!-- ❌ -->