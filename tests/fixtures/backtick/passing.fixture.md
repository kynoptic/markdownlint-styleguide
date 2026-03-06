# Backtick passing fixture

## File paths and filenames

Look in the `src/utils` directory <!-- ✅ -->
Edit the `settings.json` file in the `.vscode/` folder <!-- ✅ -->
Save the results to `output/results.csv` <!-- ✅ -->
Move the image to `assets/images/hero.png` <!-- ✅ -->
The config is stored in `config.yaml` <!-- ✅ -->

## Commands and CLI usage

Run `npm install` to set up dependencies <!-- ✅ -->
Use `git status` to check your branch <!-- ✅ -->
Start the server with `yarn dev` <!-- ✅ -->
Enable execution using `chmod +x deploy.sh` <!-- ✅ -->
Add the alias with `alias gs='git status'` <!-- ✅ -->

## Functions and code snippets

Call `fetchUserData(token)` to retrieve the user object <!-- ✅ -->
Use `Array.prototype.map()` for transformation <!-- ✅ -->
The method `toISOString()` returns a UTC string <!-- ✅ -->
Use `console.log()` to debug the response <!-- ✅ -->
Wrap it in `Promise.all()` to run in parallel <!-- ✅ -->

## Inline literals and expressions

Set the `NODE_ENV` variable to `production` <!-- ✅ -->
Update your path with `export PATH="$PATH:/usr/local/bin"` <!-- ✅ -->
Set the `PATH` variable to `/usr/local/bin` <!-- ✅ -->
Set the `HOME` variable to `/home/user` <!-- ✅ -->
The regex `/^[a-z0-9-]+$/` matches kebab-case strings <!-- ✅ -->
Reference the `type: module` setting in `package.json` <!-- ✅ -->
Use `#define PI 3.14` in your header file <!-- ✅ -->

## Valid markdown links and URLs

See the full spec at [semver.org](https://semver.org/spec/v2.0.0.html) <!-- ✅ -->
Refer to [README](./README.md) for setup instructions <!-- ✅ -->
Open [docs/index.md#Getting-Started](docs/index.md#Getting-Started) <!-- ✅ -->
Visit [localhost:8000](http://localhost:8000) to test locally <!-- ✅ -->
Visit github.com for more information <!-- ✅ -->
Apply at ulca.edu for more information <!-- ✅ -->

## Images and embeds

![Diagram](./assets/architecture-diagram.png) <!-- ✅ -->
![[project-flow.png#details]] <!-- ✅ -->
![[report-summary.md#Results]] <!-- ✅ -->
![[quote-block^e5d1ab]] <!-- ✅ -->

## UI and keyboard syntax

Click the `Submit` button to proceed <!-- ✅ -->
Use `Ctrl + C` to interrupt the process <!-- ✅ -->
Press `Cmd + Shift + P` to open the command palette <!-- ✅ -->
Toggle `Settings > Editor > Line Wrapping` <!-- ✅ -->

## Tables and properties

| **Key**   | **Value**      |
| --------- | -------------- | ----------- |
| `apiKey`  | `sk-123abc...` |
| `timeout` | `5000`         | <!-- ✅ --> |

Set `priority: high` in the frontmatter <!-- ✅ -->

## Math and formulas

Use the formula `a^2 + b^2 = c^2` for right triangles <!-- ✅ -->
`E = mc^2` describes the relationship between energy and mass <!-- ✅ -->
The sigmoid function is `1 / (1 + e^-x)` <!-- ✅ -->

## Miscellaneous inline code and idioms

Write a quick bash loop like `for f in *.jpg; do ...; done` <!-- ✅ -->
Escape special characters with `\n`, `\t`, or `\\` <!-- ✅ -->
Markdown supports `**bold**`, `_italic_`, and `\`escapes\`` <!-- ✅ -->

## Format descriptions and version references

Supports CSV/JSON file upload with validation <!-- ✅ -->
Interactive Swagger/OpenAPI documentation <!-- ✅ -->
Backend services (Python 3.11+) for data processing <!-- ✅ -->
React SPA frontend (v19.1.0) with Vite build system <!-- ✅ -->
Legacy support (v1.2.3) maintained for compatibility <!-- ✅ -->

## Non-path slash usage (category labels and concept pairs)

Integration/E2E testing strategy <!-- ✅ -->
Value/Effort custom fields <!-- ✅ -->
Choose between feature/module organization <!-- ✅ -->
Files were added/updated successfully <!-- ✅ -->
You can adapt/extend this pattern <!-- ✅ -->
Track start/complete timestamps <!-- ✅ -->
Use the lowest/most efficient approach <!-- ✅ -->
The pass/fail criteria are documented <!-- ✅ -->
Either/or decision points require review <!-- ✅ -->
True/false configuration values <!-- ✅ -->

## HTML semantic code tags should not trigger BCE001

Press <kbd>Ctrl+C</kbd> to copy. <!-- ✅ -->
The <code>NODE_ENV</code> variable controls the environment. <!-- ✅ -->
Use <samp>error_output</samp> to check the result. <!-- ✅ -->
The <var>user_name</var> parameter is required. <!-- ✅ -->

## Pure alphabetic slash-separated words should not be flagged as paths

Organize by features/options/settings in the configuration. <!-- ✅ -->
The models/views/controllers pattern is common in MVC. <!-- ✅ -->
Support create/update/delete operations on resources. <!-- ✅ -->

## Bracket placeholders should not be flagged

Use [some_variable] as a placeholder in templates. <!-- ✅ -->
The [user_name] field is required in the config. <!-- ✅ -->
See [api_key] in the settings panel. <!-- ✅ -->
