import { test, expect } from '@playwright/test';
import { actionResponse, defaultActions} from '../main/actionHandler.js';

test.describe('Support {s} sentence matching.', () => {
  test('No match', ({}) => {
    expect(actionResponse("line match", "", "nomatch", "Matched", true)).toEqual(false);
  });

  test('Case insensitive on search string', ({}) => {
    expect(actionResponse("line match", "", "match", "Matched", true)).toEqual("matched");
    expect(actionResponse("line match", "", "Match", "Matched", true)).toEqual("matched");
  });

  test('Case insensitive on response string', ({}) => {
    expect(actionResponse("line match", "", "match", "Matched", true)).toEqual("matched");
    expect(actionResponse("line match", "", "match", "matched", true)).toEqual("matched");
  });

  test('Case insensitive on line.', ({}) => {
    expect(actionResponse("line MATCH", "", "match", "matched", true)).toEqual("matched");
    expect(actionResponse("line MaTcH", "", "match", "matched", true)).toEqual("matched");
  });

  test('Match replace a group', ({}) => {
    expect(actionResponse("a sentence match", "", "{S} match", "matched", true)).toEqual("matched");
  });

  test('Group name case does not matter.', ({}) => {
    expect(actionResponse("a sentence match", "", "{s} match", "{S} matched", true)).toEqual("a sentence matched");
    expect(actionResponse("a sentence match", "", "{S} match", "{s} matched", true)).toEqual("a sentence matched");
  });

  test('Matching group cannot be have the same name, match fails.', ({}) => {
    expect(actionResponse("a sentence match another sentence", "", "{S} match {S}", "match", true)).toEqual(false);
  });

  test('Reponse can have multiple matching groups of the same name.', ({}) => {
    expect(actionResponse("a sentence match another sentence", "", "{S} match", "{S} matched {S}", true)).toEqual("a sentence matched a sentence");
  });

  test('Responses will includes {S} even if not matched. Gina does this.', ({}) => {
    expect(actionResponse("a sentence match another sentence", "", "match", "{S} matched {S}", true)).toEqual("{s} matched {s}");
  });

  test('Support multiple group names {S}, {Sd+}', ({}) => {
    expect(actionResponse("a sentence match another sentence", "", "{S0} match", "{S0} matched", true)).toEqual("a sentence matched");
    expect(actionResponse("a sentence match another sentence", "", "{S9000} match", "{S9000} matched", true)).toEqual("a sentence matched");
  });

  test('Support many group matches.', ({}) => {
    expect(actionResponse("a sentence match another sentence", "", "{S} sentence {S1} another {S3}", "{S} sentence {S1}ed another {S3}", true)).toEqual("a sentence matched another sentence");
  });

});
