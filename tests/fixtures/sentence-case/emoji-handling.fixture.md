# Emoji handling test fixture

## Basic emoji patterns (should NOT be flagged)
# 🎉 Party time <!-- ✅ -->
# 🚀 Quick start <!-- ✅ -->
# ✨ The future <!-- ✅ -->
# 📝 Task list <!-- ✅ -->

## Complex emoji sequences (should NOT be flagged)
# 🧑‍⚕️ Health professional <!-- ✅ -->
# 👨‍💻 Software developer <!-- ✅ -->
# 👨‍👩‍👧‍👦 Family planning <!-- ✅ -->

## List items with emoji bold text (should NOT be flagged)
- **🎯 Target achievement** - goal setting <!-- ✅ -->
- **🔧 Configuration management** - system setup <!-- ✅ -->
- **📊 Data analysis** - insights <!-- ✅ -->

## Incorrect casing after emoji (should be flagged)
# 🎉 party time <!-- ❌ -->
# 🚀 quick start <!-- ❌ -->
# ✨ the future <!-- ❌ -->
# 📝 task List <!-- ❌ -->

## Complex emoji with incorrect casing (should be flagged)
# 🧑‍⚕️ health professional <!-- ❌ -->
# 👨‍💻 software Developer <!-- ❌ -->

## Bold text with incorrect casing (should be flagged)
- **🎯 target Achievement** - should be flagged <!-- ❌ -->
- **🔧 configuration Management** - should be flagged <!-- ❌ -->