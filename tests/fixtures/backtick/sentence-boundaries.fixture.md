# Sentence boundary edge cases

This fixture tests that the backtick-code-elements rule correctly handles text that ends with a period followed by a capitalized word (sentence boundaries) and does not incorrectly flag them as filenames.

## Should NOT be flagged (sentence endings)

Find the serial number of your computer. New cybersecurity protections are available.

Select Next to continue. Go to System Settings for configuration.

Press Z on your keyboard. An exception applies for certain keys.

Next week the committee will meet. The Data Architecture team is managing this.

Juan Pérez is the chief executive. The sales director is Jane Doe.

Contact them for details. The console will read the output.

Save your work to the file. Then close the application.

Review the security policy. It contains important guidelines.

## Should be flagged (actual filenames)

Edit the `config.yaml` file and restart the service.

Check the `settings.json` configuration for errors.

The `reference.docx` template should be updated.

Move files to the `output.csv` location.

Import from `utils.py` in your module.

## Edge cases - period in middle of sentence

The server.js file handles routing. Open it in your editor.

Check the package.json dependencies. Update them as needed.

Some companies use example.com as placeholder. This is standard practice.

The file config.prod.yaml contains production settings. Use it carefully.

## Mixed scenarios

Access your computer. New features include the `auto-sync.sh` script.

The system.conf file was updated. New parameters are available.

Read the `README.md` file. Then follow the instructions carefully.
