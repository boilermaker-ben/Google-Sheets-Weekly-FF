// WEEKLY FF GLOBALS - Updated 11.22.2024

// PLACEHOLDER LEAGUES For various formats, returns HALF PPR by default (recreated for 2023 season, empty leagues with generic scoring)
function dummyLeagueSleeper(format) {
  const placholders = {
    'HALF':'1030890887179542528',
    'PPR':'1030890805604601856',
    'STANDARD':'1030890959908790272'
  };
  format = format == null ? 'HALF' : format;
  return placholders[format];
}

function dummyLeagueESPN(format) {
  const placeholders = {
    'HALF':'709268032',
    'PPR':'261108896',
    'STANDARD':'490244592'
  };
  format = format == null ? 'HALF' : format;
  return placeholders[format];
}

//------------------------------------------------------------------------
// LEAGUE INFO - Pulls information regarding a league, including draft information of the most recent draft
// Provide league ID (or object) and also give single value or array of the following to return an array of the information desired: 'name','teams','divisions','starters','starters_indexed','roster','roster_indexed','scoring','managers','usernames','usernames_by_manager','usernames_by_roster','season','scoring_type','starter_size','bench_size','draft','draft_picks','draft_picks_by_roster','draft_picks_by_user','draft_picks_array','draft_keepers','draft_keepers_by_roster','draft_keepers_by_user','draft_keepers_array','max_keepers','playoff_start','playoff_teams'
function leagueInfo(league,info) {
  if(typeof league != 'string') {
      return ('Enter league id as a string, then declare fetch request as array as second variable');
  } else {
    if (!Array.isArray(info) && typeof info != 'object') {
      info = [info];
    }
    let results = {}; // Object to return
    let json = {};
    let usernamesById = {};
    try {
      json = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/league/' + league));
    } catch (err) {
      return ('Invalid input, no league data fetched, enter league ID as a string');
    }
    let draft = {};
    let picks = {};
    if (info.indexOf('managers') >= 0 || (/usernames[a-z\_]{0,}/).test(info.toString()) || (/draft[a-z\_]{0,}/).test(info.toString()) || info.indexOf('scoring_type') >= 0) {
      draft = {'start_time':0};
      try {
        drafts = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/league/' + league + '/drafts'));
      } catch (err) {
        return ('No drafts for league indicated, change request to avoid draft information (\"draft_picks\",\"draft_picks_by_roster\",\"draft_picks_by_user\",\"draft_picks_array\",\"draft_keepers\",\"draft_keepers_by_roster\",\"draft_keepers_by_user\",\"draft_keepers_array\",and \"scoring_type\")');
      }
      if (drafts.length > 1) {
        for (let b = 0; b < drafts.length; b++) {
          drafts[b].start_time > draft.start_time ? draft = drafts[b] : null;
        }
      } else {
        draft = drafts[0];
      }
    }
    if ((/usernames[a-z\_]{0,}/).test(info.toString())) {
      for (let key in draft.draft_order) {
        try {
          let user = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/user/' + key)).username;
          usernamesById[key] = user;
        } catch (err) {
          return ('No information for user ID indicated, ' + key);
        }
      }
    }
    for (let a = 0; a < info.length; a++){
      if (info[a] == 'starters' || info[a] == 'starters_indexed') {
        let starters = json.roster_positions.filter(x => x != 'BN');
        if (info[a] == 'starters_indexed') {
          let index = 1;
          let indexed = [];
          for (let c = 0; c < starters.length; c++) {
            indexed[c] = starters[c] != 'BN' ? starters[c]+index : starters[c];
            index = starters[c] == starters[c+1] ? index + 1 : 1;            
          }
          results[info[a]] = indexed;
        } else {
          results[info[a]] = starters;
        }
      } else if (info[a] == 'roster' || info[a] == 'roster_indexed') {
        let reserve = 0;
        try {
          reserve = json.settings.reserve_slots;
        } catch (err) {
          // No reserve slots indicated
        }
        let roster = (json.roster_positions).concat(Array.from({length: reserve}, (v,i) => 'IR'));
        if (info[a] == 'roster_indexed') {
          let index = 1;
          let indexed = [];
          for (let c = 0; c < roster.length; c++) {
            indexed[c] = roster[c]+index;
            //indexed[c] = roster[c] != 'BN' ? roster[c]+index : roster[c]; // Alternative if preferred no bench numbering
            index = roster[c] == roster[c+1] ? index + 1 : 1;
          }
          results[info[a]] = indexed;
        } else {
          results[info[a]] = roster;
        }
      } else if (info[a] == 'divisions') {
        let divisions = {};
        try {
          let meta = json.metadata;
          for (let key in meta) {
            divisions[parseInt(key.replace(/division\_/g, ''))] = key.match(/division\_[0-9]{1,3}/) ? meta[key] : divisions[parseInt(key.replace(/division\_/g, ''))];
          }
        } catch (err) {
          // No divisions found
        }
        results[info[a]] = divisions;
      } else if (info[a] == 'scoring') {
        results[info[a]] = json.scoring_settings;
      } else if (info[a] == 'starter_size') {
        results[info[a]] = json.roster_positions.filter(x => x != 'BN').length;
      } else if (info[a] == 'bench_size') {
        results[info[a]] = json.roster_positions.filter(x => x == 'BN').length;
      } else if (info[a] == 'managers') {
        let managerIds = [];
        for (let key in draft.draft_order) {
          managerIds.push(key);
        }
        results.managers = managerIds;
      } else if (info[a] == 'usernames') {
        let users = [];
        Object.keys(usernamesById).forEach(key => {
          users.push(usernamesById[key])});
        results[info[a]] = users;
      } else if (info[a] == 'usernames_by_manager') {
        results[info[a]] = usernamesById;
      } else if (info[a] == 'usernames_by_roster') {
        let obj = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/league/' + league + '/rosters'));
        let usernames = {};
        Object.keys(usernamesById).forEach(key => {
          usernames[obj.filter(x => x.owner_id == key)[0].roster_id] = usernamesById[key];
        });
        results[info[a]] = usernames;
      } else if (info[a] == 'name') {
        results[info[a]] = json[info[a]];
      } else if (info[a] == 'season') {
        results[info[a]] = json.season;
      } else if (info[a] == 'teams') {
        results[info[a]] = json.settings.num_teams;
      } else if (info[a] == 'max_keepers') {
        results[info[a]] = json.settings.max_keepers;
      } else if (info[a] == 'playoff_start') {
        results[info[a]] = json.settings.playoff_week_start;
      } else if (info[a] == 'playoff_teams') {
        results[info[a]] = json.settings.playoff_teams;
      } else if ((/draft[a-z\_]{0,}/).test(info.toString()) || info[a] == 'scoring_type') {
        if (info[a] == 'scoring_type') {
          results[info[a]] = draft.metadata.scoring_type;
        } else {
          picks = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/draft/' + draft.draft_id + '/picks'));
          if (info[a] == 'draft') {
            let pickArr = [];
            for (let c = 0; c < picks.length; c++) {
              pickArr.push([picks[c].round,picks[c].pick_no,picks[c].player_id,picks[c].roster_id,picks[c].draft_slot,picks[c].is_keeper ? 1 : 0]);
            }
            results[info[a]] = pickArr;
          } else if (info[a] == 'draft_picks' || info[a] == 'draft_keepers') {
            let arr = [];
            for (let c = 0; c < picks.length; c++) {
              if (info[a] == 'draft_picks' || picks[c].is_keeper == true) {
                arr.push(picks[c].metadata.player_id);
              }
            }
            results[info[a]] = arr;
          } else if (info[a] == 'draft_picks_by_roster' || info[a] == 'draft_keepers_by_roster') {
            let rosters = {};
            for (let c = 0; c < picks.length; c++) {
              rosters[picks[c].roster_id] = rosters[picks[c].roster_id] == undefined ? [] : rosters[picks[c].roster_id]
              if (info[a] == 'draft_picks_by_roster' || picks[c].is_keeper == true) {
                rosters[picks[c].roster_id].push(picks[c].metadata.player_id);
              }
            }
            results[info[a]] = rosters;             
          } else if (info[a] == 'draft_picks_by_user' || info[a] == 'draft_keepers_by_user') {
            let rosters = {};
            for (let c = 0; c < picks.length; c++) {
              if (info[a] == 'draft_picks_by_roster' || picks[c].is_keeper == true) {
                rosters[picks[c].picked_by] = rosters[picks[c].picked_by] == undefined ? [] : rosters[picks[c].picked_by]
                rosters[picks[c].picked_by].push(picks[c].metadata.player_id);
              }
            }
            results[info[a]] = rosters;
          } else if (info[a] == 'draft_picks_array' || info[a] == 'draft_keepers_array') {
            let players = [];
            let all = [];
            let r = 1; // round
            for (let c = 0; c < picks.length; c++) {
              if (picks[c].round > r) {
                all.push(players);
                players = [];
              }
              r = picks[c].round;
              if (info[a] == 'draft_picks_array') {
                players.push(picks[c].metadata.player_id);
              } else {
                if (picks[c].is_keeper == null) {
                  players.push('');
                } else {
                  players.push(picks[c].metadata.player_id);
                }
              }
            }
            all.push(players);
            results[info[a]] = all;          
          }
        }
      }
    }
    if (Object.keys(results).length == 0) {
      return ('No values found based on user input, use one or more of the following: \"teams\",\"name\",\"roster\",\"roster_indexed\",\"starters\",\"starters_indexed\",\"managers\",\"season\",\"scoring_type\",\"starter_size\",\"bench_size\",\"draft_picks\",\"draft_picks_by_roster\",\"draft_picks_by_roster\",\"draft_picks_array\",\"draft_keepers\",\"draft_keepers_by_roster\",\"draft_keepers_by_roster\",\"draft_keepers_array\", and \"scoring_type\"')
    } else if (Object.keys(results).length == 1) {
      return results[Object.keys(results)[0]];
    } else {
      return results;
    }
  }
}

// ARRAY CHECK
// Checks for total values that match a regular expression in an array, logs total duplicates if any, and returns a readable string of the duplicates
function arrayCheck(array,regEx) {
  regEx == null ? regEx = new RegExp(/\S{1,}/) : null;
  let count = 0, duplicate = 0, duplicates = [], lower = [], duplicatesLower = [], text;
  let blankRes = new RegExp(/\s+/);
  
  for (let a = 0; a < array.length; a++) {
    lower[a] = array[a].toLowerCase();
  }

  for (let a = 0; a < array.length; a++) {  
    let tempArray = [...lower];
    tempArray.splice(a,1);
    if (regEx.test(array[a])) {
      count++;
      if (tempArray.indexOf(lower[a]) > -1 || blankRes.test(lower[a])) {
        duplicate+=0.5;
        if (duplicatesLower.indexOf(array[a].toLowerCase()) == -1) {
          duplicates.push(array[a])
          duplicatesLower.push(array[a].toLowerCase());
        }
      }
    }
  }
  duplicate = parseInt(duplicate);
  duplicate > 0 ? text = arrayToString(duplicates) : null;
  let result = {'count':count,
          'duplicates':duplicate,
          'text':text
          };
  return result;
}

// ARRAY-TO-STRING
// Function to take an array and return it with commas and spacing to be used for alerts/logs. Quotes by default, use "false" as second input to remove
function arrayToString(array,quotes,and) {
  let quote = '\"';
  and == null ? and = true : and = false;
  quotes == false ? quote = '' : null;
  let text;
  if (array.length > 0) {
    text = quote + array[0] + quote;
    if (array.length == 2) {
      text = text.concat((and ? ' and ' : ', ') + quote + array[1] + quote);
    } else if (array.length > 2) {
      text = text.concat(', ');
      for (let a = 1; a < array.length; a++) {
        a == (array.length-1) ? text = text.concat((and ? 'and ' : '') + quote + array[a] + quote) : text = text.concat(quote + array[a] + quote + ', ');
      }
    }
  }
  return text;
}

// ARRAY CLEAN
// Function to remove empty elements in array
function arrayClean(array) {
  let blankRes = new RegExp(/\s+/);
  for (let a = array.length-1; a >= 0; a--) {
    (blankRes.test(array[a]) || array[a] == null || array[a] == '') ? array.splice(a,1) : null;
  }
  return array;
}

//------------------------------------------------------------------------
// SEASON INFO - Function to quickly fetch year or week (or both) from the Sleeper API
function seasonInfo(value){
  let urlText = UrlFetchApp.fetch('https://api.sleeper.app/v1/state/nfl').getContentText();
  let obj = JSON.parse(urlText);
  let year = obj['season'];
  let week = obj['week'];
  let display_week = obj['display_week'];
  // Logger.log(JSON.stringify(obj));
  if (value == 'year') { 
    // Logger.log(year);
    return parseInt(year);
  } else if (value == 'week'){
    // Logger.log(week);
    return parseInt(week);
  } else if (value == 'display_week'){
    // Logger.log(display_week);
    return parseInt(display_week);
  } else {
    // Logger.log([parseInt(year),parseInt(week)])
    return [year,week];
  }
}

//------------------------------------------------------------------------
// YEAR,WEEK,WEEKS - Logs some values for easy fetching to reduce total API pulls
function yearWeekFetch(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var urlText = UrlFetchApp.fetch('http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard').getContentText();
  var obj = JSON.parse(urlText);
  var week = 1;
  var weeks = Object.keys(obj['leagues'][0]['calendar'][1]['entries']).length;
  var year = obj['season']['year'];

  if(obj['events'][0]['season']['slug'] != 'preseason'){
    week = obj['week']['number'];
  }

  var sheet = ss.getSheetByName('YEAR&WEEK');
  if (!sheet) {
    ss.insertSheet('YEAR&WEEK');
    sheet = ss.getSheetByName('YEAR&WEEK');
  }

  var yearRange = sheet.getRange(1,1);
  var weekRange = sheet.getRange(2,1);
  var weeksRange = sheet.getRange(3,1);
  var maxCols = sheet.getMaxColumns();
  var maxRows = sheet.getMaxRows();
  
  if (maxCols > 1) {
    sheet.deleteColumns(2,maxCols-1);
  }
  if (maxRows > 3) {
    sheet.deleteRows(4,maxRows-3);
  }
  yearRange.setValue(year);
  weekRange.setValue(week);
  weeksRange.setValue(weeks);
  ss.setNamedRange('YEAR',yearRange);
  ss.setNamedRange('WEEK',weekRange);
  ss.setNamedRange('WEEKS',weeksRange);
  range = sheet.getRange(1,1,3,1);
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
  range.setFontFamily('Montserrat');
  sheet.setColumnWidth(1,120);
  sheet.setRowHeight(1,120);
  range.setFontSize(40)
  sheet.hideSheet();

  Logger.log('Set year value to ' + year + ' and week value to ' + week);
  return [year,week,weeks];
}

//------------------------------------------------------------------------
// ESPN BYE WEEKS - Fetches the ESPN-available API data on bye weeks
function nflByeWeeks(year) {
  (year == undefined || year == null) ? year = seasonInfo('year') : null;
  const nfl = fetchTeamsESPN(year);
  const teams = nfl.map(x => x['abbrev']);
  const byes = nfl.map(x => x['byeWeek']);
  let obj = {};
  for(var a = 0; a < teams.length; a++) {
    if (teams[a] == "Wsh"){
      obj["WAS"] = byes[a];
    } else if ( teams[a] == "Jac") {
      obj["JAX"] = byes[a]
    } else {
      obj[teams[a].toUpperCase()] = byes[a];
    }
  }
  // Logger.log(obj) 
  return obj;
}

//------------------------------------------------------------------------
// ESPN TEAMS - Fetches the ESPN-available API data on NFL teams
function fetchTeamsESPN(year) {
  (year == undefined || year == null) ? year = seasonInfo('year') : null;
  const obj = JSON.parse(UrlFetchApp.fetch('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/' + year + '?view=proTeamSchedules').getContentText());
  return obj['settings']['proTeams'];
}

//------------------------------------------------------------------------
// ESPN BYE WEEKS - Fetches the ESPN-available API data on NFL teams' bye weeks and returns paired object values
function fetchByeWeeksESPN(year) {
  (year == undefined || year == null) ? year = seasonInfo('year') : null;
  const teams = fetchTeamsESPN(year);
  let byes = {};
  for (let a = 0; a < teams.length; a++) {
    try{
      byes[teams[a].id] = teams[a].byeWeek;
    }
    catch (err) {
      //Logger.log('No bye week for team id ' + teams[a].id);
    }
  }
  return byes;
}

//------------------------------------------------------------------------
// ESPN DATA SHEET LOGGING
function nflSheetESPN() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('NFL');
  if (sheet == null) {
    ss.insertSheet('NFL');
    sheet = ss.getSheetByName('NFL');
  }
  // Remove protections
  let protections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  for (let a = 0; a < protections.length; a++) {
    protections[a].remove();
  }  

  let weeks = seasonInfo('weeks');
  let weeksArr = [];
  for (let a = 1; a <= weeks; a++) {
    weeksArr.push(a);
  }

  // Establish headers and data set
  let headers = ['abbrev','id','location','name','full','byeWeek']
  headers = headers.concat(weeksArr);
  const obj = fetchTeamsESPN();
  let arr = [], data = [];
  
  // Create object for matching opponents to teams by team ID
  let teams = {};
  for (let a = 0; a < obj.length; a++) {
    obj[a].abbrev = (obj[a].abbrev).toUpperCase();
    obj[a].abbrev == 'WSH' ? obj[a].abbrev = 'WAS' : null;
    teams[obj[a].id] = (obj[a].abbrev).toUpperCase();
  }

  for (let a = 0; a < obj.length; a++) {
    if (obj[a].id != 0) {
      games = obj[a].proGamesByScoringPeriod;
      let team = obj[a].id;
      arr = [];
      for (let b = 0; b < headers.length; b++) {
        if (headers[b] == 'full') {
          arr.push(obj[a].location + ' ' + obj[a].name);
        } else if (Number.isInteger(headers[b])) {
          if (headers[b] == obj[a].byeWeek) {
            arr.push('BYE');
          } else {
            team == games[headers[b]][0].awayProTeamId ? arr.push(teams[games[headers[b]][0].homeProTeamId]) : arr.push(teams[games[headers[b]][0].awayProTeamId]);
          }
        } else {
          arr.push(obj[a][headers[b]])
        }
      }
      data.push(arr);
    }
  }
  data.unshift(headers);
  
  // Prep sheet, set values, set named ranges, reduce rows/cols, set formatting
  sheet.clear;
  sheet.clearFormats;
  let dataRange = sheet.getRange(1,1,data.length,data[0].length);
  dataRange.setValues(data);
  dataRange.setFontFamily('Nunito');
  dataRange.setFontSize(10);
  dataRange.setVerticalAlignment('middle');
  dataRange.setHorizontalAlignment('left');
  let headerRange = sheet.getRange(1,1,1,data[0].length);
  headerRange.setBackground('#000000');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  ss.setNamedRange('NFL',dataRange);
  ss.setNamedRange('NFL_ID',sheet.getRange(2,headers.indexOf('id')+1,data.length-1,1));
  ss.setNamedRange('NFL_ABBR',sheet.getRange(2,headers.indexOf('abbrev')+1,data.length-1,1));
  ss.setNamedRange('NFL_LOCATION',sheet.getRange(2,headers.indexOf('location')+1,data.length-1,1));
  ss.setNamedRange('NFL_TEAM',sheet.getRange(2,headers.indexOf('name')+1,data.length-1,1));
  ss.setNamedRange('NFL_FULL',sheet.getRange(2,headers.indexOf('full')+1,data.length-1,1));
  let matchupRange = sheet.getRange(2,headers.indexOf(1)+1,data.length-1,weeks);
  ss.setNamedRange('NFL_MATCHUPS',matchupRange);
  adjustRows(sheet,data.length);
  adjustColumns(sheet,data[0].length);
  sheet.autoResizeColumns(1,data[0].length);
  sheet.setColumnWidth(headers.indexOf('id')+1,30);
  sheet.setColumnWidths(headers.indexOf(1)+1,weeks,40);
  sheet.clearConditionalFormatRules();
  let byeWeekFormat = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('BYE')
    .setBackground('#BABABA')
    .setFontColor('#575757')
    .setRanges([matchupRange])
    .build();
  sheet.setConditionalFormatRules([byeWeekFormat]);
  sheet.getRange(2,1,sheet.getMaxRows()-1,sheet.getMaxColumns()).sort(1);
  sheet.protect().setDescription('Protected NFL Team Data');
  ss.toast('Updated, reformatted, and protected NFL team and schedule data');

}

//------------------------------------------------------------------------
// GET KEY BY VALUE - Inverse lookup based on input of object and value for key
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

//------------------------------------------------------------------------
// ADJUST ROWS - Cleans up rows of a sheet by providing the total rows that currently exist with data
function adjustRows(sheet,rows,verbose){
  let maxRows = sheet.getMaxRows(); 
  if (rows == undefined || rows == null) {
    rows = sheet.getLastRow();
  }
  if (rows > 0 && rows > maxRows) {
    sheet.insertRowsAfter(maxRows,(rows-maxRows));
    if(verbose) return Logger.log('Added ' + (rows-maxRows) + ' rows');
  } else if (rows < maxRows && rows != 0){
    sheet.deleteRows((rows+1), (maxRows-rows));
    if(verbose) return Logger.log('Removed ' + (maxRows - rows) + ' rows');
  } else {
    if(verbose) return Logger.log('Rows not adjusted');
  }
}

//------------------------------------------------------------------------
// ADJUST COLUMNS - Cleans up columns of a sheet by providing the total columns that currently exist with data
function adjustColumns(sheet,columns,verbose){
  let maxColumns = sheet.getMaxColumns(); 
  if (columns == undefined || columns == null) {
    columns = sheet.getLastColumn();
  }
  if (columns > 0 && columns > maxColumns) {
    sheet.insertColumnsAfter(maxColumns,(columns-maxColumns));
    if(verbose) return Logger.log('Added ' + (columns-maxColumns) + ' columns');
  }  else if (columns < maxColumns && columns != 0){
    sheet.deleteColumns((columns+1), (maxColumns-columns));
    if(verbose) return Logger.log('Removed ' + (maxColumns - columns) + ' column(s)');
  } else {
    if(verbose) return Logger.log('Columns not adjusted');
  }
}

//------------------------------------------------------------------------
// ESPN POS ID - Looks up position name based on ESPN position ID number
function espnPositionId(id){
  const ids = {
    1:"QB",
    2:"RB",
    9:"RB", // fullback
    3:"WR",
    4:"TE",
    5:"K",
    16:"DEF"    
  }
  return ids[id];
}

//------------------------------------------------------------------------
// ESPN PRO TEAM ID - Looks up a pro team abbreviation based on ESPN team ID number
function espnProTeamId(id){
  const ids ={
    22: "ARI",
    1: "ATL",
    33: "BAL",
    2: "BUF",
    29: "CAR",
    3: "CHI",
    4: "CIN",
    5: "CLE",
    6: "DAL",
    7: "DEN",
    8: "DET",
    9: "GB",
    34: "HOU",
    11: "IND",
    30: "JAX",
    12: "KC",
    13: "LV",
    24: "LAC",
    14: "LAR",
    15: "MIA",
    16: "MIN",
    17: "NE",
    18: "NO",
    19: "NYG",
    20: "NYJ",
    21: "PHI",
    23: "PIT",
    26: "SEA",
    25: "SF",
    27: "TB",
    10: "TEN",
    28: "WAS"
    };
  return ids[id]; 
}

//------------------------------------------------------------------------
// ESPN DEF ID - Logs ESPN IDs of teams based on their pro team abbreviation
function espnDefId(id){
  const espnDefId = { "ARI":-16022,"ATL":-16001,"BAL":-16033,"BUF":-16002,"CAR":-16029,"CHI":-16003,"CIN":-16004,
    "CLE":-16005,"DAL":-16006,"DEN":-16007,"DET":-16008,"GB":-16009,"HOU":-16034,"IND":-16011,
    "JAX":-16030,"KC":-16012,"LV":-16013,"LAC":-16024,"LAR":-16014,"MIA":-16015,"MIN":-16016,
    "NE":-16017,"NO":-16018,"NYG":-16019,"NYJ":-16020,"PHI":-16021,"PIT":-16023,"SF":-16025,
    "SEA":-16026,"TB":-16027,"TEN":-16010,"WAS":-16028}
  return espnDefId[id];
}

//------------------------------------------------------------------------
// ESPN ID - Provides ESPN scripts with ESPN ID to match with Sleeper ID
function espnId(id) {
  const espnToSleeperId = {'ARI':'-16022','ATL':'-16001','BAL':'-16033','BUF':'-16002','CAR':'-16029','CHI':'-16003','CIN':'-16004','CLE':'-16005','DAL':'-16006','DEN':'-16007','DET':'-16008','GB':'-16009','HOU':'-16034','IND':'-16011','JAX':'-16030','KC':'-16012','LAC':'-16024','LAR':'-16014','LV':'-16013','MIA':'-16015','MIN':'-16016','NE':'-16017','NO':'-16018','NYG':'-16019','NYJ':'-16020','PHI':'-16021','PIT':'-16023','SEA':'-16026','SF':'-16025','TB':'-16027','TEN':'-16010','WAS':'-16028',10210:4372026,10212:4360086,10213:4428718,10214:4426553,10216:4427391,10220:4362523,10222:4362249,10223:4570561,10225:4426485,10227:4372505,10228:4257188,10229:4428331,10231:4426844,10232:4360761,10234:4362477,10235:4426386,10236:4385690,1034:15478,10444:4369863,1049:14876,1067:15072,10857:4259553,10858:5125287,10859:4430027,10871:4372096,10937:4372066,10955:4363538,10983:4259592,11008:4242519,11024:4879650,11077:4379410,11146:4361665,11201:4362018,11224:4239691,11231:4360199,11380:4363098,11447:4243475,1166:14880,1234:14881,1264:15683,1266:14993,1338:15948,1339:15835,1346:15839,1348:15965,1352:15880,1373:15864,1379:16002,1426:15795,1433:16339,1466:15847,1476:15920,1479:15818,1535:15807,1689:16460,17:11122,1837:16760,1945:17372,1992:16799,2020:17427,2028:16757,2073:17315,2078:16733,2133:16800,2161:16782,2197:16731,2216:16737,2251:16813,2306:2969939,2307:2576980,2309:2976499,2319:2576623,2320:2576434,2325:2971618,2331:2972460,2334:2579604,2359:2576336,2374:2577327,2381:2578533,2390:2582410,2399:2577134,2422:2514206,2449:2976212,2460:2574576,2463:2979590,2471:2515270,2505:2576925,2549:2511109,2673:2577667,2711:2565969,2747:2473037,2749:2576414,2750:2580216,3048:2531358,312:11387,3155:3051889,3163:3046779,3164:3051392,3198:3043078,3199:2976316,3200:2976592,3202:3043275,3214:3046439,3225:3045144,3242:2979843,3257:2578570,3269:2576581,3271:2573401,3286:3043116,3294:2577417,3312:2980077,3321:3116406,3342:2577641,3343:2979501,3357:2574511,3362:2574630,3423:2574808,345:12477,3451:2971573,3634:2973405,3664:2572861,3678:2985659,3832:4012556,3852:2978308,391:12731,3969:3115364,3976:3039707,4017:3122840,4018:3116385,4029:3116593,4033:3123076,4034:3117251,4035:3054850,4036:3042778,4037:3116165,4039:2977187,4040:3120348,4046:3139477,4054:2998565,4055:3043080,4066:3051876,4068:3045138,4080:3059722,4082:3121427,4089:3918639,4098:3059915,4111:3125116,4127:2979520,4137:3045147,4144:3054212,4147:3116389,4149:2980453,4171:3115306,4177:2991662,4179:3044720,4183:2972236,4189:2975863,4195:3050478,4197:3128724,4198:3061612,4199:3042519,421:12483,4217:3040151,4218:3040569,4226:4212884,4227:3055899,4229:2972331,4233:3043234,4234:3121409,4274:4212909,4314:3052096,4319:2978109,4335:3051308,4351:3134353,4353:2975417,4381:2468609,4435:3049698,4454:3045523,4455:3049916,4464:3059989,4491:3046399,4574:2972515,4602:2975674,4651:3045260,4663:3068267,4666:3049899,4718:2983509,4741:4212989,4854:3052056,4866:3929630,4881:3916387,4892:3052587,49:9354,4943:3912547,4950:3895856,4951:3115394,4958:16486,4973:3924365,4981:3925357,4983:3915416,4984:3918298,4985:3139925,4988:3128720,4993:3116164,4995:4045305,5000:3119195,5001:3117256,5008:3052897,5010:3127292,5012:3116365,5022:3121023,5024:3122449,5026:3128451,503:12460,5032:3128452,5038:4036348,5045:3128429,5052:3912550,5076:3915381,5086:3051738,5089:3051381,5095:3051909,5096:3728262,5110:3115378,5111:4035019,5113:4036335,5119:3124679,5121:3123075,5122:3051439,5127:3115293,5133:3915486,5134:3046401,5137:3122899,5154:3122168,5171:3049290,5185:3128390,5189:4034949,5209:3139033,5230:3123052,5235:3047536,5248:3051926,5272:3975763,5284:3122976,5285:3120303,5323:3932442,533:13199,5347:3916430,5374:3118892,5409:3050481,5536:3126246,5565:3116158,5695:3115255,5773:3047876,5781:3115928,5823:3127313,5844:4036133,5846:4047650,5848:4241372,5849:3917315,5850:4047365,5854:3924327,5857:4036131,5859:4047646,5870:3917792,5872:3126486,5880:3121410,5890:3925347,5892:4035538,59:10636,5902:3917546,5906:3930086,5916:4039359,5917:4035004,5927:3121422,5937:3932905,5947:3916433,5955:3135321,5965:3932423,5967:3916148,5970:4037235,5973:3921690,5980:3886818,5985:3843945,5987:4048244,5995:4038441,6001:3127310,6011:4038524,6012:4037457,6018:3929924,6074:3912092,6083:4249087,6109:3917668,6126:4040980,6130:4040761,6136:3892775,6144:4035222,6149:3916945,6151:4045163,6181:4039253,6185:3120590,6202:3115349,6208:3048898,6233:3121378,6234:4411193,6271:3917914,6323:3125107,6395:4422214,6402:3917960,6421:3932430,6427:4061956,650:10621,6528:3124084,6588:3126997,6598:3931391,6650:3150744,6659:4421446,6662:3144991,6665:4408854,6699:4424106,6768:4241479,6770:3915511,6783:4241463,6786:4241389,6790:4259545,6794:4262921,6797:4038941,6798:4241802,6801:4239993,6803:4360438,6804:4036378,6805:4240380,6806:4241985,6813:4242335,6814:4243160,6819:4035687,6820:4242214,6824:4258195,6826:4258595,6828:4239934,6843:4035115,6845:4035676,6847:4039050,6849:4035403,6850:4040774,6853:3930066,6865:4242557,6869:3911853,6870:4038818,6878:4241941,6885:3917612,6886:4046692,6895:4035793,6904:4040715,6918:4243315,6920:4242540,6926:3918003,6927:4050373,6931:4240631,6938:4240021,6943:4243537,6945:4360294,6951:4242873,6955:4052042,6956:4046522,6957:3916204,6963:4039358,6964:4036275,6970:4035426,6973:4039607,6984:4046676,6996:3928925,7002:3929645,7042:3917232,7045:3910544,7049:3886598,7050:3914151,7066:3916566,7075:4035020,7083:4035671,7090:4040655,7098:3895827,7106:3917849,7107:4040790,7131:3914240,7204:4039505,7210:3700815,7233:3886809,7404:3930298,7427:3916587,7436:4057082,7496:3929785,7523:4360310,7525:4241478,7526:4372016,7527:4241464,7528:4241457,7529:4245645,7530:4047836,7535:4239944,7536:4244049,7537:4362452,7538:4361259,7540:4239992,7543:4239996,7547:4374302,7551:4240455,7553:4360248,7554:4240023,7561:4241555,7562:4360797,7564:4362628,7565:4362630,7567:4371733,7568:4362504,7569:4258173,7571:4360939,7574:4241205,7585:4242546,7587:4361577,7588:4361579,7591:4362887,7594:4241416,7596:4372414,7599:4374033,7600:4361411,7601:4372485,7602:4039160,7603:4259499,7605:4034946,7606:4240600,7607:4240657,7608:4035886,7610:4383351,7611:4569173,7612:4043016,7670:4242433,7694:4372780,7716:4048228,7720:4035537,7741:4244732,7751:4373642,7757:4035656,7793:4242231,7794:4046530,7812:4360739,7828:4240472,7839:4360234,7842:4040612,7867:4239768,7891:4242392,7922:4243371,7943:4746079,7946:4034862,7956:4031033,8013:4245131,8025:3929914,8038:3957439,8041:4608362,8058:4820592,8110:4242355,8111:4243331,8112:4426502,8114:4362186,8116:4249836,8117:4249417,8118:4570409,8119:4361409,8121:4361432,8122:4427728,8123:4372071,8125:4243389,8126:4569587,8127:4241263,8129:4360238,8130:4361307,8131:4361050,8132:4373626,8134:4373678,8135:4567156,8136:4697815,8137:4426354,8138:4379399,8139:4361777,8140:4360306,8142:4360078,8143:4372019,8144:4361370,8145:4361372,8146:4569618,8147:4567096,8148:4426388,8150:4430737,8151:4567048,8153:4426891,8154:4241474,8155:4427366,8157:4250360,8159:4239086,8160:4240703,8162:4426875,8167:4248528,8168:4430191,8170:4361988,8171:4367175,8172:4367209,8174:4570674,8176:4689546,8177:4241374,8179:4567246,8180:4382466,8181:4241961,8182:4035526,8183:4361741,8188:4362921,8195:4243003,8197:4258248,8205:4361529,8208:4362748,8210:4360635,8211:4426475,8214:4361438,8219:4241410,8221:4362087,8223:4035693,8225:4361516,8227:4374045,8228:4569987,8230:4242431,8235:4027873,8253:4374187,8254:4367567,8255:4259308,8258:4428963,8259:4362081,827:14163,829:14012,8408:4360569,8414:3926231,8428:4260406,8435:4035912,8475:4248822,8484:4034779,8500:4379401,8523:4249624,8527:4401805,8536:4036146,8583:4250764,862:13987,8676:4032473,8745:4247812,8800:4240603,8820:4274040,8885:4242558,8917:3676833,9220:4569609,9221:4429795,9222:4685035,9224:4362238,9225:4429013,9226:4429160,9227:4429202,9228:4685720,9229:4429084,928:14053,9479:4430802,9480:4430539,9481:4428085,9482:4429086,9483:4361417,9484:4572680,9486:4428850,9487:4432620,9488:4430878,9489:4361426,9490:4565908,9493:4426515,9494:4686472,9497:4692590,9500:4688813,9501:4427095,9502:4366031,9504:4429022,9505:4431453,9506:4430871,9508:4428557,9509:4430807,9510:4428119,9512:4430388,956:13981,96:8439,9753:4426385,9754:4429025,9756:4429205,9757:4599739,9758:4432577,9997:4429615,9998:4240858,9999:4361418,11439:4722893,947:13982,10866:4260394,10862:4367178,11199:4362478,9511:4596334,10219:4362619,8489:4722908,10867:4360405,8756:4035198,10863:4362019,11533:3953687,5230:3123052,7042:3917232,1945:17372,1099:15091,4227:3055899,5095:3051909,11008:4242519,8259:4362081,4195:3050478,3451:2971573,650:10621,503:12460,6083:4249087,11058:4259619,8932:4245661,1348:15965,5272:3975763,7933:4046164,4666:3049899,3678:2985659,6650:3150744,1433:16339,7839:4360234,10937:4372066,2747:2473037,7922:4243371,5189:4034949,17:11122,10955:4363538,5119:3124679,2020:17427,6528:3124084,1264:15683,8258:4428963,1266:14993}

  if (id == 'obj') {
    return espnToSleeperId;
  } else {
    let res = espnToSleeperId[id];
    if (res == null){
      res = getKeyByValue(espnToSleeperId,id);
    }
    return res;
  }
}

//------------------------------------------------------------------------
// ESPN ROOKIE ID - Provides ESPN scripts with ESPN ID to match with Sleeper ID
function espnRookieId(id){
  const espnRookieId = { 7561:4241555,7098:3895827,7523:4360310,7525:4241478,7526:4372016,7527:4241464,7528:4241457,
    7538:4361259,7540:4239992,7543:4239996,7547:4374302,7553:4360248,7554:4240023,
    7560:4360326,7562:4360797,7564:4362628,7565:4362630,7567:4371733,7569:4258173,
    7571:4360939,7574:4241205,7583:4241820,7588:4361579,7591:4362887,7593:4241401,
    7594:4241416,7596:4372414,7600:4361411,7601:4372485,7606:4240600,7607:4240657,
    7610:4383351,7611:4569173,7612:4043016,7771:4036224,7794:4046530,7828:4240472,
    8155:4427366,8112:3917914,8129:4360238,8146:4569618,8144:4035170,8168:4430191,
    8151:4567048,8138:4379399,8135:4567156,8119:4361409,7670:4242433,8154:4241474,
    7608:4035886,8132:4373626,8117:4249417,8137:4426354,8126:4039043,8142:4360078,
    8148:4426388,8136:3115364,8139:3123857,8205:4361529,8121:4361432,8167:4248528,
    8153:4426891,8211:4241555,8223:3932442,8123:3043078,8131:2976499,7568:4362504,
    7585:4242546,8160:4240703,7551:4240455,8228:4569987,7529:4040629,7694:4372780,
    8171:4367175,7809:4048259,7720:3116593,8179:4052042,8159:2576980,8189:4259169,
    8150:4430737,8408:4241555,7602:4039160,8225:4361516,8111:4243331,8130:4361307,
    8172:4361307,7716:4048228,8161:4242512,8162:2565969,8118:4570409,7603:4259499,
    7533:4262900,8125:4241983,8188:3054212,8219:4241410,8475:4248822,8527:4047650,
    7989:4036211,7609:4035826,8180:4382466,8181:4241961,7587:4361577,8500:4379401,
    8110:4242355,8176:4689546,8197:4242355,7891:4242392,7757:4256040,7812:4241389,
    8134:4373678,8235:4027873,8227:4374045,8013:4245131,7842:4040612,8114:3122168,
    8210:4360635,7793:4036026,7595:4360115,8116:4249836,8665:4361438,8416:4240380,
    7944:4589245,7946:4241374,8143:3915381,8221:4362087,8484:4034779,8177:4241374,
    8254:3043078,7535:4239944,8745:4247812,8145:4361372,8917:4360739,8698:4259147,
    8122:3915411,8663:4911488,8202:4360174,7713:4243830,8025:4429033,8127:4241263,
    8423:4036032,8214:4361438,7536:4244049,8849:4047422,8170:4361988,8041:4608362,
    7751:4373642,8428:4260406,8230:4242431,7605:4034946,7581:4240904,7572:2975674,
    7752:4068152,7589:4040715,7556:3128724,7531:4034948,7852:3043078};

  if (id == 'obj') {
    return espnRookieId;
  } else {
    let res = espnRookieId[id];
    if (res == null){
      res = getKeyByValue(espnRookieId,id);
    }
    return res;
  }
}



//------------------------------------------------------------------------
// FANTASY PROS ID - Provides ESPN scripts with ESPN ID to match with Sleeper ID
function fantasyProsId(id) {
  const fantasyProsId = {'ARI':8000,'ATL':8010,'BAL':8020,'BUF':8030,'CAR':8040,'CHI':8050,'CIN':8060,'CLE':8070,'DAL':8080,'DEN':8090,'DET':8100,'GB':8110,'HOU':8120,'IND':8130,'JAX':8140,'KC':8150,'LAC':8250,'LAR':8280,'LV':8220,'MIA':8160,'MIN':8170,'NE':8180,'NO':8190,'NYG':8200,'NYJ':8210,'PHI':8230,'PIT':8240,'SEA':8260,'SF':8270,'TB':8290,'TEN':8300,'WAS':8310,10210:24331,10213:25337,10216:25329,10218:25332,10219:22986,10222:23020,10223:23075,10225:23030,10226:25335,10228:25336,10229:23113,10231:23119,10232:25333,10235:25322,10236:25247,1034:11410,10444:25287,1049:11174,1067:11215,10859:22978,10863:24353,10870:25770,10871:25267,10937:24009,10955:25354,11008:25465,11145:25616,1166:11177,1234:11180,1264:11465,1266:11345,1339:11689,1346:11599,1348:11818,1352:11610,1373:11687,1379:11798,1426:11606,1433:13274,1466:11594,1476:11821,1479:11616,1535:11613,1689:13429,17:9443,1825:12128,1837:12208,1945:13029,1992:12126,2020:13731,2028:12092,2078:12127,2133:12123,2161:12209,2197:12122,2216:12119,2251:12095,2306:13891,2309:13894,2319:13897,2320:13903,2325:13969,2359:13924,2374:13971,2399:13977,2449:13981,2460:14084,2505:14104,2711:13932,2747:14003,2749:14338,2750:14103,3161:15520,3163:15501,3164:15498,3198:15514,3199:15528,3200:15569,3202:15581,3214:15561,3225:15547,3242:15637,3257:15642,3269:15654,3271:15623,3286:15665,3294:15600,3321:15802,3423:15688,345:9078,3451:15756,3634:16081,3664:16230,3678:16026,391:9549,3969:16378,4017:16398,4018:16420,4029:16374,4033:16399,4034:16393,4035:16421,4036:16385,4037:16406,4039:16433,4040:16427,4046:16413,4054:16579,4055:16380,4066:16411,4068:16377,4080:16431,4082:16434,4089:16459,4098:16425,4111:16407,4137:16447,4144:16460,4147:16423,4149:16424,4171:16439,4177:16489,4195:16540,4197:16604,4198:16666,4199:16673,421:9451,4217:16499,4227:16712,4233:16548,4234:16443,4351:16556,4381:17115,4454:17066,4455:17058,4464:16726,4602:16502,4651:16446,4663:16483,4666:16910,4741:17143,4866:17240,4881:17233,4892:17237,49:9534,4943:17236,4950:17268,4951:17292,4958:12378,4973:17283,4981:17258,4983:17265,4984:17298,4985:17308,4988:17246,4993:17272,5000:17496,5001:17349,5008:17508,5010:18049,5012:17269,5022:17270,5026:17261,503:9232,5032:17415,5038:17259,5045:17253,5052:17243,5086:17528,5089:17447,5095:17420,5110:17606,5113:17262,5119:17533,5121:17289,5122:17612,5131:17300,5133:17598,5137:17303,5154:17888,5185:17301,5189:17575,5209:17813,5230:17693,5248:17687,5272:17647,5284:18026,5323:17307,533:9702,5347:17297,5374:17603,5536:18037,5823:18670,5844:18290,5846:18219,5848:18226,5849:18600,5850:18269,5857:17527,5859:18218,5870:18232,5872:18244,5880:18463,5890:18230,5892:18239,59:9433,5906:18631,5916:18588,5917:18587,5927:18466,5937:18615,5947:18598,5955:18345,5967:18705,5970:18585,5973:18487,5980:17251,5985:18397,5987:18621,5995:18256,6011:18562,6012:18616,6074:18835,6083:18545,6126:18610,6130:18280,6136:18604,6144:18607,6149:18706,6151:18283,6208:18672,6234:18876,6271:18864,6421:18941,6427:18656,650:9491,6528:19028,6598:18726,6650:19058,6659:19074,6665:18831,6694:19111,6768:19198,6770:19196,6783:19201,6786:19202,6790:19210,6794:19236,6797:18635,6798:19219,6801:19211,6803:19252,6804:19246,6805:19267,6806:19245,6813:19217,6814:19221,6819:19278,6820:19325,6824:19298,6826:19229,6828:19358,6843:18246,6845:19263,6847:19270,6850:19389,6853:19483,6865:19372,6869:19423,6878:19366,6885:19351,6886:18627,6895:19396,6904:19275,6918:19449,6920:19375,6927:19715,6931:19521,6938:19268,6943:19398,6945:19624,6951:19361,6955:19631,6984:19482,6989:19505,6996:19627,7002:19562,7021:19647,7042:19760,7045:19445,7049:19590,7050:19456,7066:19708,7083:19297,7090:19810,7131:17635,7496:19747,7523:19780,7525:19222,7526:19790,7527:20156,7528:19302,7529:23293,7538:22679,7543:19231,7547:19799,7551:20097,7553:20164,7561:22813,7562:20126,7564:19788,7565:23242,7567:23310,7568:20162,7569:20130,7571:19794,7587:20113,7588:22739,7591:19781,7593:19425,7594:19792,7596:20114,7600:20163,7601:19796,7602:22841,7603:20127,7605:19800,7606:20119,7607:22728,7608:22763,7610:20082,7611:22726,7612:22785,7670:22845,7694:22795,7716:22833,7720:23249,7741:19368,7757:22843,7794:22797,7828:19539,7839:23297,7891:23341,7922:23370,8110:22718,8111:23181,8112:23163,8116:24173,8117:23770,8118:23108,8119:23101,8121:23794,8122:24901,8123:23798,8125:23739,8126:22985,8129:22947,8130:22936,8131:23781,8132:24172,8134:23748,8135:22905,8136:23891,8137:22963,8138:22958,8139:20095,8140:19798,8142:23791,8143:22921,8144:20111,8145:23742,8146:23072,8147:22895,8148:23677,8150:23059,8151:23021,8153:23143,8154:20094,8155:22982,8157:24027,8159:20080,8160:22722,8161:23499,8162:23045,8167:23886,8168:23905,8170:23174,8171:23896,8172:23153,8174:23117,8179:23027,8183:19797,8188:22913,8197:22971,8205:24333,8210:23982,8211:22992,8214:23727,8219:23829,8221:23162,8223:24214,8225:24238,8228:24209,8230:19471,8235:23883,8255:20100,8258:24549,8259:23901,829:9907,8408:22969,8536:24588,8676:24687,8800:24205,9220:25325,9221:22968,9222:23122,9224:25324,9225:22908,9226:23136,9227:24352,9228:22900,9229:24347,928:9902,947:9867,9479:22967,9480:25345,9481:25282,9482:23056,9483:25347,9484:25298,9486:24354,9487:23106,9488:23070,9489:24083,9490:25442,9492:25331,9493:23180,9494:23080,9497:25251,9500:24706,9502:25361,9504:22989,9505:22984,9506:23679,9508:25323,9509:23133,9512:25265,956:9872,96:9001,9753:23152,9754:23123,9756:23107,9757:24360,9758:23071,9997:22916,9998:24332,9999:22987}

  if (id == 'obj') {
    return fantasyProsId;
  } else {
    let res = fantasyProsId[id];
    if (res == null){
      res = getKeyByValue(fantasyProsId,id);
    }
    return res;
  }
}

//------------------------------------------------------------------------
// NAME FINDER - Searches for alternative ways to spell players names and provides Sleeper ID as result
function nameFinder(name) {
  let id = null;
  let names = {
    "Matt Prater":17,
    "Joe Flacco":19,
    "Matt Ryan":24,
    "Chad Henne":89,
    "Aaron Rodgers":96,
    "Marcedes Lewis":111,
    "Ben Roethlisberger":138,
    "Tom Brady":167,
    "Josh Johnson":260,
    "Matt Slater":312,
    "Matthew Slater":312,
    "Brian Hoyer":345,
    "Matthew Stafford":421,
    "Chase Daniel":490,
    "Graham Gano":503,
    "Colt McCoy":533,
    "Andre Roberts":627,
    "Nick Folk":650,
    "Lee Smith":812,
    "Tyrod Taylor":827,
    "Andy Dalton":829,
    "A.J. Green":830,
    "AJ Green":830,
    "Blaine Gabbert":862,
    "Taiwan Jones":886,
    "Randall Cobb":928,
    "Kyle Rudolph":943,
    "Julio Jones":947,
    "Mark Ingram":956,
    "Mark Ingram II":956,
    "Nick Foles":1029,
    "Brandon Bolden":1034,
    "Ryan Tannehill":1049,
    "Marvin Jones":1067,
    "Marvin Jones Jr":1067,
    "Marvin Jones Jr.":1067,
    "Mohamed Sanu":1071,
    "Mohamed Sanu Sr":1071,
    "Mohamed Sanu Sr.":1071,
    "Kirk Cousins":1166,
    "Russell Wilson":1234,
    "Josh Gordon":1244,
    "Justin Tucker":1264,
    "Greg Zuerlein":1266,
    "Matt Barkley":1338,
    "Zach Ertz":1339,
    "Marquise Goodwin":1346,
    "Dustin Hopkins":1348,
    "Robert Woods":1352,
    "Geno Smith":1373,
    "Kyle Juszczyk":1379,
    "Giovani Bernard":1386,
    "Rex Burkhead":1387,
    "Le'Veon Bell":1408,
    "DeAndre Hopkins":1426,
    "Brandon McManus":1433,
    "Travis Kelce":1466,
    "Latavius Murray":1476,
    "Keenan Allen":1479,
    "Cordarrelle Patterson":1535,
    "Kenjon Barner":1546,
    "Darren Fells":1592,
    "Levine Toilolo":1642,
    "Adam Thielen":1689,
    "Jack Doyle":1706,
    "Case Keenum":1737,
    "Jordan Matthews":1800,
    "Sammy Watkins":1817,
    "Jarvis Landry":1825,
    "Damien Williams":1833,
    "Jimmy Garoppolo":1837,
    "AJ McCarron":1895,
    "Will Snead":1911,
    "Willie Snead":1911,
    "Willie Snead IV":1911,
    "Martavis Bryant":1916,
    "Chris Boswell":1945,
    "Blake Bortles":1979,
    "Allen Hurns":1984,
    "Allen Robinson":1992,
    "Allen Robinson II":1992,
    "Cairo Santos":2020,
    "Derek Carr":2028,
    "Keith Smith":2073,
    "Odell Beckham":2078,
    "Odell Beckham Jr":2078,
    "Odell Beckham Jr.":2078,
    "Eric Ebron":2118,
    "Davante Adams":2133,
    "Richard Rodgers":2146,
    "Teddy Bridgewater":2152,
    "Jerick McKinnon":2161,
    "Brandin Cooks":2197,
    "Cameron Brate":2214,
    "Mike Evans":2216,
    "John Brown":2238,
    "Logan Thomas":2251,
    "Jameis Winston":2306,
    "Marcus Mariota":2307,
    "Amari Cooper":2309,
    "Kevin White":2312,
    "DeVante Parker":2319,
    "Melvin Gordon":2320,
    "Melvin Gordon III":2320,
    "Nelson Agholor":2325,
    "Breshad Perriman":2331,
    "Phillip Dorsett":2334,
    "Phillip Dorsett II":2334,
    "Devin Funchess":2346,
    "Ameer Abdullah":2359,
    "Maxx Williams":2360,
    "Tyler Lockett":2374,
    "Tevin Coleman":2378,
    "Chris Conley":2381,
    "Duke Johnson":2382,
    "Duke Johnson Jr.":2382,
    "Tyler Kroft":2390,
    "Sean Mannion":2394,
    "Ty Montgomery":2399,
    "Ty Montgomery II":2399,
    "Jamison Crowder":2410,
    "Blake Bell":2422,
    "Mike Davis":2431,
    "MyCole Pruitt":2446,
    "Stefon Diggs":2449,
    "C.J. Uzomah":2460,
    "CJ Uzomah":2460,
    "Jesse James":2463,
    "Michael Burton":2471,
    "Nick Boyle":2474,
    "James O'Shaughnessy":2476,
    "Darren Waller":2505,
    "Geoff Swaim":2545,
    "Trevor Siemian":2549,
    "Damiere Byrd":2673,
    "Taylor Heinicke":2711,
    "Jason Myers":2747,
    "Raheem Mostert":2749,
    "DeAndre Carter":2750,
    "Eric Tomlinson":2755,
    "Jake Kumerow":2821,
    "Matt LaCosse":2944,
    "Chris Manhertz":3048,
    "Myles White":3050,
    "Laquon Treadwell":3155,
    "Will Fuller":3157,
    "Will Fuller V":3157,
    "William Fuller":3157,
    "William Fuller V":3157,
    "Carson Wentz":3161,
    "Jared Goff":3163,
    "Ezekiel Elliott":3164,
    "Zeke Elliott":3164,
    "Corey Coleman":3177,
    "Derrick Henry":3198,
    "Michael Thomas":3199,
    "Sterling Shepard":3200,
    "Austin Hooper":3202,
    "Hunter Henry":3214,
    "Tyler Boyd":3225,
    "Bronson Kaufusi":3239,
    "Kenyan Drake":3242,
    "Jacoby Brissett":3257,
    "Nick Vannett":3258,
    "Chris Moore":3269,
    "Tyler Higbee":3271,
    "Pharoh Cooper":3278,
    "Demarcus Robinson":3286,
    "Dak Prescott":3294,
    "Tajae Sharpe":3297,
    "Tajaé Sharpe":3297,
    "Wendell Smallwood":3309,
    "Jonathan Williams":3312,
    "Tyreek Hill":3321,
    "Rashard Higgins":3328,
    "Temarrick Hemingway":3333,
    "Jakeem Grant":3342,
    "Jakeem Grant Sr.":3342,
    "Nate Sudfeld":3343,
    "Derek Watt":3354,
    "Brandon Allen":3357,
    "Jeff Driskel":3362,
    "Dwayne Washington":3391,
    "Robbie Anderson":3423,
    "Robbie Chosen":3423,
    "Alex Erickson":3433,
    "Marcus Johnson":3445,
    "Ka'imi Fairbairn":3451,
    "Stephen Anderson":3496,
    "Marken Michel":3568,
    "Chester Rogers":3582,
    "Kalif Raymond":3634,
    "Mike Thomas":3652,
    "J.D. McKissic":3664,
    "Joshua Perkins":3668,
    "Wil Lutz":3678,
    "J.P. Holtz":3695,
    "Andy Jones":3702,
    "C.J. Ham":3832,
    "Jalen Richard":3868,
    "Leonard Fournette":3969,
    "Mitch Trubisky":3976,
    "Mitchell Trubisky":3976,
    "Deshaun Watson":4017,
    "Joe Mixon":4018,
    "Dalvin Cook":4029,
    "David Njoku":4033,
    "Christian McCaffrey":4034,
    "Alvin Kamara":4035,
    "Corey Davis":4036,
    "Chris Godwin":4037,
    "John Ross":4038,
    "John Ross III":4038,
    "Cooper Kupp":4039,
    "JuJu Smith-Schuster":4040,
    "Patrick Mahomes":4046,
    "Patrick Mahomes II":4046,
    "Cyril Grayson":4050,
    "Cyril Grayson Jr.":4050,
    "Mo Alie-Cox":4054,
    "O.J. Howard":4055,
    "OJ Howard":4055,
    "Davis Webb":4061,
    "Evan Engram":4066,
    "Mike Williams":4068,
    "Zay Jones":4080,
    "Curtis Samuel":4082,
    "Adam Shaheen":4085,
    "Gerald Everett":4089,
    "Kareem Hunt":4098,
    "D'Onta Foreman":4111,
    "C.J. Beathard":4127,
    "Kenny Golladay":4131,
    "James Conner":4137,
    "Jonnu Smith":4144,
    "Samaje Perine":4147,
    "Jamaal Williams":4149,
    "Marlon Mack":4152,
    "Josh Reynolds":4171,
    "Mack Hollins":4177,
    "Joshua Dobbs":4179,
    "Nathan Peterman":4183,
    "Eric Saubert":4189,
    "Jake Elliott":4195,
    "Isaiah McKenzie":4197,
    "Jamal Agnew":4198,
    "Aaron Jones":4199,
    "George Kittle":4217,
    "Trent Taylor":4218,
    "Jeremy McNichols":4219,
    "Jeremy Sprinkle":4221,
    "Alex Armah Jr.":4226,
    "Harrison Butker":4227,
    "Mason Schreck":4229,
    "Zane Gonzalez":4233,
    "Noah Brown":4234,
    "Elijah McGuire":4263,
    "David Moore":4274,
    "Johnny Mundt":4314,
    "Zach Pascal":4319,
    "Bug Howard":4326,
    "P.J. Walker":4335,
    "PJ Walker":4335,
    "C.J. Board":4344,
    "Taquan Mizzell":4349,
    "Tim Patrick":4351,
    "Patrick Ricard":4353,
    "Cethan Carter":4362,
    "Taysom Hill":4381,
    "Cody Hollister":4420,
    "Jacob Hollister":4421,
    "Anthony Firkser":4435,
    "Pharaoh Brown":4443,
    "Isaac Whitney":4451,
    "Victor Bolden":4453,
    "Kendrick Bourne":4454,
    "Matt Breida":4455,
    "Nick Mullens":4464,
    "Antony Auclair":4468,
    "Wyatt Houston":4490,
    "Marcus Kemp":4491,
    "Ricky Seals-Jones":4531,
    "Tanner Gentry":4551,
    "Cooper Rush":4574,
    "Robert Tonyan":4602,
    "Keelan Cole":4622,
    "Keelan Cole Sr.":4622,
    "Colin Thompson":4647,
    "Austin Ekeler":4663,
    "Younghoe Koo":4666,
    "Aaron Bailey":4683,
    "Dare Ogunbowale":4718,
    "Dan Arnold":4741,
    "Barrett Burns":4744,
    "River Cracraft":4854,
    "Josh Rosen":4863,
    "Saquon Barkley":4866,
    "Brandon Zylstra":4878,
    "Lamar Jackson":4881,
    "Baker Mayfield":4892,
    "Glen Coffee":4914,
    "Garrett Scantling":4922,
    "Zach Terrell":4924,
    "Nick Schuessler":4926,
    "Franko House":4930,
    "Skyler Howard":4936,
    "Al Riles":4937,
    "Sam Darnold":4943,
    "Christian Kirk":4950,
    "D.J. Chark":4951,
    "D.J. Chark Jr.":4951,
    "DJ Chark":4951,
    "DJ Chark Jr":4951,
    "DJ Chark Jr.":4951,
    "Sony Michel":4962,
    "Mason Rudolph":4972,
    "Hayden Hurst":4973,
    "Calvin Ridley":4981,
    "D.J. Moore":4983,
    "DJ Moore":4983,
    "Josh Allen":4984,
    "Rashaad Penny":4985,
    "Nick Chubb":4988,
    "Dante Pettis":4992,
    "Mike Gesicki":4993,
    "Ian Thomas":4995,
    "Chase Edmonds":5000,
    "Dalton Schultz":5001,
    "Ito Smith":5004,
    "Keke Coutee":5007,
    "Durham Smythe":5008,
    "Chris Herndon":5009,
    "Chris Herndon IV":5009,
    "Christopher Herndon":5009,
    "Will Dissly":5010,
    "Mark Andrews":5012,
    "Anthony Miller":5013,
    "Dallas Goedert":5022,
    "James Washington":5024,
    "Tre'Quan Smith":5026,
    "Jordan Akins":5032,
    "Michael Gallup":5038,
    "Courtland Sutton":5045,
    "Royce Freeman":5046,
    "Ronald Jones":5052,
    "Ronald Jones I":5052,
    "Ronald Jones II":5052,
    "John Kelly":5076,
    "John Kelly Jr.":5076,
    "Marquez Valdes-Scantling":5086,
    "Mike White":5089,
    "Troy Fumagalli":5092,
    "Daniel Carlson":5095,
    "Ray-Ray McCloud":5096,
    "Ray-Ray McCloud III":5096,
    "Deon Cain":5101,
    "Daurice Fountain":5102,
    "Russell Gage":5110,
    "Javon Wims":5111,
    "Cedrick Wilson":5113,
    "Cedrick Wilson Jr.":5113,
    "Nick Bawden":5116,
    "Jason Sanders":5119,
    "Danny Etling":5120,
    "Braxton Berrios":5121,
    "Boston Scott":5122,
    "Trenton Cannon":5123,
    "Kyle Allen":5127,
    "Logan Woodside":5128,
    "Justin Jackson":5131,
    "Tyler Conklin":5133,
    "Keith Kirkwood":5134,
    "Richie James":5137,
    "Richie James Jr.":5137,
    "Trent Sherfield":5154,
    "Trent Sherfield Sr.":5154,
    "Reggie Bonnafon":5162,
    "Phillip Lindsay":5170,
    "Kevin Rader":5171,
    "Allen Lazard":5185,
    "Eddy Pineiro":5189,
    "Eddy Piñeiro":5189,
    "Rico Gafford":5197,
    "Byron Pringle":5199,
    "Mike Boone":5209,
    "Godwin Igwebuike":5220,
    "Caleb Scott":5223,
    "Michael Badgley":5230,
    "David Wells":5235,
    "Gus Edwards":5248,
    "Robert Foster":5250,
    "Jordan Franks":5253,
    "Tim Boyle":5257,
    "Greg Joseph":5272,
    "Deon Yelder":5277,
    "Duplicate Player":5282,
    "Jeff Wilson":5284,
    "Jeff Wilson Jr.":5284,
    "Jeffery Wilson":5284,
    "Jeffery Wilson Jr":5284,
    "Jeffery Wilson Jr.":5284,
    "Ross Dwelley":5285,
    "Donnie Ernsberger":5288,
    "Cameron Batson":5289,
    "Equanimeous St. Brown":5323,
    "Nyheim Hines":5347,
    "Justin Watson":5374,
    "Matt McCrane":5386,
    "Tanner Hudson":5409,
    "Cam Sims":5432,
    "Dontrell Hilliard":5536,
    "Darrel Williams":5549,
    "Jason Cabinda":5565,
    "Johnny Stanton":5569,
    "Shaq Roland":5638,
    "Brandon Powell":5695,
    "Eldridge Massington":5744,
    "Jaeden Graham":5754,
    "KhaDarel Hodge":5773,
    "Khadarel Hodge":5773,
    "Malik Turner":5781,
    "John Wolford":5806,
    "T.J. Hockenson":5844,
    "Dwayne Haskins":5845,
    "Dwayne Haskins Jr":5845,
    "Dwayne Haskins Jr.":5845,
    "D.K. Metcalf":5846,
    "DK Metcalf":5846,
    "Hollywood Brown":5848,
    "Marquise Brown":5848,
    "Kyler Murray":5849,
    "Josh Jacobs":5850,
    "Joshua Jacobs":5850,
    "Drew Lock":5854,
    "Noah Fant":5857,
    "A.J. Brown":5859,
    "J.J. Arcega-Whiteside":5863,
    "JJ Arcega-Whiteside":5863,
    "Daniel Jones":5870,
    "Deebo Samuel":5872,
    "Deebo Samuel Sr.":5872,
    "N'Keal Harry":5878,
    "Parris Campbell":5880,
    "Damien Harris":5890,
    "David Montgomery":5892,
    "Penny Hart":5902,
    "Will Grier":5903,
    "Dawson Knox":5906,
    "Andy Isabella":5915,
    "Darrell Henderson":5916,
    "Darrell Henderson Jr":5916,
    "Darrell Henderson Jr.":5916,
    "Mecole Hardman":5917,
    "Mecole Hardman Jr.":5917,
    "Elijah Holyfield":5919,
    "Terry McLaurin":5927,
    "Diontae Johnson":5937,
    "Lil'Jordan Humphrey":5938,
    "Jakobi Meyers":5947,
    "Hunter Renfrow":5955,
    "Isaac Nauta":5957,
    "KeeSean Johnson":5962,
    "Miles Boykin":5965,
    "Tony Pollard":5967,
    "Greg Dortch":5970,
    "Josh Oliver":5973,
    "Trace McSorley":5974,
    "Alize Mack":5975,
    "Myles Gaskin":5980,
    "Foster Moreau":5985,
    "Alexander Mattison":5987,
    "Justice Hill":5995,
    "Drew Sample":6001,
    "Qadree Ollison":6002,
    "Ryquell Armstead":6007,
    "Gardner Minshew":6011,
    "Gardner Minshew II":6011,
    "Travis Homer":6012,
    "Dax Raymond":6016,
    "Zach Gentry":6018,
    "Keelan Doss":6032,
    "Brett Rypien":6037,
    "Ty Johnson":6039,
    "Tyree Jackson":6040,
    "Gary Jennings":6045,
    "Travis Fulgham":6059,
    "Tyron Billy-Johnson":6063,
    "Tyron Johnson":6063,
    "Devine Ozigbo":6068,
    "Stanley Morgan":6069,
    "Stanley Morgan Jr.":6069,
    "Donald Parham":6074,
    "Donald Parham Jr":6074,
    "Donald Parham Jr.":6074,
    "Jesper Horsted":6075,
    "Kendall Blanton":6081,
    "Matt Gay":6083,
    "Bisi Johnson":6088,
    "Jacques Patrick":6108,
    "Alec Ingold":6109,
    "Jake Browning":6111,
    "Irv Smith":6126,
    "Irv Smith Jr":6126,
    "Irv Smith Jr.":6126,
    "Devin Singletary":6130,
    "Jarrett Stidham":6136,
    "Tommy Sweeney":6137,
    "Jace Sternberger":6139,
    "Trayveon Williams":6144,
    "Kaden Smith":6146,
    "Clayton Thorson":6147,
    "Preston Williams":6148,
    "Darius Slayton":6149,
    "Miles Sanders":6151,
    "Dexter Williams":6153,
    "David Sills":6154,
    "David Sills V":6154,
    "Jaylen Smith":6155,
    "Benny Snell":6156,
    "Benny Snell Jr":6156,
    "Benny Snell Jr.":6156,
    "Antoine Wesley":6165,
    "Jordan Scarlett":6167,
    "Cody Thompson":6171,
    "Kerrith Whyte":6175,
    "Darwin Thompson":6178,
    "Trevon Wesco":6181,
    "Easton Stick":6185,
    "Jakob Johnson":6202,
    "Ishmael Hyman":6209,
    "Austin Seibert":6219,
    "Juwann Winfree":6223,
    "Matt Sokol":6233,
    "Deonte Harty":6234,
    "Malik Taylor":6239,
    "Jason Moore":6247,
    "Jason Moore Jr.":6247,
    "Matthew Wright":6268,
    "Olamide Zaccheaus":6271,
    "Scott Miller":6290,
    "Scotty Miller":6290,
    "Patrick Laird":6311,
    "Andrew Beck":6323,
    "Damarea Crockett":6334,
    "Khari Blasingame":6379,
    "Davion Davis":6380,
    "Alex Bachman":6386,
    "Nsimba Webster":6387,
    "Trinity Benson":6395,
    "Steven Sims":6402,
    "Steven Sims Jr":6402,
    "Steven Sims Jr.":6402,
    "Jalen Guyton":6421,
    "Ashton Dulin":6427,
    "David Blough":6450,
    "Stephen Carlson":6451,
    "D.J. Montgomery":6453,
    "Thomas Ives":6465,
    "Darrius Shepherd":6519,
    "Joey Slye":6528,
    "Chris Myarick":6529,
    "Nate Becker":6535,
    "DeAndre Thompkins":6540,
    "Austin Walter":6553,
    "Jeff Smith":6557,
    "Tom Kennedy":6588,
    "Trenton Irwin":6598,
    "Chase McLaughlin":6650,
    "Craig Reynolds":6659,
    "Parker Hesse":6662,
    "Jody Fortson":6665,
    "Joe Forson":6677,
    "D'Ernest Johnson":6694,
    "Gunner Olszewski":6699,
    "Greg Ward":6744,
    "Derrick Gore":6753,
    "Tua Tagovailoa":6768,
    "Joe Burrow":6770,
    "Chris Streveler":6778,
    "Jerry Jeudy":6783,
    "CeeDee Lamb":6786,
    "Henry Ruggs":6789,
    "Henry Ruggs III":6789,
    "D'Andre Swift":6790,
    "Justin Jefferson":6794,
    "Justin Herbert":6797,
    "Jalen Reagor":6798,
    "Tee Higgins":6801,
    "Brandon Aiyuk":6803,
    "Jordan Love":6804,
    "K.J. Hamler":6805,
    "KJ Hamler":6805,
    "J.K. Dobbins":6806,
    "Jonathan Taylor":6813,
    "Laviska Shenault":6814,
    "Laviska Shenault Jr":6814,
    "Laviska Shenault Jr.":6814,
    "Michael Pittman":6819,
    "Michael Pittman Jr":6819,
    "Michael Pittman Jr.":6819,
    "Clyde Edwards-Helaire":6820,
    "Jake Fromm":6822,
    "Jacob Eason":6823,
    "Donovan Peoples-Jones":6824,
    "Cole Kmet":6826,
    "A.J. Dillon":6828,
    "AJ Dillon":6828,
    "Jared Pinkney":6834,
    "Albert Okwuegbunam":6843,
    "Albert Okwuegbunam Jr.":6843,
    "Zack Moss":6845,
    "Devin Duvernay":6847,
    "Denzel Mims":6849,
    "Harrison Bryant":6850,
    "Van Jefferson":6853,
    "Collin Johnson":6857,
    "Colby Parkinson":6865,
    "K.J. Hill Jr.":6866,
    "KJ Hill":6866,
    "Adam Trautman":6869,
    "Bryan Edwards":6870,
    "Anthony McFarland":6878,
    "Anthony McFarland Jr":6878,
    "Anthony McFarland Jr.":6878,
    "Ke'Shawn Vaughn":6885,
    "Chase Claypool":6886,
    "Mitchell Wilcox":6894,
    "Quintez Cephus":6895,
    "Jalen Hurts":6904,
    "La'Mical Perine":6908,
    "Lynn Bowden":6909,
    "Joe Reed":6913,
    "Salvon Ahmed":6918,
    "Thaddeus Moss":6919,
    "Isaiah Hodgins":6920,
    "Brycen Hopkins":6926,
    "Quez Watkins":6927,
    "DeeJay Dallas":6931,
    "Cam Akers":6938,
    "Binjimen Victor":6939,
    "Gabe Davis":6943,
    "Gabriel Davis":6943,
    "Antonio Gibson":6945,
    "Eno Benjamin":6951,
    "James Robinson":6955,
    "Devin Asiasi":6956,
    "James Proche":6957,
    "James Proche II":6957,
    "Tyler Johnson":6960,
    "Patrick Taylor":6963,
    "Patrick Taylor Jr.":6963,
    "Sean McKeon":6964,
    "Aaron Fuller":6967,
    "Stephen Sullivan":6970,
    "J.J. Taylor":6973,
    "Tony Jones":6984,
    "Tony Jones Jr":6984,
    "Tony Jones Jr.":6984,
    "Dezmon Patmon":6985,
    "Marquez Callaway":6989,
    "Michael Warren":6992,
    "JaMycal Hasty":6996,
    "Juwan Johnson":7002,
    "Trishton Jackson":7009,
    "Rico Dowdle":7021,
    "Tyrie Cleveland":7032,
    "Darius Anderson":7038,
    "Cody White":7039,
    "Tyler Bass":7042,
    "Joshua Kelley":7045,
    "Benny LeMay":7048,
    "Jauan Jennings":7049,
    "Josiah Deguara":7050,
    "Darrynton Evans":7064,
    "Eli Wolf":7065,
    "K.J. Osborn":7066,
    "Charlie Woerner":7075,
    "Dalton Keene":7082,
    "Tyler Huntley":7083,
    "Jake Luton":7084,
    "Isaiah Coulter":7085,
    "John Hightower":7086,
    "Jonathan Ward":7087,
    "Darnell Mooney":7090,
    "Aaron Parker":7091,
    "Chris Finke":7092,
    "Adrian Killins":7093,
    "Adrian Killins Jr.":7093,
    "Ty'Son Williams":7098,
    "Tavien Feaster":7103,
    "Lawrence Cager":7106,
    "Jason Huntley":7107,
    "Tyler Davis":7131,
    "Freddie Swain":7135,
    "Ben DiNucci":7143,
    "Tommy Stevens":7149,
    "Reid Sinnett":7159,
    "Jaylon Moore":7191,
    "Antonio Williams":7203,
    "Reggie Gilliam":7204,
    "Kendall Hinton":7210,
    "Giovanni Ricci":7216,
    "Andre Baccellia":7233,
    "Ja'Marcus Bradley":7244,
    "Jalen Morton":7262,
    "DeMichael Harris":7279,
    "Josh Hammond":7287,
    "Ben Ellefson":7288,
    "Nick Bowers":7308,
    "Gabe Nabers":7318,
    "Jeff Cotton":7319,
    "Bryce Perkins":7335,
    "Easop Winston":7337,
    "Easop Winston Jr.":7337,
    "Kirk Merritt":7351,
    "Matt Cole":7352,
    "Dan Chisena":7357,
    "Nakia Griffin-Stewart":7359,
    "Noah Togiai":7404,
    "Sandro Platzgummer":7412,
    "Tyler Mabry":7427,
    "Mason Kinsey":7436,
    "Kristian Wilkerson":7438,
    "Tommy Hudson":7439,
    "Isaiah Zuber":7458,
    "Nick Westbrook-Ikhine":7496,
    "Paul Quessenberry":7499,
    "Chris Blair":7521,
    "Trevor Lawrence":7523,
    "DeVonta Smith":7525,
    "Jaylen Waddle":7526,
    "Mac Jones":7527,
    "Najee Harris":7528,
    "Gary Brightwell":7529,
    "Frank Darby":7530,
    "Feleipe Franks":7531,
    "Anthony Schwartz":7533,
    "Seth Williams":7534,
    "Hunter Long":7535,
    "Quintin Morris":7536,
    "Jaret Patterson":7537,
    "Zach Wilson":7538,
    "Gerrid Doaks":7539,
    "Amari Rodgers":7540,
    "Cornell Powell":7541,
    "Travis Etienne":7543,
    "Travis Etienne Jr":7543,
    "Travis Etienne Jr.":7543,
    "Tre Nixon":7546,
    "Amon-Ra St. Brown":7547,
    "Tyler Vaughns":7548,
    "Deon Jackson":7551,
    "Blake Proehl":7552,
    "Kyle Pitts":7553,
    "Tre' McKitty":7554,
    "Marquez Stevenson":7556,
    "Ihmir Smith-Marsette":7559,
    "Elijah Mitchell":7561,
    "Tutu Atwell":7562,
    "Ja'Marr Chase":7564,
    "Terrace Marshall":7565,
    "Terrace Marshall Jr":7565,
    "Terrace Marshall Jr.":7565,
    "Kenneth Gainwell":7567,
    "Brevin Jordan":7568,
    "Nico Collins":7569,
    "Rashod Bateman":7571,
    "Kylin Hill":7572,
    "Larry Rountree":7574,
    "Larry Rountree III":7574,
    "Sage Surratt":7576,
    "Myron Mitchell":7578,
    "Austin Watkins Jr.":7579,
    "Kellen Mond":7581,
    "Sam Ehlinger":7583,
    "Davis Mills":7585,
    "Dyami Brown":7587,
    "Javonte Williams":7588,
    "Ian Book":7589,
    "Justin Fields":7591,
    "Trey Sermon":7593,
    "Chuba Hubbard":7594,
    "Tylan Wallace":7595,
    "Elijah Moore":7596,
    "Kenny Yeboah":7597,
    "Jermar Jefferson":7599,
    "Pat Freiermuth":7600,
    "Rondale Moore":7601,
    "Kylen Granson":7602,
    "Shi Smith":7603,
    "Kyle Trask":7605,
    "Kadarius Toney":7606,
    "Michael Carter":7607,
    "Khalil Herbert":7608,
    "Demetric Felton":7609,
    "Demetric Felton Jr.":7609,
    "Trey Lance":7610,
    "Rhamondre Stevenson":7611,
    "D'Wayne Eskridge":7612,
    "Dee Eskridge":7612,
    "Micah Simon":7618,
    "Sammis Reyes":7622,
    "Josh Palmer":7670,
    "Joshua Palmer":7670,
    "Tommy Tremble":7694,
    "Jacob Harris":7703,
    "Jaelon Darden":7713,
    "John Bates":7716,
    "Kene Nwangwu":7720,
    "Dez Fitzpatrick":7729,
    "Caleb Huntley":7741,
    "Austin Trammell":7746,
    "Dax Milne":7751,
    "Kawaan Baker":7752,
    "Ben Skowronek":7757,
    "Jake Funk":7771,
    "Jalen Camp":7789,
    "Racey McMath":7793,
    "Chris Evans":7794,
    "Ben Mason":7808,
    "Avery Williams":7809,
    "Simi Fehoko":7812,
    "Noah Gray":7828,
    "Evan McPherson":7839,
    "Luke Farrell":7842,
    "Tory Carter":7852,
    "Miller Forristall":7854,
    "Nick Eubanks":7859,
    "T.J. Vasher":7862,
    "JaQuan Hardy":7863,
    "Brandon Smith":7865,
    "Spencer Brown":7867,
    "Mason Stokke":7868,
    "Brock Wright":7891,
    "Landen Akers":7915,
    "Riley Patterson":7922,
    "Hunter Kampmoyer":7938,
    "Zach Davidson":7943,
    "Mike Strachan":7944,
    "Jack Stoll":7946,
    "Connor Wedington":7954,
    "Cade Johnson":7956,
    "Tony Poljan":7972,
    "John Raine":7980,
    "DJ Turner":7989,
    "Matt Bushman":7992,
    "Trey Ragas":7993,
    "Dillon Stoner":7996,
    "Shane Buechele":8002,
    "Tarik Black":8005,
    "Tim Jones":8013,
    "Adam Prentice":8025,
    "Bernhard Seikovits":8033,
    "Nick Guggemos":8038,
    "Shane Zylstra":8041,
    "Nate McCrary":8058,
    "Jake Hausmann":8061,
    "C.J. Saunders":8068,
    "Michael Bandy":8076,
    "Otis Anderson Jr.":8077,
    "Mekhi Sargent":8085,
    "Kalif Jackson":8088,
    "Sal Cannella":8089,
    "Michael Jacobson":8094,
    "Nikola Kalinic":8107,
    "Jake Ferguson":8110,
    "Cade Otton":8111,
    "Drake London":8112,
    "Erik Ezukanma":8114,
    "Jalen Wydermyer":8115,
    "Pierre Strong":8116,
    "Pierre Strong Jr.":8116,
    "Jalen Tolbert":8117,
    "David Bell":8118,
    "Jahan Dotson":8119,
    "Jerrion Ealy":8120,
    "Romeo Doubs":8121,
    "Zonovan Knight":8122,
    "Hassan Haskins":8123,
    "Calvin Austin":8125,
    "Calvin Austin III":8125,
    "Wan'Dale Robinson":8126,
    "Charlie Kolar":8127,
    "Dameon Pierce":8129,
    "Trey McBride":8130,
    "Isaiah Likely":8131,
    "Tyler Allgeier":8132,
    "Khalil Shakir":8134,
    "Treylon Burks":8135,
    "Rachaad White":8136,
    "George Pickens":8137,
    "James Cook":8138,
    "Zamir White":8139,
    "Justyn Ross":8140,
    "Alec Pierce":8142,
    "Jerome Ford":8143,
    "Chris Olave":8144,
    "Jeremy Ruckert":8145,
    "Garrett Wilson":8146,
    "John Metchie":8147,
    "John Metchie III":8147,
    "Jameson Williams":8148,
    "Kyren Williams":8150,
    "Ken Walker":8151,
    "Ken Walker III":8151,
    "Kenneth Walker":8151,
    "Kenneth Walker III":8151,
    "Kennedy Brooks":8152,
    "Isaiah Spiller":8153,
    "Brian Robinson":8154,
    "Brian Robinson Jr.":8154,
    "Breece Hall":8155,
    "Bailey Zappe":8157,
    "Carson Strong":8158,
    "Desmond Ridder":8159,
    "Kenny Pickett":8160,
    "Malik Willis":8161,
    "Sam Howell":8162,
    "Matt Corral":8164,
    "Dontario Drummond":8166,
    "Christian Watson":8167,
    "Skyy Moore":8168,
    "James Mitchell":8170,
    "Kyle Philips":8171,
    "Greg Dulcich":8172,
    "ZaQuandre White":8173,
    "Kevin Harris":8174,
    "Reggie Roberson":8175,
    "Danny Gray":8176,
    "Grant Calcaterra":8177,
    "Braylon Sanders":8178,
    "Snoop Conner":8179,
    "Jalen Nailor":8180,
    "Connor Heyward":8181,
    "Chase Allen":8182,
    "Brock Purdy":8183,
    "D'Vonte Price":8184,
    "Johnny Johnson":8185,
    "Johnny Johnson III":8185,
    "Tyquan Thornton":8188,
    "Trestan Ebner":8189,
    "Abram Smith":8190,
    "Slade Bolden":8191,
    "Curtis Hodges":8192,
    "E.J. Perry":8193,
    "Jashaun Corbin":8194,
    "Ronnie Rivers":8195,
    "Peyton Hendershot":8197,
    "Charleston Rambo":8198,
    "Kevin Austin":8200,
    "Jack Coan":8201,
    "Michael Woods":8202,
    "Michael Woods II":8202,
    "Bo Melton":8204,
    "Isiah Pacheco":8205,
    "Skylar Thompson":8206,
    "Tyler Goodson":8207,
    "Tyler Badie":8208,
    "Makai Polk":8209,
    "Chigoziem Okonkwo":8210,
    "Tyrion Davis-Price":8211,
    "Dustin Crum":8212,
    "Dai'Jean Dixon":8213,
    "Cole Turner":8214,
    "Austin Allen":8215,
    "Leddie Brown":8217,
    "Max Borghi":8218,
    "Jelani Woods":8219,
    "Sincere McCormick":8220,
    "Keaontay Ingram":8221,
    "Velus Jones":8223,
    "Velus Jones Jr.":8223,
    "Daniel Bellinger":8225,
    "Teagan Quitoriano":8227,
    "Jaylen Warren":8228,
    "Ty Chandler":8230,
    "Samori Toure":8235,
    "Jerreth Sterns":8236,
    "Anthony Brown":8241,
    "Derrick Deese":8245,
    "Bryant Koback":8246,
    "Gerrit Prince":8247,
    "Kalil Pimpleton":8248,
    "Lucas Krull":8249,
    "Tay Martin":8250,
    "Calvin Jackson":8251,
    "Deven Thompkins":8253,
    "Julius Chestnut":8254,
    "Raheem Blackshear":8255,
    "Cade York":8258,
    "Cameron Dicker":8259,
    "Jordan Mason":8408,
    "Tyler Snead":8409,
    "Devon Allen":8411,
    "Chris Oladokun":8413,
    "Britain Covey":8414,
    "Jalen Virgil":8416,
    "Stanley Berryhill":8419,
    "Mike Harley":8421,
    "Brittain Brown":8423,
    "Kevin Marks":8424,
    "Zander Horvath":8428,
    "Chase Garbers":8431,
    "Cade Brewer":8433,
    "Kwamie Lassiter":8435,
    "Neil Pau'u":8436,
    "Justin Hall":8441,
    "Jarrett Guarantano":8442,
    "Montrell Washington":8475,
    "Ko Kieft":8484,
    "Andrew Ogletree":8489,
    "Drew Ogletree":8489,
    "John FitzPatrick":8500,
    "Nick Muse":8523,
    "Dareke Young":8527,
    "Seth Green":8539,
    "Drew Estrada":8543,
    "Josh Babicz":8559,
    "John Lovett":8568,
    "Derek Wright":8570,
    "Ra'Shaun Henry":8571,
    "Erik Krommenhoek":8575,
    "Trevon Bradford":8581,
    "Stone Smartt":8583,
    "Kyric McGowan":8595,
    "Danny Davis":8602,
    "Jontre Kirklin":8628,
    "JaVonta Payton":8632,
    "Chris Pierce":8634,
    "Leroy Watson":8660,
    "Jared Bernhardt":8663,
    "Armani Rogers":8665,
    "John Parker Romo":8670,
    "Rashid Shaheed":8676,
    "Kevin Shaa":8697,
    "Jake Tonges":8698,
    "Kehinde Oginni Hassan":8706,
    "Tayon Fleet-Davis":8707,
    "De'Montre Tuggle":8721,
    "Shemar Bridges":8731,
    "Raleigh Webb":8732,
    "Lance McCutcheon":8745,
    "Roger Carter":8747,
    "Tyreik McAllister":8749,
    "Dylan Parham":8751,
    "Brandon Johnson":8756,
    "Rodney Williams":8757,
    "Andre Miller":8760,
    "Justin Rigg":8778,
    "Kendric Pryor":8783,
    "Zaire Mitchell-Paden":8799,
    "Malik Davis":8800,
    "Dennis Houston":8801,
    "Aaron Shampklin":8809,
    "Troy Hairston":8820,
    "Samson Nacua":8824,
    "Ethan Fernea":8831,
    "Cole Fotheringham":8840,
    "Tanner Conner":8849,
    "Irvin Charles":8861,
    "Kaylon Geiger":8863,
    "Kaylon Geiger Sr.":8863,
    "Kevin Kassis":8876,
    "Willie Johnson":8881,
    "JJ Howland":8884,
    "Tucker Fisk":8885,
    "Keric Wheatfall":8892,
    "KaVontae Turpin":8917,
    "Maurice Alexander":8921,
    "Thomas Odukoya":8924,
    "Daylen Baldwin":8928,
    "Josh Ali":8931,
    "Lucas Havrisik":8932,
    "Nathan Rourke":8938,
    "Evan Hull":9220,
    "Jahmyr Gibbs":9221,
    "Zach Evans":9222,
    "Chase Brown":9224,
    "Tank Bigsby":9225,
    "De'Von Achane":9226,
    "Israel Abanikanda":9227,
    "Bryce Young":9228,
    "Anthony Richardson":9229,
    "Tanner McKee":9230,
    "Jaren Hall":9231,
    "Darnell Washington":9479,
    "Brenton Strange":9480,
    "Luke Musgrave":9481,
    "Michael Mayer":9482,
    "Zack Kuntz":9483,
    "Tucker Kraft":9484,
    "Dontayvion Wicks":9486,
    "Parker Washington":9487,
    "Jaxon Smith-Njigba":9488,
    "Justin Shorter":9489,
    "Tyler Scott":9490,
    "Trey Palmer":9492,
    "Puka Nacua":9493,
    "Marvin Mims":9494,
    "Marvin Mims Jr.":9494,
    "Rakim Jarrett":9495,
    "Jalin Hyatt":9497,
    "Bryce Ford-Wheaton":9499,
    "Josh Downs":9500,
    "Demario Douglas":9501,
    "DeMario Douglas":9501,
    "Tank Dell":9502,
    "Kayshon Boutte":9504,
    "Deuce Vaughn":9505,
    "Sean Tucker":9506,
    "Tyjae Spears":9508,
    "Bijan Robinson":9509,
    "Lew Nichols":9510,
    "Keaton Mitchell":9511,
    "DeWayne McBride":9512,
    "Zach Charbonnet":9753,
    "Quentin Johnston":9754,
    "Jordan Addison":9756,
    "Kendre Miller":9757,
    "C.J. Stroud":9758,
    "Zay Flowers":9997,
    "Hendon Hooker":9998,
    "Will Levis":9999,
    "Cameron Latu":10210,
    "Josh Whyle":10212,
    "Tre Tucker":10213,
    "Davis Allen":10214,
    "Jake Haener":10215,
    "Kenny McIntosh":10216,
    "Clayton Tune":10217,
    "Xavier Hutchinson":10218,
    "Chris Rodriguez":10219,
    "Chris Rodriguez Jr.":10219,
    "Will Mallory":10220,
    "Ronnie Bell":10221,
    "Jayden Reed":10222,
    "Eric Gray":10223,
    "Brayden Willis":10224,
    "Jonathan Mingo":10225,
    "Andrei Iosivas":10226,
    "Payne Durham":10227,
    "Charlie Jones":10228,
    "Rashee Rice":10229,
    "Elijah Higgins":10231,
    "Michael Wilson":10232,
    "Max Duggan":10233,
    "Derius Davis":10234,
    "Roschon Johnson":10235,
    "Dalton Kincaid":10236,
    "Cedric Tillman":10444,
    "Mohamed Ibrahim":10651,
    "Stetson Bennett":10857,
    "Sam LaPorta":10859,
    "Malik Cunningham":10860,
    "Xazavian Valladay":10861,
    "Dorian Thompson-Robinson":10862,
    "A.T. Perry":10863,
    "Aidan O'Connell":10866,
    "Jake Bobo":10867,
    "Matt Landers":10869,
    "Deneric Prince":10870,
    "Luke Schoonmaker":10871,
    "Jake Moody":10937,
    "Jake Moody":10937,
    "Chad Ryland":10955,
    "Chad Ryland":10955,
    "Sean Clifford":10983,
    "Anders Carlson":11008,
    "Anders Carlson":11008,
    "Grant DuBose":11024,
    "Jalen Brooks":11034,
    "Colton Dowell":11046,
    "Antoine Green":11053,
    "Blake Grupe":11058,
    "Blake Grupe":11058,
    "Robert Burns":11060,
    "Mitchell Tinsley":11068,
    "Kazmeir Allen":11070,
    "Thayer Thomas":11073,
    "Cephus Johnson":11081,
    "Ben Sims":11082,
    "Kearis Jackson":11099,
    "SaRodorick Thompson":11104,
    "Shaquan Davis":11105,
    "Joel Wilson":11113,
    "Elijah Dotson":11114,
    "Terrell Bynum":11115,
    "Elijah Cooks":11139,
    "Leonard Taylor":11140,
    "Tanner Brown":11145,
    "Brycen Tremayne":11157,
    "Xavier Smith":11168,
    "Jack Colletto":11174,
    "Zay Malone":11189,
    "Emari Demercado":11199,
    "Blake Whiteheart":11201,
    "Henry Pearson":11209,
    "Malik Heath":11210,
    "Holton Ahlers":11216,
    "Isaiah Winstead":11232,
    "Jacob Saylors":11237,
    "Tyson Bagent":11256,
    "Shedrick Jackson":11257,
    "Thyrick Pitts":11266,
    "Hassan Hall":11270,
    "Joseph Ngata":11276,
    "Brady Russell":11280,
    "Tommy DeVito":11292,
    "Ryan Jones":11298,
    "E.J. Jenkins":11304,
    "Xavier Gipson":11306,
    "Jason Brownlee":11311,
    "Chase Cota":11347,
    "Chris Brooks":11370,
    "Christopher Brooks":11370,
    "Julian Hill":11371,
    "Tyrell Shavers":11377,
    "Jordan Mims":11378,
    "Travis Vokolek":11381,
    "Owen Wright":11384,
    "Sean Ryan":11387,
    "Tanner Taula":11415,
    "Ryan Miller":11421,
    "Nate Adkins":11433,
    "Emanuel Wilson":11435,
    "Jaleel McLaughlin":11439,
    "Jesse Matthews":11452,
    "Tre'Shaun Harrison":11456,
    "John Samuel Shenker":11467,
    "Dylan Drummond":11474,
    "Ellis Merriweather":11483,
    "Bryan Thompson":11495,
    "David Durden":11505,
    "Jalen Cropper":11506,
    "Princeton Fant":11508,
    "Hunter Luepke":11510,
    "John Stephens":11511,
    "John Stephens Jr.":11511,
    "Lucky Jackson":11520,
    "Brandon Aubrey":11533,
    "Brandon Aubrey":11533,
    "Jake Bates":11539,
    "Devin Leary":11556,
    "Joe Milton III":11557,
    "Michael Penix Jr.":11559,
    "Caleb Williams":11560,
    "Michael Pratt":11561,
    "Spencer Rattler":11562,
    "Bo Nix":11563,
    "Drake Maye":11564,
    "J.J. McCarthy":11565,
    "Jayden Daniels":11566,
    "Jordan Travis":11567,
    "Blake Watson":11568,
    "Rasheen Ali":11570,
    "Isaiah Davis":11571,
    "Frank Gore Jr.":11573,
    "Dylan Laube":11574,
    "Ray Davis":11575,
    "Braelon Allen":11576,
    "Will Shipley":11577,
    "Audric Estime":11579,
    "MarShawn Lloyd":11581,
    "Carson Steele":11582,
    "Jonathon Brooks":11583,
    "Bucky Irving":11584,
    "Blake Corum":11586,
    "Jawhar Jordan":11588,
    "Trey Benson":11589,
    "Jase McClellan":11590,
    "Erick All":11592,
    "Erick All Jr.":11592,
    "Brevyn Spann-Ford":11593,
    "Jared Wiley":11595,
    "Ben Sinnott":11596,
    "Theo Johnson":11597,
    "Tanner McLachlan":11598,
    "Cade Stover":11599,
    "Ja'Tavion Sanders":11600,
    "AJ Barner":11603,
    "Brock Bowers":11604,
    "Jaheim Bell":11605,
    "Dallin Holker":11606,
    "Isaiah Williams":11608,
    "Malik Washington":11610,
    "Ainias Smith":11615,
    "Jacob Cowing":11616,
    "Malachi Corley":11617,
    "Jalen McMillan":11618,
    "Ja'Lynn Polk":11619,
    "Rome Odunze":11620,
    "Brenden Rice":11621,
    "Jordan Whittington":11623,
    "Xavier Worthy":11624,
    "Adonai Mitchell":11625,
    "Xavier Legette":11626,
    "Troy Franklin":11627,
    "Marvin Harrison":11628,
    "Marvin Harrison Jr.":11628,
    "Devontez Walker":11629,
    "Roman Wilson":11630,
    "Brian Thomas":11631,
    "Brian Thomas Jr.":11631,
    "Malik Nabers":11632,
    "Jamari Thrash":11633,
    "Ladd McConkey":11635,
    "Johnny Wilson":11636,
    "Keon Coleman":11637,
    "Ricky Pearsall":11638,
    "Jermaine Burton":11640,
    "Jaylen Wright":11643,
    "Javon Baker":11645,
    "Jalen Coker":11646,
    "Kimani Vidal":11647,
    "Luke McCaffrey":11650,
    "Isaac Guerendo":11651,
    "Louis Rees-Zammit":11652,
    "Charlie Smyth":11653,
    "Dante Miller":11654,
    "Tyrone Tracy Jr.":11655,
    "Tip Reiman":11716,
    "Sione Vaki":11729,
    "Bub Means":11748,
    "Anthony Gould":11762,
    "Keilan Robinson":11773,
    "Ryan Flournoy":11783,
    "Cam Little":11786,
    "Joshua Karty":11789,
    "Will Reichard":11792,
    "Tejhaun Palmer":11802,
    "Casey Washington":11806,
    "Jha'Quan Jackson":11808,
    "Cornelius Johnson":11815,
    "Devin Culp":11820,
    "Tahj Washington":11821,
    "Devaughn Vele":11834,
    "Mason Tipton":11895,
    "Xavier Weaver":11921,
    "Colson Yankoff":11942,
    "Michael Wiley":11943,
    "Brayden Narveson":11949,
    "Chris Collier":11963,
    "Christopher Collier":11963,
    "D.J. Williams":11989,
    "Spencer Shrader":12185,
    "David Martin-Robinson":12357,
    "Brenden Bates":12374,
    "Jude McAtamney":12385,
    "Terrell Jennings":12412,
    "Alex Hale":12438,
    "Arizona Cardinals":"ARI",
    "Atlanta Falcons":"ATL",
    "Baltimore Ravens":"BAL",
    "Buffalo Bills":"BUF",
    "Carolina Panthers":"CAR",
    "Chicago Bears":"CHI",
    "Cincinnati Bengals":"CIN",
    "Cleveland Browns":"CLE",
    "Dallas Cowboys":"DAL",
    "Denver Broncos":"DEN",
    "Detroit Lions":"DET",
    "Green Bay Packers":"GB",
    "Houston Texans":"HOU",
    "Indianapolis Colts":"IND",
    "Jacksonville Jaguars":"JAX",
    "Kansas City Chiefs":"KC",
    "Los Angeles Chargers":"LAC",
    "Los Angeles Rams":"LAR",
    "Las Vegas Raiders":"LV",
    "Miami Dolphins":"MIA",
    "Minnesota Vikings":"MIN",
    "New England Patriots":"NE",
    "New Orleans Saints":"NO",
    "New York Giants":"NYG",
    "New York Jets":"NYJ",
    "Philadelphia Eagles":"PHI",
    "Pittsburgh Steelers":"PIT",
    "Seattle Seahawks":"SEA",
    "San Francisco 49ers":"SF",
    "Tampa Bay Buccaneers":"TB",
    "Tennessee Titans":"TEN",
    "Washington Commanders":"WAS"
  };
  id = names[name];

  // Additional searching if not found with direct string matching
  if (parseInt(id) == "NaN") {
    try {
      name = name.toLowerCase().replace(/ /g, "-").replace(/'/g, "").replace(/\./g, "");
    }
    catch (err) {
      Logger.log(err.stack + '\r\n\r\n'+name);
    }
    try {
      names = Object.fromEntries(
        Object.entries(names).map(([key, value]) => [key.toLowerCase().replace(/ /g, "-").replace(/'/g, "").replace(/\./g, ""), value])
      );
      id = names[name];
    }
    catch (err) {
      id = null;
    }
    // Final check, dropping the "jr" from the end of the string
    if (id == undefined || id == null) {
      try {
        names = Object.fromEntries(
          Object.entries(names).map(([key, value]) => [key.replace(/(\-jr)/g, ""),value])
        );
        id = names[name.replace(/(\-jr)/g, "-")];
      }
      catch (err) {
        id = null;
      }
    }    
  }



  if (name == 'object') {
    return names;
  } else {
    return id;
  }
}
/*
ADDITIONAL ENDPOINTS
https://api.sleeper.com/players/nfl
https://api.sleeper.com/stats/nfl/2024?season_type=regular&position=TEAM&order_by=
https://api.sleeper.com/stats/nfl/2024?season_type=regular&position=DEF&order_by=fan_pts_allow
https://api.sleeper.com/stats/nfl/2024?season_type=regular&position[]=TEAM&order_by=pts_half
https://api.sleeper.com/schedule/nfl/regular/2024
*/


// 2024 - Created by Ben Powers
// ben.powers.creative@gmail.com
