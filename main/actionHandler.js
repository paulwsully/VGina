
async function processAction(line, settingKey, search, useRegex){
  try {
    let matchFound = false;
    if (useRegex) {
      const regex = new RegExp(search);
      matchFound = regex.test(line);
    } else {
      matchFound = line.includes(search);
    }

    if (!matchFound) return;

    let settings = null;
    if (settingKey !== null) {
      settings = store.get(settingKey);
    }

    return settings || settingKey === "";
  } catch (error) {
    console.error("Error in processCommonActions:", error);
    return false;
  }
}

/*
async function actionResponse2(type, line, key, search, sound, regex){
  let response = "";

  if (type == "sound")
  {

  }

  return response;
}
*/

async function actionResponse(line, settingKey, search, sound, useRegex){
  // NOTE (Allegro): ignore settingkey cause I don't know what it's for exactly.

  search = search.toLowerCase();

  // NOTE (Allegro): sound has toString() because it can be a bool for some reason.
  let response = sound.toString().toLowerCase();
  
  line = line.toLowerCase();

  if (!useRegex)
  {
    // NOTE (Allegro): Change include to startswith?
    if (line.includes(search)){
      return response;
    }
    return false;
  }
  
  // Convert GINA style {s}, {c}, etc into group names.
  search = search.replace(/{s(\d*)\}/g, "(?<s$1>.+)");

  // TODO (Allegro): This is slow, and I dont want it running on search action.
  // Should be checked on save.
  // Duplicate group names is invalid regex.
  try { 
    new RegExp(search);
  } catch (e) {
    return false;
  }

  console.log("search regex: ", search);

  const matched = line.match(search);
  if (!matched) return false;

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
    { actionType: "sound", key: "tell",        search: "\\[.*?\\] (\\S+) tells you,",          sound: "tell",                           useRegex: true },
  ];
}

export{ processAction, defaultActions, actionResponse };
