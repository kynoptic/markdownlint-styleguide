<!-- markdownlint-disable MD034 -->
<!-- markdownlint-disable MD035 -->
<!-- markdownlint-disable MD036 -->
<!-- markdownlint-disable MD037 -->
<!-- markdownlint-disable MD038 -->
<!-- markdownlint-disable MD039 -->
<!-- markdownlint-disable MD040 -->
<!-- markdownlint-disable MD041 -->

# Bold text position detection - CRITICAL false positive fix

## Passing: Bold text as first content (should validate)

- **Dependency-auditor**: Multi-ecosystem scanning <!-- ✅ -->
- **Secrets-scanner**: Credential detection <!-- ✅ -->
- **Api-driven**: Should suggest API-driven <!-- ❌ -->
- **json parser**: Should be JSON parser <!-- ❌ -->
- 🔐 **Secrets-scanner**: Credential detection (emoji is decoration) <!-- ✅ -->
- 🎉 **Welcome guide**: Getting started <!-- ✅ -->

## Passing: Bold text in middle/end (should NOT validate - false positives)

- Line 57: **sentence-case-heading** <!-- ✅ -->
- See the **backtick-code-elements** rule for details <!-- ✅ -->
- Text—**never hand-edit** these files <!-- ✅ -->
- The **main** branch is protected <!-- ✅ -->
- Check out the **README** for more info <!-- ✅ -->
- For more details, see **CONTRIBUTING.md** <!-- ✅ -->
- This refers to **Line 42** in the code <!-- ✅ -->
- Referenced in **Section 3.2** above <!-- ✅ -->
- As mentioned in **Chapter Five** earlier <!-- ✅ -->
- This is discussed in **Appendix B** <!-- ✅ -->
- The term **API Gateway** is used here <!-- ✅ -->
- Update the **VERSION** file <!-- ✅ -->
- Modify the **CHANGELOG** section <!-- ✅ -->
- Run **npm install** first <!-- ✅ -->
- Execute **git status** to check <!-- ✅ -->

## Failing: Bold text as first content with case violations

- **This Is Title Case**: Should be sentence case <!-- ❌ -->
- **all lowercase**: Should be capitalized <!-- ❌ -->
- **ALL CAPS TEXT**: Should be sentence case <!-- ❌ -->
- 🚀 **All Caps After Emoji**: Should be sentence case <!-- ❌ -->

## Edge cases: Multiple emoji sequences

- 🔐🎉 **Security feature**: Multiple emoji before bold <!-- ✅ -->
- 🚀🔥💡 **Three emoji**: Triple emoji prefix <!-- ✅ -->
- 👨‍💻 **ZWJ sequence**: Emoji with Zero Width Joiner <!-- ✅ -->
- 🏴󠁧󠁢󠁥󠁮󠁧󠁿 **Flag sequence**: Complex emoji flag <!-- ✅ -->

## Edge cases: Nested and empty bold

- Text with **nested **bold** text** in middle <!-- ✅ -->
- Start with **outer **inner** text** as first <!-- ✅ -->
- ** ** Empty bold with spaces <!-- ✅ -->
- **** Empty bold without spaces <!-- ✅ -->
