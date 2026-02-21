# Fixture for no-empty-list-items rule

## Valid cases (should not trigger the rule)

- First item <!-- ✅ -->
- Second item <!-- ✅ -->
- Third item <!-- ✅ -->

* Star item <!-- ✅ -->
* Another star <!-- ✅ -->

+ Plus item <!-- ✅ -->
+ Another plus <!-- ✅ -->

1. Ordered first <!-- ✅ -->
2. Ordered second <!-- ✅ -->

- Item with nested list <!-- ✅ -->
  - Nested item <!-- ✅ -->

## Invalid cases (should trigger the rule)

### Unordered empty items

-  <!-- ❌ -->

*  <!-- ❌ -->

+  <!-- ❌ -->

### Ordered empty items

1.  <!-- ❌ -->

2.  <!-- ❌ -->

### Mixed with valid items

- Valid item <!-- ✅ -->
-  <!-- ❌ -->
- Another valid item <!-- ✅ -->

### Whitespace-only content

-   <!-- ❌ -->
*    <!-- ❌ -->
1.    <!-- ❌ -->
