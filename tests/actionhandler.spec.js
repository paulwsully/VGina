import { test, expect } from '@playwright/test';
import { handleCommonActions, defaultActions} from '../main/actionHandler.js';

test.describe('describe title', () => {
  test('test title', ({}) => {
    expect(1 + 1).toEqual(2);
  });
});
