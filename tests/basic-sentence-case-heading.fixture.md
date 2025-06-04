<!-- markdownlint-disable MD041 MD007 MD032 -->
<!--
 * Test fixture for the sentence-case-heading (SC001) custom markdownlint rule
 *
 * This file contains examples of both valid and invalid markdown headings according to the
 * sentence case rule. Each heading is annotated with an HTML comment indicating whether it
 * should pass (✅) or fail (❌) the rule check.
 *
 * The sentence case rule requires:
 *
 * * First word capitalized
 * * All other words lowercase (except acronyms ≤ 4 letters and the pronoun "I")
 * * No all-caps headings
 *
 * Annotations:
 *
 * * <!-- ✅ --> = This heading should PASS the rule check (no violations)
 * * <!-- ❌ --> = This heading should FAIL the rule check (rule should report a violation)
 */

<!-- markdownlint-disable MD025 -->

<!-- 
NOTE: The sentence-case-heading rule violations in this file are INTENTIONAL.
They are used to test the custom rule's ability to detect various heading case issues.
-->

# Fixture for `basic-sentence-case-heading` (BSCH001) <!-- ✅ -->

# Simple sentence case <!-- ✅ -->

# Word <!-- ✅ -->

# I am a heading <!-- ✅ -->

# API is a common acronym <!-- ✅ -->

# Nasa is also fine <!-- ✅ -->

# Title Case Heading Should Fail <!-- ❌ -->

# FIRST word all caps but long <!-- ❌ -->

# First word Has mixedCase <!-- ❌ -->

# ALL CAPS HEADING IS BAD <!-- ❌ -->

# Sentence with Another word capitalized <!-- ❌ -->

# Sentence with Proper Noun <!-- ❌ -->

# API Is Good <!-- ❌ -->

# API GOOD <!-- ❌ -->

# css <!-- ❌ -->

# api <!-- ❌ -->
