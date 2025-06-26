# File path regex validation

This document tests the `backtick-code-elements` rule's file path detection.

## False positives (Should NOT be flagged)

- This is `node.js` not a path. <!-- ✅ -->
- Visit `example.com` for more info. <!-- ✅ -->
- Check `my.app.config` file. <!-- ✅ -->
- The version is `v1.2.3`. <!-- ✅ -->
- Use `foo-bar.baz` for the setting. <!-- ✅ -->
- The command is `git.exe`. <!-- ✅ -->
- It's a `test.py` script. <!-- ✅ -->
- This is `a.b.c.d`. <!-- ✅ -->

## True positives (Should BE flagged)

- Open `./src/index.js` to start. <!-- ❌ -->
- Go to `../data/file.txt`. <!-- ❌ -->
- The configuration is in `C:\Program Files\App\config.ini`. <!-- ❌ -->
- Check `/var/log/syslog`. <!-- ❌ -->
- Update `~/Documents/report.pdf`. <!-- ❌ -->
- Use `.\scripts\setup.ps1`. <!-- ❌ -->
- Path with spaces: `C:\My Documents\file with spaces.txt`. <!-- ❌ -->
- Path with hyphens: `/usr/local/bin/my-script-v1.0.sh`. <!-- ❌ -->
- Path with dots: `./dist/app.min.js`. <!-- ❌ -->
- Mixed separators: `C:/Users/data/file.csv`. <!-- ❌ -->
