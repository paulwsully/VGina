import { test, expect } from '@playwright/test';
import { actionResponse} from '../main/actionHandler.js';

test.describe('Timer action tests', () => {
  const player = "TestPlayer"; 
  let line = "";
  let action = { type: "timer", key: "", search: "", sound: "", regex: true };

  // TODO (Allegro): change test after implementation complete.
  test('On timer match return true.', ({}) => {
    line = "line match";
    action.search = "{S} match";
    expect(actionResponse(player, line, action)).toEqual("true");
  });

});

test.describe('Sound action tests', () => {
  const player = "TestPlayer"; 
  let line = "";
  let action = { type: "sound", key: "", search: "", sound: "", regex: true };

  test('On match return orginal sound.', ({}) => {
    line = "line match";
    action.search = "{S} match";
    action.sound = "tell";
    expect(actionResponse(player, line, action)).toEqual(action.sound);
  });
});

test.describe('Speak action tests', () => {
  const player = "TestPlayer"; 
  let line = "";
  let action = { type: "speak", key: "", search: "", sound: "", regex: true };

  test('On match return possibly altered sound', ({}) => {
    line = "line match";
    action.search = "match";
    action.sound = "matched";
    expect(actionResponse(player, line, action)).toEqual("matched");
  });
});

test.describe('Common action tests', () => {
  const player = "TestPlayer"; 
  let line = "";
  let action = { type: "", key: "", search: "", sound: "", regex: true };

  test('No match', ({}) => {
    line = "line match";
    action.search = "nomatch";
    expect(actionResponse(player, line, action)).toEqual(false);
  });

  test('Case insensitive on search string', ({}) => {
    line = "line match";
    action.search = "match";
    action.sound = "matched";
    expect(actionResponse(player, line, action)).toEqual(action.sound);
    action.search = "Match";
    expect(actionResponse(player, line, action)).toEqual(action.sound);
  });

  test('Case insensitive on response string', ({}) => {
    line = "line match";
    action.search = "match";
    action.sound = "matched";
    expect(actionResponse(player, line, action)).toEqual(action.sound.toLowerCase());
    action.sound = "MATCHED";
    expect(actionResponse(player, line, action)).toEqual(action.sound.toLowerCase());
  });

  test('Case insensitive on line.', ({}) => {
    line = "line MATCH";
    action.search = "match";
    action.sound = "matched";
    expect(actionResponse(player, line, action)).toEqual(action.sound);
    line = "line MaTcH";
    expect(actionResponse(player, line, action)).toEqual(action.sound);
  });
});


test.describe('Support for {S} matching in actions', () => {
  const player = "TestPlayer"; 
  let line = "a sentence match";
  let action = { type: "speak", key: "", search: "", sound: "", regex: true };

  test('{S} matched', ({}) => {
    action.search = "{S} match";
    action.sound = "matched";
    expect(actionResponse(player, line, action)).toEqual(action.sound);
  });

  test('Matching group cannot be have the same name, match fails.', ({}) => {
    action.search = "{S} match {S}";
    action.sound = "matched";
    expect(actionResponse(player, line, action)).toEqual(false);
  });

  test('{S} Group name case does not matter.', ({}) => {
    action.search = "{s} match";
    action.sound = "{S} matched";
    expect(actionResponse(player, line, action)).toEqual("a sentence matched");
    action.search = "{S} match";
    action.sound = "{s} matched";
    expect(actionResponse(player, line, action)).toEqual("a sentence matched");
  });

  test('Response can have multiple matching groups of the same name.', ({}) => {
    line = "a sentence match another sentence";
    action.search = "{s} match";
    action.sound = "{s} matched {s}";
    expect(actionResponse(player, line, action)).toEqual("a sentence matched a sentence");
  });

  test('Responses will includes {S} even if not matched. Gina does this.', ({}) => {
    line = "a sentence match another sentence";
    action.search = "match";
    action.sound = "{s} matched {s}";
    expect(actionResponse(player, line, action)).toEqual(action.sound);
  });

  test('Support multiple group names {S}, {Sd+}', ({}) => {
    line = "a sentence match another sentence";
    action.search = "{S0} match";
    action.sound = "{S0} matched";
    expect(actionResponse(player, line, action)).toEqual("a sentence matched");
    action.search = "{S9000} match";
    action.sound = "{S9000} matched";
    expect(actionResponse(player, line, action)).toEqual("a sentence matched");
  });

  test('Support many group matches.', ({}) => {
    line = "a sentence match another sentence";
    action.search = "{S} sentence {S1} another {S3}";
    action.sound = "{S} sentence {S1}ed another {S3}";
    expect(actionResponse(player, line, action)).toEqual("a sentence matched another sentence");
  });
    
});

