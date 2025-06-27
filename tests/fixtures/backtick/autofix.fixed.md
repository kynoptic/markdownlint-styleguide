# Auto-fix fixture for backtick-code-elements

## Multiple code elements on the same line

Run `npm install` to set up your project and then install debug@latest. <!-- ✅ -->

## File paths and commands

Look in the `src/utils` directory and run `git clone` https://github.com/user/repo.git <!-- ✅ -->

## Multiple elements spread across the document

Edit `config.yaml` in the settings/ folder <!-- ✅ -->

Run ./`build.sh` to compile the project <!-- ✅ -->

Add `import os` at the top of your script <!-- ✅ -->

## Nested code elements (should only fix outer ones)

The command `echo PATH=/usr/bin` sets your path variable to /`usr/bin` <!-- ✅ -->

## Elements after punctuation

Open `readme.md`, `config.ini`, and `.env` for configuration. <!-- ✅ -->
