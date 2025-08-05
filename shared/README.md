# Shared Package

This directory contains shared code, types, and utilities that are used across both the frontend and backend of the Chat Me application.

## Structure

- `constants/` - Shared constants and configuration values
- `types/` - TypeScript type definitions used across the application
- `utils/` - Utility functions that can be used in both frontend and backend

## Usage

### Frontend
```typescript
import { API_BASE_URL } from '../shared/constants/api';
import { User } from '../shared/types/common';
```

### Backend
```python
# In a real implementation, you might use a tool like TypeScript
# to generate Python types from the shared TypeScript definitions
```

## Benefits

1. **Consistency** - Ensures the same types and constants are used across the entire application
2. **DRY Principle** - Avoids duplication of common code
3. **Maintainability** - Changes to shared code only need to be made in one place
4. **Type Safety** - Shared TypeScript types ensure consistency between frontend and backend contracts

## Adding New Shared Code

When adding new shared code:

1. Consider if it's truly shared between frontend and backend
2. Place it in the appropriate subdirectory
3. Export it from the relevant index file
4. Update documentation if necessary

## Future Enhancements

- Consider publishing this as a separate npm package for better versioning
- Add automated tests for shared utilities
- Set up build process to generate different formats (ESM, CommonJS, etc.)