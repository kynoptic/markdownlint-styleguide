# Domain names vs. full URLs fixture

## Domain names in prose (should NOT require backticks)

Send email via Outlook.com or Gmail.com for convenience.

Access Microsoft365.com for enterprise features and productivity tools.

Visit the example.com homepage for more information.

Users can register at GitHub.com to contribute to projects.

The service is hosted on AWS.Amazon.com infrastructure.

Check status.example.org for service health updates.

## Full URLs with protocol (SHOULD require backticks)

Visit http://example.com for details about our services.

See https://github.com/user/repo for the source code.

Reference https://api.example.com/v1/docs for API documentation.

Check http://localhost:3000 during development.

Access the endpoint at https://api.stripe.com/v1/charges.

Documentation available at https://docs.python.org/3/library/index.html.

## Mixed content (only URLs with protocol require backticks)

Send email to support@example.com or visit https://example.com/support.

GitHub.com is a platform, but clone from https://github.com/user/repo.

Check Gmail.com for updates, then refer to https://mail.google.com/mail/u/0/.

## Edge cases

Domain with subdomain: api.example.com should not require backticks.

Domain with port mentioned separately: Connect to example.com on port 443.

Domain in possessive form: Outlook.com's interface is intuitive.

Domain at end of sentence: I use Gmail.com.
