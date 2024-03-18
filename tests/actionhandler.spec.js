import { test, expect } from '@playwright/test';
import { actionResponse, defaultActions} from '../main/actionHandler.js';

test.describe('Support {s} sentence matching timer actions', () => {
  test('No match', ({}) => {
    expect(actionResponse("timer", "line match", "", "nomatch", "", true)).toEqual(false);
  });

  // TODO (Allegro): change test after implementation complete.
  test('On timer match return true.', ({}) => {
    expect(actionResponse("timer", "line match", "", "{S} match", "", true)).toEqual("true");
  });

  //timer 15 Allegro timer 15.
  test('Match', ({}) => {
    expect(actionResponse("timer", "Allegro timer 15", "", "{S} timer 15", "", true)).toEqual("true");
  });
});

test.describe('Support {s} sentence matching sound actions', () => {
  test('No match', ({}) => {
    expect(actionResponse("sound", "line match", "", "nomatch", "Matched", true)).toEqual(false);
  });

  test('On match if type is sound return orginal sound.', ({}) => {
    expect(actionResponse("sound", "line match", "", "{S} match", "tell", true)).toEqual("tell");
  });
});

test.describe('Support {s} sentence matching in speak actions.', () => {
  test('No match', ({}) => {
    expect(actionResponse("speak", "line match", "", "nomatch", "Matched", true)).toEqual(false);
  });

  test('Case insensitive on search string', ({}) => {
    expect(actionResponse("speak", "line match", "", "match", "Matched", true)).toEqual("matched");
    expect(actionResponse("speak", "line match", "", "Match", "Matched", true)).toEqual("matched");
  });

  test('Case insensitive on response string', ({}) => {
    expect(actionResponse("speak", "line match", "", "match", "Matched", true)).toEqual("matched");
    expect(actionResponse("speak", "line match", "", "match", "matched", true)).toEqual("matched");
  });

  test('Case insensitive on line.', ({}) => {
    expect(actionResponse("speak", "line MATCH", "", "match", "matched", true)).toEqual("matched");
    expect(actionResponse("speak", "line MaTcH", "", "match", "matched", true)).toEqual("matched");
  });

  test('Match replace a group', ({}) => {
    expect(actionResponse("speak", "a sentence match", "", "{S} match", "matched", true)).toEqual("matched");
  });

  test('Group name case does not matter.', ({}) => {
    expect(actionResponse("speak", "a sentence match", "", "{s} match", "{S} matched", true)).toEqual("a sentence matched");
    expect(actionResponse("speak", "a sentence match", "", "{S} match", "{s} matched", true)).toEqual("a sentence matched");
  });

  test('Matching group cannot be have the same name, match fails.', ({}) => {
    expect(actionResponse("speak", "a sentence match another sentence", "", "{S} match {S}", "match", true)).toEqual(false);
  });

  test('Reponse can have multiple matching groups of the same name.', ({}) => {
    expect(actionResponse("speak", "a sentence match another sentence", "", "{S} match", "{S} matched {S}", true)).toEqual("a sentence matched a sentence");
  });

  test('Responses will includes {S} even if not matched. Gina does this.', ({}) => {
    expect(actionResponse("speak", "a sentence match another sentence", "", "match", "{S} matched {S}", true)).toEqual("{s} matched {s}");
  });

  test('Support multiple group names {S}, {Sd+}', ({}) => {
    expect(actionResponse("speak", "a sentence match another sentence", "", "{S0} match", "{S0} matched", true)).toEqual("a sentence matched");
    expect(actionResponse("speak", "a sentence match another sentence", "", "{S9000} match", "{S9000} matched", true)).toEqual("a sentence matched");
  });

  test('Support many group matches.', ({}) => {
    expect(actionResponse("speak", "a sentence match another sentence", "", "{S} sentence {S1} another {S3}", "{S} sentence {S1}ed another {S3}", true)).toEqual("a sentence matched another sentence");
  });

});
