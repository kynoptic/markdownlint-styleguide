# Placeholder and template links

This fixture tests that intentional placeholder links in documentation templates and examples are not flagged as broken links when the appropriate configuration is enabled.

## Documentation examples (should NOT flag with allowPlaceholders: true)

See the [documentation](URL) for more details.

Check [the configuration guide](PLACEHOLDER.md) for setup instructions.

Review [this resource](TODO.md) for implementation.

Visit [the service portal](link) for support tickets.

Read the [example file](path/to/file.md) to understand the pattern.

Refer to [ADR template](adr-XXX-title.md) for decision docs.

Open [the placeholder](PLACEHOLDER) to edit.

## Newsletter and email templates

[View in browser](link) to see the full version.

[Unsubscribe](link) from future emails.

Contact [HMS IT Service Portal](link) for assistance.

Click [here](URL) to learn more.

## Image placeholders

![Alt text](path/to/image.png)

![Diagram](URL)

![Screenshot](PLACEHOLDER.png)

![Example](assets/images/image_001.png)

## Valid relative links (should NOT flag even without allowPlaceholders)

See [README](../README.md) for project overview.

Check [contributing guidelines](../../CONTRIBUTING.md) for development.

Review [test fixtures](./fixtures/example.md) for examples.

## Valid anchor links (should NOT flag)

Jump to [installation section](#installation).

See [configuration](#configuration-options) below.

## Should flag (actual broken links, even with allowPlaceholders)

Read [the missing file](../docs/does-not-exist.md) for info.

Check [broken anchor](README.md#nonexistent-section) for details.

## Edge cases - legitimate paths that look like placeholders

The actual file is at [real path](./path/to/real-file.md).

Image located at [assets](../assets/images/actual-image.png).

## Mixed scenarios

See [API docs](URL) and [local guide](./api-guide.md) for reference.

Template: [Title](PLACEHOLDER) - Real: [Guide](../guide.md).

Contact [support](link) or file an issue at [GitHub](https://github.com/org/repo/issues).

## Common placeholder patterns

Replace [YOUR_NAME] with your name.

Update [YOUR_EMAIL_ADDRESS] in the config.

Set [API_KEY] in environment variables.

Configure [DATABASE_URL] in `.env` file.

## Template syntax examples

Link syntax: `[Link text](URL)`

Image syntax: `![Alt text](path/to/image.png)`

Reference: `[label][reference]`

## Should NOT flag - actual placeholder keywords

See TODO.md for pending items.

Check PLACEHOLDER.md for template structure.

Review XXX.md for examples.

Refer to adr-XXX-title.md format.
