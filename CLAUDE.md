# Claude Code Guidelines

## Development Process

- **TDD**: Always start with tests before implementing changes

## Testing

- **Test Selectors**: Always use data attributes for element selectors in integration tests (e.g., `data-testid="element-name"`). Never use class names, tags, or other attributes that may change during refactoring
