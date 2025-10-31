# Unicode and internationalization test fixture

## Accented Latin characters (should NOT be flagged)
# Étude de cas <!-- ✅ -->
# Résumé professionnel <!-- ✅ -->
# Configuración del sistema <!-- ✅ -->
# Übersicht der Funktionen <!-- ✅ -->

## Accented Latin with emoji (should NOT be flagged)
# 🎉 Étude de cas <!-- ✅ -->
# 🚀 Configuración rápida <!-- ✅ -->
# 📝 Übersicht <!-- ✅ -->

## CJK characters (should NOT be flagged - no case distinction)
# 日本語ガイド <!-- ✅ -->
# 使用手册 <!-- ✅ -->
# 한국어 문서 <!-- ✅ -->

## CJK with emoji (should NOT be flagged)
# 🎉 日本語ガイド <!-- ✅ -->
# 🚀 使用手册 <!-- ✅ -->
# 📝 한국어 문서 <!-- ✅ -->

## Greek characters (should NOT be flagged)
# Οδηγός χρήστη <!-- ✅ -->
# Γρήγορη εκκίνηση <!-- ✅ -->

## Greek with emoji (should NOT be flagged)
# 🎉 Οδηγός χρήστη <!-- ✅ -->
# 🚀 Γρήγορη εκκίνηση <!-- ✅ -->

## Cyrillic characters (should NOT be flagged)
# Руководство пользователя <!-- ✅ -->
# Быстрый старт <!-- ✅ -->

## Cyrillic with emoji (should NOT be flagged)
# 🎉 Руководство пользователя <!-- ✅ -->
# 🚀 Быстрый старт <!-- ✅ -->

## RTL scripts - Arabic (should NOT be flagged - no case distinction)
# دليل المستخدم <!-- ✅ -->
# البدء السريع <!-- ✅ -->

## RTL scripts - Hebrew (should NOT be flagged - no case distinction)
# מדריך משתמש <!-- ✅ -->
# התחלה מהירה <!-- ✅ -->

## RTL with emoji (should NOT be flagged)
# 🎉 دليل المستخدم <!-- ✅ -->
# 🚀 מדריך משתמש <!-- ✅ -->

## Mixed scripts - Latin and CJK (should NOT be flagged)
# API ドキュメント <!-- ✅ -->
# GitHub アクション <!-- ✅ -->
# CSS 样式指南 <!-- ✅ -->
# Node.js 한국어 가이드 <!-- ✅ -->

## Mixed scripts with emoji (should NOT be flagged)
# 🎉 API ドキュメント <!-- ✅ -->
# 🚀 GitHub アクション <!-- ✅ -->

## Bold text with accented Latin (should NOT be flagged)
- **Étude de cas complète** - comprehensive case study <!-- ✅ -->
- **Configuración del sistema** - system configuration <!-- ✅ -->

## Bold text with mixed scripts (should NOT be flagged)
- **API ドキュメント** - API documentation <!-- ✅ -->
- **GitHub アクション** - GitHub Actions <!-- ✅ -->

## Incorrect casing - accented Latin (should be flagged)
# étude de cas <!-- ❌ -->
# résumé professionnel <!-- ❌ -->
# configuración del sistema <!-- ❌ -->
# übersicht der Funktionen <!-- ❌ -->

## Incorrect casing with emoji - accented Latin (should be flagged)
# 🎉 étude de cas <!-- ❌ -->
# 🚀 configuración rápida <!-- ❌ -->
# 📝 résumé <!-- ❌ -->

## Incorrect casing - Greek (should be flagged)
# οδηγός χρήστη <!-- ❌ -->
# γρήγορη εκκίνηση <!-- ❌ -->

## Incorrect casing with emoji - Greek (should be flagged)
# 🎉 οδηγός χρήστη <!-- ❌ -->
# 🚀 γρήγορη εκκίνηση <!-- ❌ -->

## Incorrect casing - Cyrillic (should be flagged)
# руководство пользователя <!-- ❌ -->
# быстрый старт <!-- ❌ -->

## Incorrect casing with emoji - Cyrillic (should be flagged)
# 🎉 руководство пользователя <!-- ❌ -->
# 🚀 быстрый старт <!-- ❌ -->

## Incorrect casing - mixed scripts (should be flagged)
# api ドキュメント <!-- ❌ -->
# github アクション <!-- ❌ -->

## Bold text incorrect casing - accented Latin (should be flagged)
- **étude de Cas** - should be flagged <!-- ❌ -->
- **configuración Del Sistema** - should be flagged <!-- ❌ -->

## Bold text incorrect casing - mixed scripts (should be flagged)
- **api ドキュメント** - should be flagged <!-- ❌ -->
- **github アクション** - should be flagged <!-- ❌ -->
