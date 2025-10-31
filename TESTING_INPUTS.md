# Testing Inputs for Comparison & Validation Tool

Visit: http://localhost:3000/comparison-tool

## 1. JSON Validate Mode

### ✅ Valid JSON Test Cases

#### Test Case 1: Simple Object
```json
{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com"
}
```

#### Test Case 2: Nested Object with Arrays
```json
{
  "user": {
    "id": 1,
    "name": "Alice Smith",
    "roles": ["admin", "user"],
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  },
  "products": [
    {
      "id": 101,
      "name": "Laptop",
      "price": 999.99
    },
    {
      "id": 102,
      "name": "Mouse",
      "price": 29.99
    }
  ]
}
```

#### Test Case 3: Complex Data Structure
```json
{
  "company": "TechCorp",
  "employees": [
    {
      "id": 1,
      "name": "Sarah Johnson",
      "department": "Engineering",
      "skills": ["JavaScript", "Python", "React"],
      "projects": [
        {
          "name": "Project Alpha",
          "status": "completed",
          "startDate": "2024-01-15"
        }
      ]
    }
  ],
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2024-10-30T10:30:00Z"
  }
}
```

### ❌ Invalid JSON Test Cases

#### Test Case 4: Missing Closing Brace
```json
{
  "name": "John",
  "age": 30
```
**Expected Error**: Unexpected end of JSON input

#### Test Case 5: Trailing Comma
```json
{
  "name": "John",
  "age": 30,
}
```
**Expected Error**: JSON parsing error

#### Test Case 6: Single Quotes (Invalid)
```json
{
  'name': 'John',
  'age': 30
}
```
**Expected Error**: Unexpected token

#### Test Case 7: Unquoted Keys
```json
{
  name: "John",
  age: 30
}
```
**Expected Error**: Unexpected token

#### Test Case 8: Missing Comma
```json
{
  "name": "John"
  "age": 30
}
```
**Expected Error**: Unexpected token

---

## 2. JSON Compare Mode

### Test Case 1: Identical JSON Objects
**Left:**
```json
{
  "name": "Alice",
  "age": 25,
  "city": "New York"
}
```

**Right:**
```json
{
  "name": "Alice",
  "age": 25,
  "city": "New York"
}
```
**Expected Result**: ✅ Content is identical

---

### Test Case 2: Different Values
**Left:**
```json
{
  "name": "Alice",
  "age": 25,
  "city": "New York"
}
```

**Right:**
```json
{
  "name": "Alice",
  "age": 30,
  "city": "Los Angeles"
}
```
**Expected Result**: ❌ Found 2 differences (age and city)

---

### Test Case 3: Whitespace Difference (Test "Ignore Whitespace" Toggle)
**Left:**
```json
{"name":"Alice","age":25}
```

**Right:**
```json
{
  "name": "Alice",
  "age": 25
}
```
**Expected Result**:
- With "Ignore Whitespace" ON: ✅ Identical
- With "Ignore Whitespace" OFF: ❌ Different

---

### Test Case 4: Case Sensitivity (Test "Case Sensitive" Toggle)
**Left:**
```json
{
  "name": "ALICE",
  "status": "ACTIVE"
}
```

**Right:**
```json
{
  "name": "alice",
  "status": "active"
}
```
**Expected Result**:
- With "Case Sensitive" ON: ❌ Found 2 differences
- With "Case Sensitive" OFF: ✅ Identical

---

### Test Case 5: Key Order (Test "Ignore Key Order" Toggle)
**Left:**
```json
{
  "name": "Alice",
  "age": 25,
  "city": "New York"
}
```

**Right:**
```json
{
  "city": "New York",
  "name": "Alice",
  "age": 25
}
```
**Expected Result**:
- With "Ignore Key Order" ON: ✅ Identical
- With "Ignore Key Order" OFF: ❌ Different (property order matters)

---

### Test Case 6: Missing Property
**Left:**
```json
{
  "id": 1,
  "name": "Product A",
  "price": 99.99,
  "inStock": true
}
```

**Right:**
```json
{
  "id": 1,
  "name": "Product A",
  "price": 99.99
}
```
**Expected Result**: ❌ Found 1 difference (inStock property removed)

---

### Test Case 7: Added Property
**Left:**
```json
{
  "username": "john_doe",
  "email": "john@example.com"
}
```

**Right:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "verified": true
}
```
**Expected Result**: ❌ Found 1 difference (verified property added)

---

### Test Case 8: Nested Object Differences
**Left:**
```json
{
  "user": {
    "name": "Alice",
    "address": {
      "street": "123 Main St",
      "city": "Boston"
    }
  }
}
```

**Right:**
```json
{
  "user": {
    "name": "Alice",
    "address": {
      "street": "456 Oak Ave",
      "city": "Boston"
    }
  }
}
```
**Expected Result**: ❌ Found 1 difference (user.address.street)

---

### Test Case 9: Array Differences
**Left:**
```json
{
  "tags": ["javascript", "react", "nodejs"]
}
```

**Right:**
```json
{
  "tags": ["javascript", "vue", "nodejs"]
}
```
**Expected Result**: ❌ Found 1 difference (tags[1])

---

## 3. XML Validate Mode

### ✅ Valid XML Test Cases

#### Test Case 1: Simple XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<book>
  <title>Learn XML</title>
  <author>John Smith</author>
  <year>2024</year>
</book>
```

#### Test Case 2: XML with Attributes
```xml
<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="1" category="programming">
    <title lang="en">JavaScript Guide</title>
    <author>Jane Doe</author>
    <price currency="USD">49.99</price>
  </book>
  <book id="2" category="database">
    <title lang="en">SQL Mastery</title>
    <author>Bob Johnson</author>
    <price currency="USD">39.99</price>
  </book>
</library>
```

#### Test Case 3: Complex XML Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<company>
  <name>TechCorp</name>
  <employees>
    <employee id="E001">
      <name>Sarah Wilson</name>
      <department>Engineering</department>
      <skills>
        <skill>JavaScript</skill>
        <skill>Python</skill>
        <skill>React</skill>
      </skills>
    </employee>
    <employee id="E002">
      <name>Mike Davis</name>
      <department>Design</department>
      <skills>
        <skill>Figma</skill>
        <skill>Photoshop</skill>
      </skills>
    </employee>
  </employees>
</company>
```

### ❌ Invalid XML Test Cases

#### Test Case 4: Missing Closing Tag
```xml
<?xml version="1.0" encoding="UTF-8"?>
<book>
  <title>Learn XML</title>
  <author>John Smith
</book>
```
**Expected Error**: XML parsing error

#### Test Case 5: Mismatched Tags
```xml
<?xml version="1.0" encoding="UTF-8"?>
<book>
  <title>Learn XML</title>
  <author>John Smith</authur>
</book>
```
**Expected Error**: Mismatched tag

#### Test Case 6: Unclosed Attribute
```xml
<?xml version="1.0" encoding="UTF-8"?>
<book id="1>
  <title>Learn XML</title>
</book>
```
**Expected Error**: XML parsing error

#### Test Case 7: Special Characters Not Escaped
```xml
<?xml version="1.0" encoding="UTF-8"?>
<book>
  <title>Learn XML & JSON</title>
  <description>Price < $50</description>
</book>
```
**Expected Error**: May cause parsing issues (should use &amp; and &lt;)

---

## 4. XML Compare Mode

### Test Case 1: Identical XML Documents
**Left:**
```xml
<?xml version="1.0"?>
<person>
  <name>Alice</name>
  <age>25</age>
</person>
```

**Right:**
```xml
<?xml version="1.0"?>
<person>
  <name>Alice</name>
  <age>25</age>
</person>
```
**Expected Result**: ✅ Content is identical

---

### Test Case 2: Different Values
**Left:**
```xml
<?xml version="1.0"?>
<product>
  <name>Laptop</name>
  <price>999.99</price>
</product>
```

**Right:**
```xml
<?xml version="1.0"?>
<product>
  <name>Desktop</name>
  <price>1299.99</price>
</product>
```
**Expected Result**: ❌ Content differs

---

### Test Case 3: Whitespace Difference (Test "Ignore Whitespace" Toggle)
**Left:**
```xml
<book><title>Test</title><author>John</author></book>
```

**Right:**
```xml
<book>
  <title>Test</title>
  <author>John</author>
</book>
```
**Expected Result**:
- With "Ignore Whitespace" ON: ✅ Identical
- With "Ignore Whitespace" OFF: ❌ Different

---

### Test Case 4: Case Sensitivity (Test "Case Sensitive" Toggle)
**Left:**
```xml
<Person>
  <Name>ALICE</Name>
</Person>
```

**Right:**
```xml
<person>
  <name>alice</name>
</person>
```
**Expected Result**:
- With "Case Sensitive" ON: ❌ Different
- With "Case Sensitive" OFF: ✅ Identical

---

## 5. Text Compare Mode

### Test Case 1: Identical Text
**Left:**
```
Hello World
This is a test
Line 3
```

**Right:**
```
Hello World
This is a test
Line 3
```
**Expected Result**: ✅ Content is identical

---

### Test Case 2: Different Lines
**Left:**
```
Hello World
This is a test
Line 3
The quick brown fox
```

**Right:**
```
Hello World
This is a TEST
Line 3
The lazy dog
```
**Expected Result**: ❌ Found 2 differences (Line 2 and Line 4)

---

### Test Case 3: Whitespace Differences (Test "Ignore Whitespace" Toggle)
**Left:**
```
HelloWorld
TestLine
```

**Right:**
```
Hello World
Test Line
```
**Expected Result**:
- With "Ignore Whitespace" ON: ✅ Identical
- With "Ignore Whitespace" OFF: ❌ Different

---

### Test Case 4: Case Differences (Test "Case Sensitive" Toggle)
**Left:**
```
HELLO WORLD
THIS IS A TEST
```

**Right:**
```
hello world
this is a test
```
**Expected Result**:
- With "Case Sensitive" ON: ❌ Found 2 differences
- With "Case Sensitive" OFF: ✅ Identical

---

### Test Case 5: Extra Lines
**Left:**
```
Line 1
Line 2
Line 3
```

**Right:**
```
Line 1
Line 2
Line 3
Line 4
Line 5
```
**Expected Result**: ❌ Found 2 differences (Line 4 and Line 5 added)

---

### Test Case 6: Code Comparison
**Left:**
```javascript
function hello(name) {
  console.log("Hello " + name);
  return true;
}
```

**Right:**
```javascript
function hello(name) {
  console.log("Hi " + name);
  return false;
}
```
**Expected Result**: ❌ Found 2 differences (Line 2 and Line 3)

---

### Test Case 7: Multi-line Text Block
**Left:**
```
Lorem ipsum dolor sit amet,
consectetur adipiscing elit.
Sed do eiusmod tempor incididunt
ut labore et dolore magna aliqua.
```

**Right:**
```
Lorem ipsum dolor sit amet,
consectetur adipiscing elit.
Sed do eiusmod TEMPOR incididunt
ut labore et dolore MAGNA aliqua.
```
**Expected Result**: ❌ Found 2 differences (Line 3 and Line 4)

---

## Testing Checklist

### Visual Design Tests:
- [ ] Gradient header displays correctly (purple → blue → pink)
- [ ] IONIXX logo appears with white background
- [ ] Security badge shows shield icon with text
- [ ] Clear All button has refresh icon
- [ ] Tabs have rounded pill shape with purple active state
- [ ] Toggle switches animate smoothly
- [ ] Text areas have monospace font
- [ ] Results panel shows with appropriate colors (green for success, red for errors, blue for info)
- [ ] Left/Right labels have color dots (purple and blue)

### Responsive Design Tests:
- [ ] Open on mobile (< 768px) - dual editors should stack vertically
- [ ] Open on tablet (768px - 1024px) - should adjust spacing
- [ ] Open on desktop (> 1024px) - dual editors side by side

### Functionality Tests:
- [ ] All validation modes detect valid content
- [ ] All validation modes detect invalid content with error messages
- [ ] "Ignore Whitespace" toggle works correctly
- [ ] "Case Sensitive" toggle works correctly
- [ ] "Ignore Key Order" toggle works correctly (JSON Compare only)
- [ ] Clear All button clears all inputs and results
- [ ] Switching tabs clears previous results
- [ ] Results panel displays differences clearly

### Edge Cases:
- [ ] Empty content validation
- [ ] Very long content (performance test)
- [ ] Special characters in content
- [ ] Unicode characters
- [ ] Mixed line endings (CRLF vs LF)

---

## Quick Copy-Paste Test Data

### Valid JSON:
```json
{"name":"Test","value":123,"active":true}
```

### Invalid JSON:
```json
{"name":"Test","value":123,}
```

### Valid XML:
```xml
<root><item>Test</item></root>
```

### Invalid XML:
```xml
<root><item>Test</root>
```

Enjoy testing! 🚀
