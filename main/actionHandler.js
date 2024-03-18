
// TODO: refactor into timer, sound, speak?

function actionResponse(type, line, settingKey, search, sound, useRegex){
  // NOTE (Allegro): ignore settingkey cause I don't know what it's for exactly.

  search = search.toLowerCase();
  line = line.toLowerCase();

  // NOTE (Allegro): sound has toString() because it can be a bool for some reason.
  let response = sound.toString().toLowerCase();
  
  if (!useRegex)
  {
    // NOTE (Allegro): Change include to startswith?
    if (line.includes(search)){
      return response;
    }
    return false;
  }
  
  // Convert GINA style {s}, {c}, etc into group names.
  search = search.replace(/{s(\d*)\}/gi, "(?<s$1>.+)");

  // Check if regex is valid. Duplicate group names is invalid regex.
  // TODO (Allegro): Should be checked on save?
  try { 
    new RegExp(search);
  } catch (e) {
    return false;
  }

  const matched = line.match(search);
  if (!matched) return false;

  // There will never be groups when action type is a sound.
  if (type === "sound"){
    return sound;
  }

  // TODO: return datetime object instead. and title?
  if(type === "timer"){
    return "true";
  }

  // Replace the groups with the matches 
  const groups = (matched.groups);
  if (groups){
    for (const [key, value] of Object.entries(groups)) {
      response = response.replaceAll("{" + key + "}", value);
    }
  }

  return response;
}

function defaultActions(){
  return [
    { actionType: "speak", key: "rootBroke",   search: "Roots spell has worn off",             sound: "Root fell off",                  useRegex: false },
    { actionType: "speak", key: "feignDeath",  search: "has fallen to the ground",             sound: "Failed feign",                   useRegex: false },
    { actionType: "speak", key: "resisted",    search: "Your target resisted",                 sound: "Resisted",                       useRegex: false },
    { actionType: "speak", key: "invisFading", search: "You feel yourself starting to appear", sound: "You're starting to appear",      useRegex: false },
    { actionType: "speak", key: "groupInvite", search: "invites you to join a group",          sound: "You've been invited to a group", useRegex: false },
    { actionType: "speak", key: "raidInvite",  search: "invites you to join a raid",           sound: "You've been invited to a raid",  useRegex: false },
    { actionType: "speak", key: "mobEnrage",   search: "has become ENRAGED",                   sound: "Mob is enraged",                 useRegex: false },
    { actionType: "sound", key: "tell",        search: "{S} tells you,",                       sound: "tell",                           useRegex: true },
  ];
}

export{ defaultActions, actionResponse};
