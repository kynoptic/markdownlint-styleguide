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
 * * ✅ = This heading should PASS the rule check (no violations)
 * * ❌ = This heading should FAIL the rule check (rule should report a violation)
 -->

<!-- markdownlint-disable MD025 -->

<!-- 
NOTE: The sentence-case-heading rule violations in this file are INTENTIONAL.
They are used to test the custom rule's ability to detect various heading case issues.
-->

# Fixture for `basic-sentence-case-heading` (BSCH001) <!-- ✅ -->

# Simple sentence case <!-- ✅ -->

# Keywords in markdown <!-- ✅ -->

# I am a heading <!-- ✅ -->

# API is a common acronym <!-- ✅ -->

# Nasa is also fine <!-- ✅ -->

## [`1.0.0`] - 2025-06-03 <!-- ✅ -->

# What is markdownlint? <!-- ✅ -->

# How to use `markdownlint-cli2` effectively <!-- ✅ -->

# Visiting Paris in the spring <!-- ✅ -->

# How the FBI approached Facebook <!-- ✅ -->

# Why I think this matters — a brief overview <!-- ✅ -->

# Title Case Heading Should Fail <!-- ❌ -->

# FIRST example of poor heading case <!-- ❌ -->

# First word Has mixedCase <!-- ❌ -->

# SYSTEM FAILURE DETECTED <!-- ❌ -->

# This Is not correct <!-- ❌ -->

# Visiting paris during summer <!-- ❌ -->

# API Is Not Responding <!-- ❌ -->

# API GOOD <!-- ❌ -->

# css <!-- ❌ --> <!-- intentionally lowercase single word -->

# api <!-- ❌ -->

# Why This Should Fail <!-- ❌ -->

# Understanding The API Limits <!-- ❌ -->

# Visiting paris in the spring <!-- ❌ -->

# Using JSON and Html with CSS <!-- ❌ -->

# How to use Api Keys <!-- ❌ -->

# Low-cost solutions for small teams <!-- ✅ -->

# Low-Cost Solutions For Small Teams <!-- ❌ -->

# 10 ways to improve performance <!-- ✅ -->

# 10 Ways To Improve Performance <!-- ❌ -->

# Don't panic <!-- ✅ -->

# Don't Panic <!-- ❌ -->

# don't panic <!-- ❌ -->

# Using GitHub features <!-- ✅ -->

# Tools from github <!-- ❌ -->
