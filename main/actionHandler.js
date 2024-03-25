
function removeTimestamps(text) {
  return text.split("\n").map((line) => line.replace(/\[\w+ \w+ \d+ \d+:\d+:\d+ \d+\] /, "")).join("\n");
}

function actionResponse(player, line, action){
  // NOTE (Allegro): lots of lowercasing, should lowercase on save instead?
  player = player.toLowerCase();
  let search = action.search.toLowerCase();
  line = removeTimestamps(line).toLowerCase();

  // NOTE (Allegro): sound has toString() because it can be a bool for some reason.
  let response = action.sound.toString().toLowerCase();

  let timer_override = false;

  if (!action.regex)
  {
    // NOTE (Allegro): Change include to startswith?
    if (line.includes(search)){
      return response;
    }
    return false;
  }
  
  // Convert GINA style {S} into group names.
  search = search.replace(/\{s(\d*)\}/gi, "(?<s$1>.+)");
  search = search.replace(/\{w(\d*)\}/gi, "(?<w$1>\\w+)");

  // Convert {c} to player name match.
  search = search.replaceAll("{c}", player);

  // Convert {ts} to time stamp group. If using {ts} override previous timer's time.
  if (search.includes("{ts}")){
    search = search.replace("{ts}", "((?<hr>\\d+)h\\s?)?((?<min>\\d+)m\\s?)?((?<sec>\\d+)s)?");
    timer_override = true;
  }

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
  if (action.type === "sound"){
    return action.sound;
  }

  // Replace the groups with the matches 
  const groups = (matched.groups);
  if (groups){
    for (const [key, value] of Object.entries(groups)) {
      response = response.replaceAll("{" + key + "}", value);
    }
  }

  // Replace {c} with player name in reponse.
  response = response.replaceAll("{c}", player);

  // Timer response is used in the timer's title and the group variables replace the time values of the timer.
  if(action.type === "timer"){
    if (groups.hr === undefined && groups.min === undefined && groups.sec === undefined){
      timer_override = false;
    }
    const hours = (groups.hr === undefined)  ? 0 : Number(groups.hr);
    const mins  = (groups.min === undefined) ? 0 : Number(groups.min);
    const secs  = (groups.sec === undefined) ? 0 : Number(groups.sec);
    return {title: response, hours: hours, mins: mins, secs: secs, override: timer_override};
  }

  return response;
}

function defaultActions(){
  // What constitutes an action?
  // {type, key, search, sound, regex}
  return [
    { type: "speak", key: "rootBroke",   search: "Roots spell has worn off",             sound: "Root fell off",                  regex: false },
    { type: "speak", key: "feignDeath",  search: "has fallen to the ground",             sound: "Failed feign",                   regex: false },
    { type: "speak", key: "resisted",    search: "Your target resisted",                 sound: "Resisted",                       regex: false },
    { type: "speak", key: "invisFading", search: "You feel yourself starting to appear", sound: "You're starting to appear",      regex: false },
    { type: "speak", key: "groupInvite", search: "invites you to join a group",          sound: "You've been invited to a group", regex: false },
    { type: "speak", key: "raidInvite",  search: "invites you to join a raid",           sound: "You've been invited to a raid",  regex: false },
    { type: "speak", key: "mobEnrage",   search: "has become ENRAGED",                   sound: "Mob is enraged",                 regex: false },
    { type: "sound", key: "tell",        search: "{S} tells you,",                       sound: "tell",                           regex: true },
  ];
}

export{ defaultActions, actionResponse};
