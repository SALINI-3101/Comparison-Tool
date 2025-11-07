import {
  validateJSON,
  validateXML,
  compareJSON,
  compareXML,
  compareText,
} from '../comparison';

describe('validateJSON', () => {
  it('should validate correct JSON', () => {
    const result = validateJSON('{"name": "test"}');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.message).toContain('Valid JSON');
  });

  it('should reject empty content', () => {
    const result = validateJSON('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Content is empty');
  });

  it('should reject invalid JSON', () => {
    const result = validateJSON('{invalid}');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateXML', () => {
  it('should validate correct XML', () => {
    const result = validateXML('<root><item>test</item></root>');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.message).toContain('Valid XML');
  });

  it('should reject empty content', () => {
    const result = validateXML('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Content is empty');
  });
});

describe('compareJSON', () => {
  it('should identify identical JSON objects', () => {
    const left = '{"name": "test", "value": 123}';
    const right = '{"name": "test", "value": 123}';
    const result = compareJSON(left, right);
    expect(result.areEqual).toBe(true);
    expect(result.differences).toHaveLength(0);
  });

  it('should identify differences in JSON objects', () => {
    const left = '{"name": "test", "value": 123}';
    const right = '{"name": "test", "value": 456}';
    const result = compareJSON(left, right);
    expect(result.areEqual).toBe(false);
    expect(result.differences.length).toBeGreaterThan(0);
  });

  it('should handle case sensitivity option', () => {
    const left = '{"name": "TEST"}';
    const right = '{"name": "test"}';
    const resultSensitive = compareJSON(left, right, { caseSensitive: true });
    expect(resultSensitive.areEqual).toBe(false);

    const resultInsensitive = compareJSON(left, right, { caseSensitive: false });
    expect(resultInsensitive.areEqual).toBe(true);
  });

  it('should handle empty content', () => {
    const result = compareJSON('', '');
    expect(result.areEqual).toBe(false);
    expect(result.message).toContain('must be provided');
  });
});

describe('compareXML', () => {
  it('should identify identical XML', () => {
    const left = '<root><item>test</item></root>';
    const right = '<root><item>test</item></root>';
    const result = compareXML(left, right);
    expect(result.areEqual).toBe(true);
  });

  it('should identify differences in XML', () => {
    const left = '<root><item>test1</item></root>';
    const right = '<root><item>test2</item></root>';
    const result = compareXML(left, right);
    expect(result.areEqual).toBe(false);
  });

  it('should handle whitespace option', () => {
    const left = '<root>  <item>test</item>  </root>';
    const right = '<root><item>test</item></root>';
    const result = compareXML(left, right, { ignoreWhitespace: true });
    expect(result.areEqual).toBe(true);
  });
});

describe('compareText', () => {
  it('should identify identical text', () => {
    const result = compareText('hello world', 'hello world');
    expect(result.areEqual).toBe(true);
    expect(result.differences).toHaveLength(0);
  });

  it('should identify text differences', () => {
    const result = compareText('hello world', 'hello there');
    expect(result.areEqual).toBe(false);
    expect(result.differences.length).toBeGreaterThan(0);
  });

  it('should handle multiline text', () => {
    const left = 'line1\nline2\nline3';
    const right = 'line1\nline2\nline4';
    const result = compareText(left, right);
    expect(result.areEqual).toBe(false);
    expect(result.differences.length).toBe(1);
  });

  it('should handle case sensitivity', () => {
    const result = compareText('HELLO', 'hello', { caseSensitive: false });
    expect(result.areEqual).toBe(true);
  });

  it('should handle empty content', () => {
    const result = compareText('', '');
    expect(result.areEqual).toBe(true);
    expect(result.message).toBe('Both contents are empty');
  });
});
