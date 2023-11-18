// WEEKLY FF GLOBALS - Updated 11.17.2023

// PLACEHOLDER LEAGUES For various formats, returns HALF PPR by default (recreated for 2023 season, empty leagues with generic scoring)
function dummyLeagueSleeper(format) {
  const placholders = {
    'HALF':'900884242307944448', // 2022 league
    'PPR':'900882471275810816', // 2022 league
    'STANDARD':'900882917667217408' // 2022 league
  }
  format == null ? format = 'HALF' : null;
  return placholders[format];
}

function dummyLeagueESPN(format) {
  const placeholders = {
    'HALF':'1152218',
    'PPR':'97843'
  }
  format == null ? format = 'HALF' : null;
  return placeholders(format);
}

// LEAGUE SCORING - Calculable values for different scoring settings
function leagueScoring(leagueName){
  var scoring = {
    'NNJ': {
      'passing_attempts':0,
      'passing_completions':0,
      'passing_yards':0.05,
      'passing_touchdowns':4,
      'interceptions_thrown':-2,
      'receiving_yards':0.1,
      'receiving_yards_per_reception':1,
      'receiving_touchdowns':6,
      'rushing_attempts':0,
      'rushing_yards_per_attempt':0,
      'rushing_yards':0.1,
      'rushing_touchdowns':6,
      'fumbles_lost':-2}
  };
  return scoring[leagueName];
}

//------------------------------------------------------------------------
// LEAGUE INFO - Pulls information regarding a league, including draft information of the most recent draft
// Provide league ID (or object) and also give single value or array of the following to return an array of the information desired: 'name','teams','divisions','starters','starters_indexed','roster','roster_indexed','scoring','managers','usernames','usernames_by_manager','usernames_by_roster','season','scoring_type','starter_size','bench_size','draft','draft_picks','draft_picks_by_roster','draft_picks_by_user','draft_picks_array','draft_keepers','draft_keepers_by_roster','draft_keepers_by_user','draft_keepers_array','max_keepers','playoff_start','playoff_teams'
function leagueInfo(league,info) {
  if(typeof league != 'string') {
      return ('Enter league id as a string, then declare fetch request as array as second variable');
  } else {
    if (typeof info != 'array' && typeof info != 'object') {
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
          let user = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/user/' + key))['username'];
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
            starters[c] == starters[c+1] ? index++ : index = 1;            
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
            roster[c] == roster[c+1] ? index++ : index = 1;
          }
          results[info[a]] = indexed;
        } else {
          results[info[a]] = roster;
        }
      } else if (info[a] == 'divisions') {
        let divisions = {};
        try {
          let meta = json['metadata'];
          for (let key in meta) {
            key.match(/division\_[0-9]{1,3}/) ? divisions[parseInt(key.replace(/division\_/g, ''))] = meta[key] : null
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
          managerIds.push(key)
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
            let pick_arr = [];
            for (let c = 0; c < picks.length; c++) {
              pick_arr.push([picks[c].round,picks[c].pick_no,picks[c].player_id,picks[c].roster_id,picks[c].draft_slot,picks[c].is_keeper ? 1 : 0]);
            }
            results[info[a]] = pick_arr;
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
              rosters[picks[c].roster_id] == undefined ? rosters[picks[c].roster_id] = [] : null
              if (info[a] == 'draft_picks_by_roster' || picks[c].is_keeper == true) {
                rosters[picks[c].roster_id].push(picks[c].metadata.player_id);
              }
            }
            results[info[a]] = rosters;             
          } else if (info[a] == 'draft_picks_by_user' || info[a] == 'draft_keepers_by_user') {
            let rosters = {};
            for (let c = 0; c < picks.length; c++) {
              if (info[a] == 'draft_picks_by_roster' || picks[c].is_keeper == true) {
                rosters[picks[c].picked_by] == undefined ? rosters[picks[c].picked_by] = [] : null
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

//------------------------------------------------------------------------
// LEAGUE MEMBERS - Pulls draft information to give number of teams
function leagueMembers(league){
  if(typeof league != 'string' && typeof league != 'object') {
    Logger.log('Enter league id as a string or provide draft object');
  } else {
    let recent = {'start_time':0};
    if(typeof league === 'string') {
      let json = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/league/' + league + '/drafts'));
      if (json.length > 1) {
        for (let a = 0; a < json.length; a++) {
          json[a]['start_time'] > recent['start_time'] ? recent = json[a] : null;
        }
      } else {
      recent = json[0];
      }
    } else {
      recent = league;
    }
    Logger.log(recent['settings']['teams'])
    return recent['settings']['teams'];
  }
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
// FETCH CURRENT YEAR OR WEEK
function current(query) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let index, values;
  try {
    query = query.toUpperCase();
  }
  catch (err) {
    Logger.log('Invalid or blank input to function \'current\'');
  }
  if (query == 'WEEK'){
    index = 1;
  } else if (query == 'WEEKS') {
    index = 2;
  } else {
    query = 'YEAR';
    index = 0;
  }
  try {
    let value = ss.getRangeByName(query).getValue();
    if ( value == null || value == undefined ) {
      values = yearWeekFetch();
      value = ss.getRangeByName(query).getValue();
      return values[index];
    } else {
      return value;
    }
  }
  catch (err) {
    values = yearWeekFetch();
    return values[index];
  }
}

//------------------------------------------------------------------------
// ESPN BYE WEEKS - Fetches the ESPN-available API data on bye weeks
function nflByeWeeksESPN() {
  nfl = JSON.parse(UrlFetchApp.fetch('http://fantasy.espn.com/apis/v3/games/ffl/seasons/'+seasonInfo('year')+'?view=proTeamSchedules').getContentText())['settings']['proTeams'];
  var teams = nfl.map(x => x['abbrev']);
  var byes = nfl.map(x => x['byeWeek']);
  var obj = {};
  for(var a = 0; a < teams.length; a++) {
    if (teams[a] == "Wsh"){
      obj["WAS"] = byes[a];
    } else if ( teams[a] == "Jac") {
      obj["JAX"] = byes[a]
    } else {
      obj[teams[a].toUpperCase()] = byes[a];
    }
  }
  //Logger.log(obj) 
  return obj; 
}

function testByes() {
  Logger.log(JSON.stringify(fetchTeamsESPN()));
}

//------------------------------------------------------------------------
// ESPN TEAMS - Fetches the ESPN-available API data on NFL teams
function fetchTeamsESPN() {
  const year = current('YEAR'); // First array value is year
  const obj = JSON.parse(UrlFetchApp.fetch('http://fantasy.espn.com/apis/v3/games/ffl/seasons/' + year + '?view=proTeamSchedules').getContentText());
  let objTeams = obj['settings']['proTeams'];
  return objTeams;
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

  let weeks = current('WEEKS');
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
  var maxRows = sheet.getMaxRows(); 
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
  var maxColumns = sheet.getMaxColumns(); 
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
  var ids = {
    1:"QB",
    2:"RB",
    9:"RB", // fullback
    3:"WR",
    4:"TE",
    16:"DEF"
  }
  return ids[id];
}

//------------------------------------------------------------------------
// ESPN PRO TEAM ID - Looks up a pro team abbreviation based on ESPN team ID number
function espnProTeamId(id){
  var ids ={
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
  var espnDefId = { "ARI":-16022,"ATL":-16001,"BAL":-16033,"BUF":-16002,"CAR":-16029,"CHI":-16003,"CIN":-16004,
    "CLE":-16005,"DAL":-16006,"DEN":-16007,"DET":-16008,"GB":-16009,"HOU":-16034,"IND":-16011,
    "JAX":-16030,"KC":-16012,"LV":-16013,"LAC":-16024,"LAR":-16014,"MIA":-16015,"MIN":-16016,
    "NE":-16017,"NO":-16018,"NYG":-16019,"NYJ":-16020,"PHI":-16021,"PIT":-16023,"SF":-16025,
    "SEA":-16026,"TB":-16027,"TEN":-16010,"WAS":-16028}
  return espnDefId[id];
}

//------------------------------------------------------------------------
// ESPN ID - Provides ESPN scripts with ESPN ID to match with Sleeper ID
function espnId(id) {
  var espnToSleeperId = {'ARI':'-16022','ATL':'-16001','BAL':'-16033','BUF':'-16002','CAR':'-16029','CHI':'-16003','CIN':'-16004','CLE':'-16005','DAL':'-16006','DEN':'-16007','DET':'-16008','GB':'-16009','HOU':'-16034','IND':'-16011','JAX':'-16030','KC':'-16012','LAC':'-16024','LAR':'-16014','LV':'-16013','MIA':'-16015','MIN':'-16016','NE':'-16017','NO':'-16018','NYG':'-16019','NYJ':'-16020','PHI':'-16021','PIT':'-16023','SEA':'-16026','SF':'-16025','TB':'-16027','TEN':'-16010','WAS':'-16028',10210:4372026,10212:4360086,10213:4428718,10214:4426553,10216:4427391,10220:4362523,10222:4362249,10223:4570561,10225:4426485,10227:4372505,10228:4257188,10229:4428331,10231:4426844,10232:4360761,10234:4362477,10235:4426386,10236:4385690,1034:15478,10444:4369863,1049:14876,1067:15072,10857:4259553,10858:5125287,10859:4430027,10871:4372096,10937:4372066,10955:4363538,10983:4259592,11008:4242519,11024:4879650,11077:4379410,11146:4361665,11201:4362018,11224:4239691,11231:4360199,11380:4363098,11447:4243475,1166:14880,1234:14881,1264:15683,1266:14993,1338:15948,1339:15835,1346:15839,1348:15965,1352:15880,1373:15864,1379:16002,1426:15795,1433:16339,1466:15847,1476:15920,1479:15818,1535:15807,1689:16460,17:11122,1837:16760,1945:17372,1992:16799,2020:17427,2028:16757,2073:17315,2078:16733,2133:16800,2161:16782,2197:16731,2216:16737,2251:16813,2306:2969939,2307:2576980,2309:2976499,2319:2576623,2320:2576434,2325:2971618,2331:2972460,2334:2579604,2359:2576336,2374:2577327,2381:2578533,2390:2582410,2399:2577134,2422:2514206,2449:2976212,2460:2574576,2463:2979590,2471:2515270,2505:2576925,2549:2511109,2673:2577667,2711:2565969,2747:2473037,2749:2576414,2750:2580216,3048:2531358,312:11387,3155:3051889,3163:3046779,3164:3051392,3198:3043078,3199:2976316,3200:2976592,3202:3043275,3214:3046439,3225:3045144,3242:2979843,3257:2578570,3269:2576581,3271:2573401,3286:3043116,3294:2577417,3312:2980077,3321:3116406,3342:2577641,3343:2979501,3357:2574511,3362:2574630,3423:2574808,345:12477,3451:2971573,3634:2973405,3664:2572861,3678:2985659,3832:4012556,3852:2978308,391:12731,3969:3115364,3976:3039707,4017:3122840,4018:3116385,4029:3116593,4033:3123076,4034:3117251,4035:3054850,4036:3042778,4037:3116165,4039:2977187,4040:3120348,4046:3139477,4054:2998565,4055:3043080,4066:3051876,4068:3045138,4080:3059722,4082:3121427,4089:3918639,4098:3059915,4111:3125116,4127:2979520,4137:3045147,4144:3054212,4147:3116389,4149:2980453,4171:3115306,4177:2991662,4179:3044720,4183:2972236,4189:2975863,4195:3050478,4197:3128724,4198:3061612,4199:3042519,421:12483,4217:3040151,4218:3040569,4226:4212884,4227:3055899,4229:2972331,4233:3043234,4234:3121409,4274:4212909,4314:3052096,4319:2978109,4335:3051308,4351:3134353,4353:2975417,4381:2468609,4435:3049698,4454:3045523,4455:3049916,4464:3059989,4491:3046399,4574:2972515,4602:2975674,4651:3045260,4663:3068267,4666:3049899,4718:2983509,4741:4212989,4854:3052056,4866:3929630,4881:3916387,4892:3052587,49:9354,4943:3912547,4950:3895856,4951:3115394,4958:16486,4973:3924365,4981:3925357,4983:3915416,4984:3918298,4985:3139925,4988:3128720,4993:3116164,4995:4045305,5000:3119195,5001:3117256,5008:3052897,5010:3127292,5012:3116365,5022:3121023,5024:3122449,5026:3128451,503:12460,5032:3128452,5038:4036348,5045:3128429,5052:3912550,5076:3915381,5086:3051738,5089:3051381,5095:3051909,5096:3728262,5110:3115378,5111:4035019,5113:4036335,5119:3124679,5121:3123075,5122:3051439,5127:3115293,5133:3915486,5134:3046401,5137:3122899,5154:3122168,5171:3049290,5185:3128390,5189:4034949,5209:3139033,5230:3123052,5235:3047536,5248:3051926,5272:3975763,5284:3122976,5285:3120303,5323:3932442,533:13199,5347:3916430,5374:3118892,5409:3050481,5536:3126246,5565:3116158,5695:3115255,5773:3047876,5781:3115928,5823:3127313,5844:4036133,5846:4047650,5848:4241372,5849:3917315,5850:4047365,5854:3924327,5857:4036131,5859:4047646,5870:3917792,5872:3126486,5880:3121410,5890:3925347,5892:4035538,59:10636,5902:3917546,5906:3930086,5916:4039359,5917:4035004,5927:3121422,5937:3932905,5947:3916433,5955:3135321,5965:3932423,5967:3916148,5970:4037235,5973:3921690,5980:3886818,5985:3843945,5987:4048244,5995:4038441,6001:3127310,6011:4038524,6012:4037457,6018:3929924,6074:3912092,6083:4249087,6109:3917668,6126:4040980,6130:4040761,6136:3892775,6144:4035222,6149:3916945,6151:4045163,6181:4039253,6185:3120590,6202:3115349,6208:3048898,6233:3121378,6234:4411193,6271:3917914,6323:3125107,6395:4422214,6402:3917960,6421:3932430,6427:4061956,650:10621,6528:3124084,6588:3126997,6598:3931391,6650:3150744,6659:4421446,6662:3144991,6665:4408854,6699:4424106,6768:4241479,6770:3915511,6783:4241463,6786:4241389,6790:4259545,6794:4262921,6797:4038941,6798:4241802,6801:4239993,6803:4360438,6804:4036378,6805:4240380,6806:4241985,6813:4242335,6814:4243160,6819:4035687,6820:4242214,6824:4258195,6826:4258595,6828:4239934,6843:4035115,6845:4035676,6847:4039050,6849:4035403,6850:4040774,6853:3930066,6865:4242557,6869:3911853,6870:4038818,6878:4241941,6885:3917612,6886:4046692,6895:4035793,6904:4040715,6918:4243315,6920:4242540,6926:3918003,6927:4050373,6931:4240631,6938:4240021,6943:4243537,6945:4360294,6951:4242873,6955:4052042,6956:4046522,6957:3916204,6963:4039358,6964:4036275,6970:4035426,6973:4039607,6984:4046676,6996:3928925,7002:3929645,7042:3917232,7045:3910544,7049:3886598,7050:3914151,7066:3916566,7075:4035020,7083:4035671,7090:4040655,7098:3895827,7106:3917849,7107:4040790,7131:3914240,7204:4039505,7210:3700815,7233:3886809,7404:3930298,7427:3916587,7436:4057082,7496:3929785,7523:4360310,7525:4241478,7526:4372016,7527:4241464,7528:4241457,7529:4245645,7530:4047836,7535:4239944,7536:4244049,7537:4362452,7538:4361259,7540:4239992,7543:4239996,7547:4374302,7551:4240455,7553:4360248,7554:4240023,7561:4241555,7562:4360797,7564:4362628,7565:4362630,7567:4371733,7568:4362504,7569:4258173,7571:4360939,7574:4241205,7585:4242546,7587:4361577,7588:4361579,7591:4362887,7594:4241416,7596:4372414,7599:4374033,7600:4361411,7601:4372485,7602:4039160,7603:4259499,7605:4034946,7606:4240600,7607:4240657,7608:4035886,7610:4383351,7611:4569173,7612:4043016,7670:4242433,7694:4372780,7716:4048228,7720:4035537,7741:4244732,7751:4373642,7757:4035656,7793:4242231,7794:4046530,7812:4360739,7828:4240472,7839:4360234,7842:4040612,7867:4239768,7891:4242392,7922:4243371,7943:4746079,7946:4034862,7956:4031033,8013:4245131,8025:3929914,8038:3957439,8041:4608362,8058:4820592,8110:4242355,8111:4243331,8112:4426502,8114:4362186,8116:4249836,8117:4249417,8118:4570409,8119:4361409,8121:4361432,8122:4427728,8123:4372071,8125:4243389,8126:4569587,8127:4241263,8129:4360238,8130:4361307,8131:4361050,8132:4373626,8134:4373678,8135:4567156,8136:4697815,8137:4426354,8138:4379399,8139:4361777,8140:4360306,8142:4360078,8143:4372019,8144:4361370,8145:4361372,8146:4569618,8147:4567096,8148:4426388,8150:4430737,8151:4567048,8153:4426891,8154:4241474,8155:4427366,8157:4250360,8159:4239086,8160:4240703,8162:4426875,8167:4248528,8168:4430191,8170:4361988,8171:4367175,8172:4367209,8174:4570674,8176:4689546,8177:4241374,8179:4567246,8180:4382466,8181:4241961,8182:4035526,8183:4361741,8188:4362921,8195:4243003,8197:4258248,8205:4361529,8208:4362748,8210:4360635,8211:4426475,8214:4361438,8219:4241410,8221:4362087,8223:4035693,8225:4361516,8227:4374045,8228:4569987,8230:4242431,8235:4027873,8253:4374187,8254:4367567,8255:4259308,8258:4428963,8259:4362081,827:14163,829:14012,8408:4360569,8414:3926231,8428:4260406,8435:4035912,8475:4248822,8484:4034779,8500:4379401,8523:4249624,8527:4401805,8536:4036146,8583:4250764,862:13987,8676:4032473,8745:4247812,8800:4240603,8820:4274040,8885:4242558,8917:3676833,9220:4569609,9221:4429795,9222:4685035,9224:4362238,9225:4429013,9226:4429160,9227:4429202,9228:4685720,9229:4429084,928:14053,9479:4430802,9480:4430539,9481:4428085,9482:4429086,9483:4361417,9484:4572680,9486:4428850,9487:4432620,9488:4430878,9489:4361426,9490:4565908,9493:4426515,9494:4686472,9497:4692590,9500:4688813,9501:4427095,9502:4366031,9504:4429022,9505:4431453,9506:4430871,9508:4428557,9509:4430807,9510:4428119,9512:4430388,956:13981,96:8439,9753:4426385,9754:4429025,9756:4429205,9757:4599739,9758:4432577,9997:4429615,9998:4240858,9999:4361418}

  if (id == 'obj') {
    return espnToSleeperId;
  } else {
    var res = espnToSleeperId[id];
    if (res == null){
      res = getKeyByValue(espnToSleeperId,id);
    }
    return res;
  }
}

//------------------------------------------------------------------------
// ESPN ROOKIE ID - Provides ESPN scripts with ESPN ID to match with Sleeper ID
function espnRookieId(id){
  var espnRookieId = { 7561:4241555,7098:3895827,7523:4360310,7525:4241478,7526:4372016,7527:4241464,7528:4241457,
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
    var res = espnRookieId[id];
    if (res == null){
      res = getKeyByValue(espnRookieId,id);
    }
    return res;
  }
}

//------------------------------------------------------------------------
// FANTASY PROS ID - Provides ESPN scripts with ESPN ID to match with Sleeper ID
function fantasyProsId(id) {
  var fantasyProsId = {'ARI':8000,'ATL':8010,'BAL':8020,'BUF':8030,'CAR':8040,'CHI':8050,'CIN':8060,'CLE':8070,'DAL':8080,'DEN':8090,'DET':8100,'GB':8110,'HOU':8120,'IND':8130,'JAX':8140,'KC':8150,'LAC':8250,'LAR':8280,'LV':8220,'MIA':8160,'MIN':8170,'NE':8180,'NO':8190,'NYG':8200,'NYJ':8210,'PHI':8230,'PIT':8240,'SEA':8260,'SF':8270,'TB':8290,'TEN':8300,'WAS':8310,10210:24331,10213:25337,10216:25329,10218:25332,10219:22986,10222:23020,10223:23075,10225:23030,10226:25335,10228:25336,10229:23113,10231:23119,10232:25333,10235:25322,10236:25247,1034:11410,10444:25287,1049:11174,1067:11215,10859:22978,10863:24353,10870:25770,10871:25267,10937:24009,10955:25354,11008:25465,11145:25616,1166:11177,1234:11180,1264:11465,1266:11345,1339:11689,1346:11599,1348:11818,1352:11610,1373:11687,1379:11798,1426:11606,1433:13274,1466:11594,1476:11821,1479:11616,1535:11613,1689:13429,17:9443,1825:12128,1837:12208,1945:13029,1992:12126,2020:13731,2028:12092,2078:12127,2133:12123,2161:12209,2197:12122,2216:12119,2251:12095,2306:13891,2309:13894,2319:13897,2320:13903,2325:13969,2359:13924,2374:13971,2399:13977,2449:13981,2460:14084,2505:14104,2711:13932,2747:14003,2749:14338,2750:14103,3161:15520,3163:15501,3164:15498,3198:15514,3199:15528,3200:15569,3202:15581,3214:15561,3225:15547,3242:15637,3257:15642,3269:15654,3271:15623,3286:15665,3294:15600,3321:15802,3423:15688,345:9078,3451:15756,3634:16081,3664:16230,3678:16026,391:9549,3969:16378,4017:16398,4018:16420,4029:16374,4033:16399,4034:16393,4035:16421,4036:16385,4037:16406,4039:16433,4040:16427,4046:16413,4054:16579,4055:16380,4066:16411,4068:16377,4080:16431,4082:16434,4089:16459,4098:16425,4111:16407,4137:16447,4144:16460,4147:16423,4149:16424,4171:16439,4177:16489,4195:16540,4197:16604,4198:16666,4199:16673,421:9451,4217:16499,4227:16712,4233:16548,4234:16443,4351:16556,4381:17115,4454:17066,4455:17058,4464:16726,4602:16502,4651:16446,4663:16483,4666:16910,4741:17143,4866:17240,4881:17233,4892:17237,49:9534,4943:17236,4950:17268,4951:17292,4958:12378,4973:17283,4981:17258,4983:17265,4984:17298,4985:17308,4988:17246,4993:17272,5000:17496,5001:17349,5008:17508,5010:18049,5012:17269,5022:17270,5026:17261,503:9232,5032:17415,5038:17259,5045:17253,5052:17243,5086:17528,5089:17447,5095:17420,5110:17606,5113:17262,5119:17533,5121:17289,5122:17612,5131:17300,5133:17598,5137:17303,5154:17888,5185:17301,5189:17575,5209:17813,5230:17693,5248:17687,5272:17647,5284:18026,5323:17307,533:9702,5347:17297,5374:17603,5536:18037,5823:18670,5844:18290,5846:18219,5848:18226,5849:18600,5850:18269,5857:17527,5859:18218,5870:18232,5872:18244,5880:18463,5890:18230,5892:18239,59:9433,5906:18631,5916:18588,5917:18587,5927:18466,5937:18615,5947:18598,5955:18345,5967:18705,5970:18585,5973:18487,5980:17251,5985:18397,5987:18621,5995:18256,6011:18562,6012:18616,6074:18835,6083:18545,6126:18610,6130:18280,6136:18604,6144:18607,6149:18706,6151:18283,6208:18672,6234:18876,6271:18864,6421:18941,6427:18656,650:9491,6528:19028,6598:18726,6650:19058,6659:19074,6665:18831,6694:19111,6768:19198,6770:19196,6783:19201,6786:19202,6790:19210,6794:19236,6797:18635,6798:19219,6801:19211,6803:19252,6804:19246,6805:19267,6806:19245,6813:19217,6814:19221,6819:19278,6820:19325,6824:19298,6826:19229,6828:19358,6843:18246,6845:19263,6847:19270,6850:19389,6853:19483,6865:19372,6869:19423,6878:19366,6885:19351,6886:18627,6895:19396,6904:19275,6918:19449,6920:19375,6927:19715,6931:19521,6938:19268,6943:19398,6945:19624,6951:19361,6955:19631,6984:19482,6989:19505,6996:19627,7002:19562,7021:19647,7042:19760,7045:19445,7049:19590,7050:19456,7066:19708,7083:19297,7090:19810,7131:17635,7496:19747,7523:19780,7525:19222,7526:19790,7527:20156,7528:19302,7529:23293,7538:22679,7543:19231,7547:19799,7551:20097,7553:20164,7561:22813,7562:20126,7564:19788,7565:23242,7567:23310,7568:20162,7569:20130,7571:19794,7587:20113,7588:22739,7591:19781,7593:19425,7594:19792,7596:20114,7600:20163,7601:19796,7602:22841,7603:20127,7605:19800,7606:20119,7607:22728,7608:22763,7610:20082,7611:22726,7612:22785,7670:22845,7694:22795,7716:22833,7720:23249,7741:19368,7757:22843,7794:22797,7828:19539,7839:23297,7891:23341,7922:23370,8110:22718,8111:23181,8112:23163,8116:24173,8117:23770,8118:23108,8119:23101,8121:23794,8122:24901,8123:23798,8125:23739,8126:22985,8129:22947,8130:22936,8131:23781,8132:24172,8134:23748,8135:22905,8136:23891,8137:22963,8138:22958,8139:20095,8140:19798,8142:23791,8143:22921,8144:20111,8145:23742,8146:23072,8147:22895,8148:23677,8150:23059,8151:23021,8153:23143,8154:20094,8155:22982,8157:24027,8159:20080,8160:22722,8161:23499,8162:23045,8167:23886,8168:23905,8170:23174,8171:23896,8172:23153,8174:23117,8179:23027,8183:19797,8188:22913,8197:22971,8205:24333,8210:23982,8211:22992,8214:23727,8219:23829,8221:23162,8223:24214,8225:24238,8228:24209,8230:19471,8235:23883,8255:20100,8258:24549,8259:23901,829:9907,8408:22969,8536:24588,8676:24687,8800:24205,9220:25325,9221:22968,9222:23122,9224:25324,9225:22908,9226:23136,9227:24352,9228:22900,9229:24347,928:9902,947:9867,9479:22967,9480:25345,9481:25282,9482:23056,9483:25347,9484:25298,9486:24354,9487:23106,9488:23070,9489:24083,9490:25442,9492:25331,9493:23180,9494:23080,9497:25251,9500:24706,9502:25361,9504:22989,9505:22984,9506:23679,9508:25323,9509:23133,9512:25265,956:9872,96:9001,9753:23152,9754:23123,9756:23107,9757:24360,9758:23071,9997:22916,9998:24332,9999:22987}

  if (id == 'obj') {
    return fantasyProsId;
  } else {
    var res = fantasyProsId[id];
    if (res == null){
      res = getKeyByValue(fantasyProsId,id);
    }
    return res;
  }
}

function testkey() {
  Logger.log(getKeyByValue(espnRookieId('obj'),4048228));
}
// ------------------------------------------------------------------------
// KEY FINDER - Searches for the key based on the value given
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

//------------------------------------------------------------------------
// NAME FINDER - Searches for alternative ways to spell players names and provides Sleeper ID as result
function nameFinder(name){
  var id = null;
  var names = {
    "Adrian Killins Jr.": 7093,
    "Alex Armah Jr.": 4226,
    "Alex Armah":4226,
    "Cyril Grayson Jr.": 4050,
    "A.J. Dillon": 6828,
    "AJ Dillon": 6828,
    "A.J. Green": 830,
    "AJ Green": 830,
    "Allen Robinson": 1992,
    "Allen Robinson II": 1992,
    "Anthony McFarland": 6878,
    "Anthony McFarland Jr.": 6878,
    "Anthony McFarland Jr": 6878,
    "Benny Snell": 6156,
    "Benny Snell Jr.": 6156,
    "Benny Snell Jr": 6156,
    "C.J. Uzomah": 2460,
    "CJ Uzomah": 2460,
    "CJ Uzomah": 2460,
    "Christopher Herndon": 5009,
    "Chris Herndon": 5009,
    "Chris Herndon IV": 5009,
    "D.J. Chark": 4951,
    "DJ Chark Jr.": 4951,
    "D.J. Chark Jr.": 4951,
    "DJ Chark Jr": 4951,
    "D.J. Moore": 4983,
    "DJ Moore": 4983,
    "Darrell Henderson": 5916,
    "Darrell Henderson Jr.": 5916,
    "Darrell Henderson Jr": 5916,
    "DK Metcalf": 5846,
    "D.K. Metcalf": 5846,
    "Donald Parham": 6074,
    "Donald Parham Jr.": 6074,
    "Donald Parham Jr": 6074,
    "Dwayne Haskins": 5845,
    "Dwayne Haskins Jr.": 5845,
    "Dwayne Haskins Jr": 5845,
    "Duke Johnson Jr.": 2382,
    "Gardner Minshew": 6011,
    "Gardner Minshew II": 6011,
    "Henry Ruggs": 6789,
    "Henry Ruggs III": 6789,
    "Irv Smith": 6126,
    "Irv Smith Jr.": 6126,
    "Irv Smith Jr": 6126,
    "Jesse James":2463,
    "J.J. Arcega-Whiteside": 5863,
    "JJ Arcega-Whiteside": 5863,
    "Jeffery Wilson": 5284,
    "Jeffery Wilson Jr.": 5284,
    "Jeffery Wilson Jr": 5284,
    "Jeff Wilson Jr.": 5284,
    "John Ross": 4038,
    "John Ross III": 4038,
    "Josh Jacobs": 5850,
    "Joshua Jacobs": 5850,
    "Jakeem Grant Sr.": 3342,
    "James Proche II": 6957,
    "JaMycal Hasty": 6996,
    "Jason Moore Jr.": 6247,
    "Joshua Palmer": 7670,
    "K.J. Hill Jr.": 6866,
    "KhaDarel Hodge": 5773,
    "Matthew Slater": 312,
    "Otis Anderson Jr.": 8077,
    "P.J. Walker": 4335,
    "Patrick Taylor Jr.": 6963,
    "K.J. Hamler": 6805,
    "KJ Hamler": 6805,
    "Keelan Cole": 4622,
    "Keelan Cole Sr.": 4622,
    "Larry Rountree": 7574,
    "Larry Rountree III": 7574,
    "Laviska Shenault": 6814,
    "Laviska Shenault Jr.": 6814,
    "Laviska Shenault Jr": 6814,
    "Mark Ingram": 956,
    "Mark Ingram II": 956,
    "Marvin Jones": 1067,
    "Marvin Jones Jr.": 1067,
    "Marvin Jones Jr": 1067,
    "Melvin Gordon": 2320,
    "Melvin Gordon III": 2320,
    "Michael Pittman": 6819,
    "Michael Pittman Jr.": 6819,
    "Michael Pittman Jr": 6819,
    "Mike Williams": 4068,
    "Mitchell Trubisky": 3976,
    "Mitch Trubisky": 3976,
    "Mohamed Sanu": 1071,
    "Mohamed Sanu Sr.": 1071,
    "Mohamed Sanu Sr": 1071,
    "O.J. Howard": 4055,
    "OJ Howard": 4055,
    "Odell Beckham": 2078,
    "Odell Beckham Jr.": 2078,
    "Odell Beckham Jr": 2078,
    "Patrick Mahomes": 4046,
    "Patrick Mahomes II": 4046,
    "Phillip Dorsett": 2334,
    "Phillip Dorsett II": 2334,
    "Ronald Jones": 5052,
    "Ronald Jones II": 5052,
    "Ronald Jones I": 5052,
    "Scott Miller": 6290,
    "Scotty Miller": 6290,
    "Stanley Morgan Jr.": 6069,
    "Steven Sims": 6402,
    "Steven Sims Jr.": 6402,
    "Steven Sims Jr": 6402,
    "Tajae Sharpe": 3297,
    "Tajaé Sharpe": 3297,
    "Terrace Marshall": 7565,
    "Terrace Marshall Jr.": 7565,
    "Terrace Marshall Jr": 7565,
    "Tony Jones": 6984,
    "Tony Jones Jr.": 6984,
    "Tony Jones Jr": 6984,
    "Travis Etienne": 7543,
    "Travis Etienne Jr.": 7543,
    "Travis Etienne Jr": 7543,
    "T.J. Hockenson": 5844,
    "Will Fuller": 3157,
    "Will Fuller V": 3157,
    "William Fuller": 3157,
    "William Fuller V": 3157,
    "Willie Snead": 1911,
    "Willie Snead IV": 1911,
    "Will Snead": 1911,
    "San Francisco 49ers":"SF",
    "Chicago Bears":"CHI",
    "Cincinnati Bengals":"CIN",
    "Buffalo Bills":"BUF",
    "Denver Broncos":"DEN",
    "Cleveland Browns":"CLE",
    "Tampa Bay Buccaneers":"TB",
    "Arizona Cardinals":"ARI",
    "Los Angeles Chargers":"LAC",
    "Kansas City Chiefs":"KC",
    "Indianapolis Colts":"IND",
    "Washington Commanders":"WAS",
    "Dallas Cowboys":"DAL",
    "Miami Dolphins":"MIA",
    "Philadelphia Eagles":"PHI",
    "Atlanta Falcons":"ATL",
    "New York Giants":"NYG",
    "Jacksonville Jaguars":"JAX",
    "New York Jets":"NYJ",
    "Detroit Lions":"DET",
    "Green Bay Packers":"GB",
    "Carolina Panthers":"CAR",
    "New England Patriots":"NE",
    "Las Vegas Raiders":"LV",
    "Los Angeles Rams":"LAR",
    "Baltimore Ravens":"BAL",
    "New Orleans Saints":"NO",
    "Seattle Seahawks":"SEA",
    "Pittsburgh Steelers":"PIT",
    "Houston Texans":"HOU",
    "Tennessee Titans":"TEN",
    "Minnesota Vikings":"MIN",
    "Brandon Allen":3357,
    "Josh Allen":4984,
    "Kyle Allen":5127,
    "Aaron Bailey":4683,
    "Matt Barkley":1338,
    "C.J. Beathard":4127,
    "David Blough":6450,
    "Ian Book":7589,
    "Blake Bortles":1979,
    "Tim Boyle":5257,
    "Tom Brady":167,
    "Teddy Bridgewater":2152,
    "Jacoby Brissett":3257,
    "Anthony Brown":8241,
    "Jake Browning":6111,
    "Shane Buechele":8002,
    "Joe Burrow":6770,
    "Derek Carr":2028,
    "Jack Coan":8201,
    "Matt Corral":8164,
    "Kirk Cousins":1166,
    "Dustin Crum":8212,
    "Andy Dalton":829,
    "Chase Daniel":490,
    "Sam Darnold":4943,
    "Ben DiNucci":7143,
    "Joshua Dobbs":4179,
    "Jeff Driskel":3362,
    "Jacob Eason":6823,
    "Sam Ehlinger":7583,
    "Danny Etling":5120,
    "Justin Fields":7591,
    "Joe Flacco":19,
    "Nick Foles":1029,
    "Feleipe Franks":7531,
    "Blaine Gabbert":862,
    "Chase Garbers":8431,
    "Jimmy Garoppolo":1837,
    "Jared Goff":3163,
    "Will Grier":5903,
    "Ryan Griffin":1550,
    "Jarrett Guarantano":8442,
    "Dwayne Haskins":5845,
    "Taylor Heinicke":2711,
    "Chad Henne":89,
    "Justin Herbert":6797,
    "Skyler Howard":4936,
    "Sam Howell":8162,
    "Brian Hoyer":345,
    "Tyler Huntley":7083,
    "Jalen Hurts":6904,
    "Lamar Jackson":4881,
    "Josh Johnson":260,
    "Daniel Jones":5870,
    "Mac Jones":7527,
    "Case Keenum":1737,
    "Trey Lance":7610,
    "Trevor Lawrence":7523,
    "Drew Lock":5854,
    "Jordan Love":6804,
    "Jake Luton":7084,
    "Patrick Mahomes":4046,
    "Sean Mannion":2394,
    "Marcus Mariota":2307,
    "Baker Mayfield":4892,
    "AJ McCarron":1895,
    "Colt McCoy":533,
    "Trace McSorley":5974,
    "Davis Mills":7585,
    "Gardner Minshew":6011,
    "Kellen Mond":7581,
    "Jalen Morton":7262,
    "Nick Mullens":4464,
    "Kyler Murray":5849,
    "Bryce Perkins":7335,
    "E.J. Perry":8193,
    "Nathan Peterman":4183,
    "Kenny Pickett":8160,
    "Dak Prescott":3294,
    "Brock Purdy":8183,
    "Desmond Ridder":8159,
    "Aaron Rodgers":96,
    "Ben Roethlisberger":138,
    "Josh Rosen":4863,
    "Mason Rudolph":4972,
    "Cooper Rush":4574,
    "Matt Ryan":24,
    "Brett Rypien":6037,
    "Nick Schuessler":4926,
    "Trevor Siemian":2549,
    "Reid Sinnett":7159,
    "Geno Smith":1373,
    "Matthew Stafford":421,
    "Tommy Stevens":7149,
    "Easton Stick":6185,
    "Jarrett Stidham":6136,
    "Chris Streveler":6778,
    "Carson Strong":8158,
    "Nate Sudfeld":3343,
    "Tua Tagovailoa":6768,
    "Ryan Tannehill":1049,
    "Tyrod Taylor":827,
    "Zach Terrell":4924,
    "Skylar Thompson":8206,
    "Clayton Thorson":6147,
    "Kyle Trask":7605,
    "Mitch Trubisky":3976,
    "PJ Walker":4335,
    "Deshaun Watson":4017,
    "Davis Webb":4061,
    "Carson Wentz":3161,
    "Mike White":5089,
    "Malik Willis":8161,
    "Russell Wilson":1234,
    "Zach Wilson":7538,
    "Jameis Winston":2306,
    "John Wolford":5806,
    "Logan Woodside":5128,
    "Bailey Zappe":8157,
    "Ameer Abdullah":2359,
    "Salvon Ahmed":6918,
    "Cam Akers":6938,
    "Tyler Allgeier":8132,
    "Darius Anderson":7038,
    "Ryquell Armstead":6007,
    "Tyler Badie":8208,
    "Saquon Barkley":4866,
    "Kenjon Barner":1546,
    "Nick Bawden":5116,
    "Le'Veon Bell":1408,
    "Eno Benjamin":6951,
    "Giovani Bernard":1386,
    "Raheem Blackshear":8255,
    "Khari Blasingame":6379,
    "Brandon Bolden":1034,
    "Reggie Bonnafon":5162,
    "Mike Boone":5209,
    "Max Borghi":8218,
    "Matt Breida":4455,
    "Gary Brightwell":7529,
    "Kennedy Brooks":8152,
    "Spencer Brown":7867,
    "Leddie Brown":8217,
    "Brittain Brown":8423,
    "Rex Burkhead":1387,
    "Michael Burton":2471,
    "Jason Cabinda":5565,
    "Trenton Cannon":5123,
    "Michael Carter":7607,
    "Tory Carter":7852,
    "Ty Chandler":8230,
    "Julius Chestnut":8254,
    "Nick Chubb":4988,
    "Glen Coffee":4914,
    "Tevin Coleman":2378,
    "James Conner":4137,
    "Snoop Conner":8179,
    "Dalvin Cook":4029,
    "James Cook":8138,
    "Jashaun Corbin":8194,
    "Damarea Crockett":6334,
    "DeeJay Dallas":6931,
    "Mike Davis":2431,
    "Malik Davis":8800,
    "Tyrion Davis-Price":8211,
    "AJ Dillon":6828,
    "Gerrid Doaks":7539,
    "J.K. Dobbins":6806,
    "Rico Dowdle":7021,
    "Jerrion Ealy":8120,
    "Trestan Ebner":8189,
    "Chase Edmonds":5000,
    "Gus Edwards":5248,
    "Clyde Edwards-Helaire":6820,
    "Austin Ekeler":4663,
    "Ezekiel Elliott":3164,
    "Travis Etienne":7543,
    "Darrynton Evans":7064,
    "Chris Evans":7794,
    "Tavien Feaster":7103,
    "Demetric Felton":7609,
    "Demetric Felton Jr.":7609,
    "Tayon Fleet-Davis":8707,
    "Jerome Ford":8143,
    "D'Onta Foreman":4111,
    "Leonard Fournette":3969,
    "Royce Freeman":5046,
    "Jake Funk":7771,
    "Kenneth Gainwell":7567,
    "Myles Gaskin":5980,
    "Antonio Gibson":6945,
    "Tyler Goodson":8207,
    "Melvin Gordon":2320,
    "Derrick Gore":6753,
    "Breece Hall":8155,
    "C.J. Ham":3832,
    "JaQuan Hardy":7863,
    "Damien Harris":5890,
    "Najee Harris":7528,
    "Kevin Harris":8174,
    "Hassan Haskins":8123,
    "JaMycal Hasty":6996,
    "Darrell Henderson":5916,
    "Derrick Henry":3198,
    "Khalil Herbert":7608,
    "Justice Hill":5995,
    "Kylin Hill":7572,
    "Dontrell Hilliard":5536,
    "Nyheim Hines":5347,
    "Elijah Holyfield":5919,
    "Travis Homer":6012,
    "Zander Horvath":8428,
    "Chuba Hubbard":7594,
    "Kareem Hunt":4098,
    "Jason Huntley":7107,
    "Caleb Huntley":7741,
    "Godwin Igwebuike":5220,
    "Alec Ingold":6109,
    "Mark Ingram":956,
    "Keaontay Ingram":8221,
    "Justin Jackson":5131,
    "Deon Jackson":7551,
    "Josh Jacobs":5850,
    "Jermar Jefferson":7599,
    "Duke Johnson":2382,
    "Ty Johnson":6039,
    "Jakob Johnson":6202,
    "D'Ernest Johnson":6694,
    "Josh Johnson":8051,
    "Taiwan Jones":886,
    "Aaron Jones":4199,
    "Ronald Jones":5052,
    "Tony Jones":6984,
    "Kyle Juszczyk":1379,
    "Alvin Kamara":4035,
    "Joshua Kelley":7045,
    "John Kelly":5076,
    "Adrian Killins":7093,
    "Zonovan Knight":8122,
    "Bryant Koback":8246,
    "Patrick Laird":6311,
    "Benny LeMay":7048,
    "Phillip Lindsay":5170,
    "John Lovett":6231,
    "John Lovett":8568,
    "Marlon Mack":4152,
    "Kevin Marks":8424,
    "Jordan Mason":8408,
    "Alexander Mattison":5987,
    "Christian McCaffrey":4034,
    "Sincere McCormick":8220,
    "Nate McCrary":8058,
    "Anthony McFarland":6878,
    "Elijah McGuire":4263,
    "Jerick McKinnon":2161,
    "J.D. McKissic":3664,
    "Jeremy McNichols":4219,
    "Sony Michel":4962,
    "Elijah Mitchell":7561,
    "Joe Mixon":4018,
    "Taquan Mizzell":4349,
    "Ty Montgomery":2399,
    "Ty Montgomery II":2399,
    "David Montgomery":5892,
    "Zack Moss":6845,
    "Raheem Mostert":2749,
    "Gabe Nabers":7318,
    "Kene Nwangwu":7720,
    "Dare Ogunbowale":4718,
    "Qadree Ollison":6002,
    "Devine Ozigbo":6068,
    "Isiah Pacheco":8205,
    "Jacques Patrick":6108,
    "Cordarrelle Patterson":1535,
    "Jaret Patterson":7537,
    "Rashaad Penny":4985,
    "Samaje Perine":4147,
    "La'Mical Perine":6908,
    "Dameon Pierce":8129,
    "Sandro Platzgummer":7412,
    "Duplicate Player":6352,
    "Tony Pollard":5967,
    "Adam Prentice":8025,
    "D'Vonte Price":8184,
    "Trey Ragas":7993,
    "Craig Reynolds":6659,
    "Patrick Ricard":4353,
    "Jalen Richard":3868,
    "Ronnie Rivers":8195,
    "James Robinson":6955,
    "Brian Robinson":8154,
    "Brian Robinson Jr.":8154,
    "Larry Rountree":7574,
    "Miles Sanders":6151,
    "Mekhi Sargent":8085,
    "Jordan Scarlett":6167,
    "Boston Scott":5122,
    "Trey Sermon":7593,
    "Aaron Shampklin":8809,
    "Devin Singletary":6130,
    "Wendell Smallwood":3309,
    "Keith Smith":2073,
    "Ito Smith":5004,
    "Abram Smith":8190,
    "Benny Snell":6156,
    "Isaiah Spiller":8153,
    "Johnny Stanton":5569,
    "Rhamondre Stevenson":7611,
    "Mason Stokke":7868,
    "Pierre Strong":8116,
    "Pierre Strong Jr.":8116,
    "D'Andre Swift":6790,
    "Jonathan Taylor":6813,
    "Kenyan Drake":3242,
    "Patrick Taylor":6963,
    "J.J. Taylor":6973,
    "Darwin Thompson":6178,
    "De'Montre Tuggle":8721,
    "Ke'Shawn Vaughn":6885,
    "Kenneth Walker":8151,
    "Ken Walker":8151,
    "Kenneth Walker III":8151,
    "Ken Walker III":8151,
    "Austin Walter":6553,
    "Jonathan Ward":7087,
    "Michael Warren":6992,
    "Jaylen Warren":8228,
    "Dwayne Washington":3391,
    "Derek Watt":3354,
    "Rachaad White":8136,
    "Zamir White":8139,
    "ZaQuandre White":8173,
    "Kerrith Whyte":6175,
    "Damien Williams":1833,
    "Jonathan Williams":3312,
    "Jamaal Williams":4149,
    "Darrel Williams":5549,
    "Trayveon Williams":6144,
    "Dexter Williams":6153,
    "Ty'Son Williams":7098,
    "Antonio Williams":7203,
    "Javonte Williams":7588,
    "Avery Williams":7809,
    "Kyren Williams":8150,
    "Jeff Wilson":5284,
    "Jordan Akins":5032,
    "Mo Alie-Cox":4054,
    "Chase Allen":8182,
    "Austin Allen":8215,
    "Stephen Anderson":3496,
    "Mark Andrews":5012,
    "J.J. Arcega-Whiteside":5863,
    "Dan Arnold":4741,
    "Devin Asiasi":6956,
    "Antony Auclair":4468,
    "Josh Babicz":8559,
    "John Bates":7716,
    "Andrew Beck":6323,
    "Nate Becker":6535,
    "Blake Bell":2422,
    "Daniel Bellinger":8225,
    "Kendall Blanton":6081,
    "Nick Bowers":7308,
    "Nick Boyle":2474,
    "Cameron Brate":2214,
    "Cade Brewer":8433,
    "Pharaoh Brown":4443,
    "Harrison Bryant":6850,
    "Barrett Burns":4744,
    "Matt Bushman":7992,
    "Grant Calcaterra":8177,
    "Sal Cannella":8089,
    "Cethan Carter":4362,
    "Roger Carter":8747,
    "Tyler Conklin":5133,
    "Ty Conklin":5133,
    "Tanner Conner":8849,
    "Zach Davidson":7943,
    "Tyler Davis":7131,
    "Derrick Deese":8245,
    "Josiah Deguara":7050,
    "Will Dissly":5010,
    "Jack Doyle":1706,
    "Greg Dulcich":8172,
    "Ross Dwelley":5285,
    "Eric Ebron":2118,
    "Ben Ellefson":7288,
    "Evan Engram":4066,
    "Donnie Ernsberger":5288,
    "Zach Ertz":1339,
    "Nick Eubanks":7859,
    "Gerald Everett":4089,
    "Noah Fant":5857,
    "Luke Farrell":7842,
    "Darren Fells":1592,
    "Jake Ferguson":8110,
    "Anthony Firkser":4435,
    "John FitzPatrick":8500,
    "Miller Forristall":7854,
    "Jody Fortson":6665,
    "Cole Fotheringham":8840,
    "Jordan Franks":5253,
    "Pat Freiermuth":7600,
    "Troy Fumagalli":5092,
    "Devin Funchess":2346,
    "Zach Gentry":6018,
    "Mike Gesicki":4993,
    "Reggie Gilliam":7204,
    "Dallas Goedert":5022,
    "Jaeden Graham":5754,
    "Kylen Granson":7602,
    "Noah Gray":7828,
    "Seth Green":8539,
    "Ryan Griffin":1425,
    "Nakia Griffin-Stewart":7359,
    "Nick Guggemos":8038,
    "Jake Hausmann":8061,
    "Temarrick Hemingway":3333,
    "Peyton Hendershot":8197,
    "Hunter Henry":3214,
    "Parker Hesse":6662,
    "Connor Heyward":8181,
    "Tyler Higbee":3271,
    "Taysom Hill":4381,
    "T.J. Hockenson":5844,
    "Curtis Hodges":8192,
    "Jacob Hollister":4421,
    "J.P. Holtz":3695,
    "Austin Hooper":3202,
    "Brycen Hopkins":6926,
    "Jesper Horsted":6075,
    "Franko House":4930,
    "Wyatt Houston":4490,
    "O.J. Howard":4055,
    "Bug Howard":4326,
    "JJ Howland":8884,
    "Tanner Hudson":5409,
    "Tommy Hudson":7439,
    "Hayden Hurst":4973,
    "Tyree Jackson":6040,
    "Kalif Jackson":8088,
    "Michael Jacobson":8094,
    "Juwan Johnson":7002,
    "Brevin Jordan":7568,
    "Nikola Kalinic":8107,
    "Hunter Kampmoyer":7938,
    "Bronson Kaufusi":3239,
    "Travis Kelce":1466,
    "Ko Kieft":8484,
    "George Kittle":4217,
    "Cole Kmet":6826,
    "Dawson Knox":5906,
    "Charlie Kolar":8127,
    "Tyler Kroft":2390,
    "Erik Krommenhoek":8575,
    "Lucas Krull":8249,
    "Matt LaCosse":2944,
    "Marcedes Lewis":111,
    "Isaiah Likely":8131,
    "Hunter Long":7535,
    "Tyler Mabry":7427,
    "Alize Mack":5975,
    "Chris Manhertz":3048,
    "Ben Mason":7808,
    "Jordan Matthews":1800,
    "Trey McBride":8130,
    "Sean McKeon":6964,
    "Tre' McKitty":7554,
    "Andre Miller":8760,
    "James Mitchell":8170,
    "Zaire Mitchell-Paden":8799,
    "Foster Moreau":5985,
    "Quintin Morris":7536,
    "Thaddeus Moss":6919,
    "Johnny Mundt":4314,
    "Nick Muse":8523,
    "Chris Myarick":6529,
    "Isaac Nauta":5957,
    "David Njoku":4033,
    "James O'Shaughnessy":2476,
    "Thomas Odukoya":8924,
    "Kehinde Oginni Hassan":8706,
    "Andrew Ogletree":8489,
    "Drew Ogletree":8489,
    "Chigoziem Okonkwo":8210,
    "Chig Okonkwo":8210,
    "Albert Okwuegbunam":6843,
    "Josh Oliver":5973,
    "Cade Otton":8111,
    "Donald Parham":6074,
    "Dylan Parham":8751,
    "Colby Parkinson":6865,
    "Joshua Perkins":3668,
    "Chris Pierce":8634,
    "Jared Pinkney":6834,
    "Kyle Pitts":7553,
    "Tony Poljan":7972,
    "Gerrit Prince":8247,
    "MyCole Pruitt":2446,
    "Paul Quessenberry":7499,
    "Teagan Quitoriano":8227,
    "Kevin Rader":5171,
    "John Raine":7980,
    "Dax Raymond":6016,
    "Giovanni Ricci":7216,
    "Justin Rigg":8778,
    "Richard Rodgers":2146,
    "Armani Rogers":8665,
    "Jeremy Ruckert":8145,
    "Kyle Rudolph":943,
    "Drew Sample":6001,
    "Eric Saubert":4189,
    "Mason Schreck":4229,
    "Dalton Schultz":5001,
    "Ricky Seals-Jones":4531,
    "Bernhard Seikovits":8033,
    "Adam Shaheen":4085,
    "Stone Smartt":8583,
    "Lee Smith":812,
    "Jonnu Smith":4144,
    "Irv Smith":6126,
    "Kaden Smith":6146,
    "Durham Smythe":5008,
    "Matt Sokol":6233,
    "Jeremy Sprinkle":4221,
    "Jace Sternberger":6139,
    "Jack Stoll":7946,
    "Stephen Sullivan":6970,
    "Sage Surratt":7576,
    "Geoff Swaim":2545,
    "Tommy Sweeney":6137,
    "Logan Thomas":2251,
    "Ian Thomas":4995,
    "Colin Thompson":4647,
    "Noah Togiai":7404,
    "Levine Toilolo":1642,
    "Eric Tomlinson":2755,
    "Jake Tonges":8698,
    "Robert Tonyan":4602,
    "Adam Trautman":6869,
    "Tommy Tremble":7694,
    "Cole Turner":8214,
    "C.J. Uzomah":2460,
    "Nick Vannett":3258,
    "Darren Waller":2505,
    "Leroy Watson":8660,
    "David Wells":5235,
    "Trevon Wesco":6181,
    "Mitchell Wilcox":6894,
    "Maxx Williams":2360,
    "Charlie Woerner":7075,
    "Eli Wolf":7065,
    "Jelani Woods":8219,
    "Brock Wright":7891,
    "Jalen Wydermyer":8115,
    "Kenny Yeboah":7597,
    "Deon Yelder":5277,
    "Shane Zylstra":8041,
    "Davante Adams":2133,
    "Nelson Agholor":2325,
    "Jamal Agnew":4198,
    "Brandon Aiyuk":6803,
    "Landen Akers":7915,
    "Maurice Alexander":8921,
    "Keenan Allen":1479,
    "Devon Allen":8411,
    "Robbie Anderson":3423,
    "Robbie Chosen":3423,
    "Tutu Atwell":7562,
    "Calvin Austin":8125,
    "Calvin Austin III":8125,
    "Kevin Austin":8200,
    "Andre Baccellia":7233,
    "Alex Bachman":6386,
    "Kawaan Baker":7752,
    "Daylen Baldwin":8928,
    "Michael Bandy":8076,
    "Rashod Bateman":7571,
    "Cameron Batson":5289,
    "David Bell":8118,
    "Trinity Benson":6395,
    "Jared Bernhardt":8663,
    "Braxton Berrios":5121,
    "Stanley Berryhill":8419,
    "Tarik Black":8005,
    "C.J. Board":4344,
    "Victor Bolden":4453,
    "Slade Bolden":8191,
    "Kendrick Bourne":4454,
    "Lynn Bowden":6909,
    "Tyler Boyd":3225,
    "Miles Boykin":5965,
    "Trevon Bradford":8581,
    "Ja'Marcus Bradley":7244,
    "Shemar Bridges":8731,
    "John Brown":2238,
    "Noah Brown":4234,
    "Marquise Brown":5848,
    "A.J. Brown":5859,
    "Dyami Brown":7587,
    "Treylon Burks":8135,
    "Damiere Byrd":2673,
    "Lawrence Cager":7106,
    "Deon Cain":5101,
    "Marquez Callaway":6989,
    "Jalen Camp":7789,
    "Parris Campbell":5880,
    "DeAndre Carter":2750,
    "Quintez Cephus":6895,
    "DJ Chark":4951,
    "Irvin Charles":8861,
    "Ja'Marr Chase":7564,
    "Dan Chisena":7357,
    "Chase Claypool":6886,
    "Tyrie Cleveland":7032,
    "Randall Cobb":928,
    "Keelan Cole":4622,
    "Matt Cole":7352,
    "Corey Coleman":3177,
    "Nico Collins":7569,
    "Chris Conley":2381,
    "Brandin Cooks":2197,
    "Amari Cooper":2309,
    "Pharoh Cooper":3278,
    "Jeff Cotton":7319,
    "Isaiah Coulter":7085,
    "Keke Coutee":5007,
    "Britain Covey":8414,
    "River Cracraft":4854,
    "Jamison Crowder":2410,
    "Frank Darby":7530,
    "Jaelon Darden":7713,
    "Corey Davis":4036,
    "Gabe Davis":6943,    
    "Gabriel Davis":6943,
    "Danny Davis":8602,
    "Stefon Diggs":2449,
    "Dai'Jean Dixon":8213,
    "Phillip Dorsett":2334,
    "Greg Dortch":5970,
    "Keelan Doss":6032,
    "Jahan Dotson":8119,
    "Romeo Doubs":8121,
    "Dontario Drummond":8166,
    "Ashton Dulin":6427,
    "Devin Duvernay":6847,
    "Bryan Edwards":6870,
    "Alex Erickson":3433,
    "Dee Eskridge":7612,
    "Drew Estrada":8543,
    "Mike Evans":2216,
    "Erik Ezukanma":8114,
    "Simi Fehoko":7812,
    "Ethan Fernea":8831,
    "Chris Finke":7092,
    "Dez Fitzpatrick":7729,
    "Joe Forson":6677,
    "Robert Foster":5250,
    "Daurice Fountain":5102,
    "Travis Fulgham":6059,
    "Aaron Fuller":6967,
    "Rico Gafford":5197,
    "Russell Gage":5110,
    "Michael Gallup":5038,
    "Kaylon Geiger":8863,
    "Kaylon Geiger Sr.":8863,
    "Tanner Gentry":4551,
    "Chris Godwin":4037,
    "Kenny Golladay":4131,
    "Marquise Goodwin":1346,
    "Josh Gordon":1244,
    "Jakeem Grant":3342,
    "Danny Gray":8176,
    "Cyril Grayson":4050,
    "A.J. Green":830,
    "Jalen Guyton":6421,
    "Justin Hall":8441,
    "KJ Hamler":6805,
    "Josh Hammond":7287,
    "Mecole Hardman":5917,
    "Mecole Hardman Jr.":5917,
    "Mike Harley":8421,
    "DeMichael Harris":7279,
    "Jacob Harris":7703,
    "N'Keal Harry":5878,
    "Penny Hart":5902,
    "Deonte Harty":6234,
    "Ra'Shaun Henry":8571,
    "Rashard Higgins":3328,
    "Tee Higgins":6801,
    "John Hightower":7086,
    "Tyreek Hill":3321,
    "KJ Hill":6866,
    "Kendall Hinton":7210,
    "Khadarel Hodge":5773,
    "Isaiah Hodgins":6920,
    "Mack Hollins":4177,
    "Cody Hollister":4420,
    "DeAndre Hopkins":1426,
    "Dennis Houston":8801,
    "Lil'Jordan Humphrey":5938,
    "Allen Hurns":1984,
    "Ishmael Hyman":6209,
    "Trenton Irwin":6598,
    "Andy Isabella":5915,
    "Thomas Ives":6465,
    "Trishton Jackson":7009,
    "Calvin Jackson":8251,
    "Richie James":5137,
    "Richie James Jr.":5137,
    "Justin Jefferson":6794,
    "Van Jefferson":6853,
    "Gary Jennings":6045,
    "Jauan Jennings":7049,
    "Jerry Jeudy":6783,
    "Marcus Johnson":3445,
    "Diontae Johnson":5937,
    "KeeSean Johnson":5962,
    "Tyron Johnson":6063,
    "Bisi Johnson":6088,
    "Collin Johnson":6857,
    "Tyler Johnson":6960,
    "Cade Johnson":7956,
    "Johnny Johnson":8185,
    "Johnny Johnson III":8185,
    "Brandon Johnson":8756,
    "Willie Johnson":8881,
    "Julio Jones":947,
    "Marvin Jones":1067,
    "Andy Jones":3702,
    "Zay Jones":4080,
    "Tim Jones":8013,
    "Velus Jones":8223,
    "Velus Jones Jr.":8223,
    "Kevin Kassis":8876,
    "Marcus Kemp":4491,
    "Tom Kennedy":6588,
    "Mason Kinsey":7436,
    "Christian Kirk":4950,
    "Jontre Kirklin":8628,
    "Keith Kirkwood":5134,
    "Jake Kumerow":2821,
    "Cooper Kupp":4039,
    "CeeDee Lamb":6786,
    "Jarvis Landry":1825,
    "Kwamie Lassiter":8435,
    "Allen Lazard":5185,
    "Tyler Lockett":2374,
    "Drake London":8112,
    "Terrace Marshall":7565,
    "Tay Martin":8250,
    "Eldridge Massington":5744,
    "Ray-Ray McCloud":5096,
    "Ray-Ray McCloud III":5096,
    "Lance McCutcheon":8745,
    "Kyric McGowan":8595,
    "Isaiah McKenzie":4197,
    "Terry McLaurin":5927,
    "Racey McMath":7793,
    "Bo Melton":8204,
    "Kirk Merritt":7351,
    "John Metchie":8147,
    "John Metchie III":8147,
    "Jakobi Meyers":5947,
    "Marken Michel":3568,
    "Anthony Miller":5013,
    "Scott Miller":6290,
    "Dax Milne":7751,
    "Denzel Mims":6849,
    "Myron Mitchell":7578,
    "Darnell Mooney":7090,
    "Chris Moore":3269,
    "David Moore":4274,
    "DJ Moore":4983,
    "Jason Moore":6247,
    "Jaylon Moore":7191,
    "Elijah Moore":7596,
    "Rondale Moore":7601,
    "Skyy Moore":8168,
    "Stanley Morgan":6069,
    "Samson Nacua":8824,
    "Jalen Nailor":8180,
    "Tre Nixon":7546,
    "Chris Olave":8144,
    "Gunner Olszewski":6699,
    "K.J. Osborn":7066,
    "Joshua Palmer":7670,
    "Josh Palmer":7670,
    "DeVante Parker":2319,
    "Aaron Parker":7091,
    "Zach Pascal":4319,
    "Dezmon Patmon":6985,
    "Tim Patrick":4351,
    "Neil Pau'u":8436,
    "JaVonta Payton":8632,
    "Donovan Peoples-Jones":6824,
    "Breshad Perriman":2331,
    "Dante Pettis":4992,
    "Kyle Philips":8171,
    "George Pickens":8137,
    "Alec Pierce":8142,
    "Kalil Pimpleton":8248,
    "Michael Pittman":6819,
    "Duplicate Player":5282,
    "Makai Polk":8209,
    "Brandon Powell":5695,
    "Cornell Powell":7541,
    "Byron Pringle":5199,
    "James Proche":6957,
    "Blake Proehl":7552,
    "Kendric Pryor":8783,
    "Charleston Rambo":8198,
    "Kalif Raymond":3634,
    "Jalen Reagor":6798,
    "Joe Reed":6913,
    "Hunter Renfrow":5955,
    "Josh Reynolds":4171,
    "Calvin Ridley":4981,
    "Al Riles":4937,
    "Reggie Roberson":8175,
    "Andre Roberts":627,
    "Allen Robinson":1992,
    "Demarcus Robinson":3286,
    "Wan'Dale Robinson":8126,
    "Amari Rodgers":7540,
    "Chester Rogers":3582,
    "Shaq Roland":5638,
    "Justyn Ross":8140,
    "Curtis Samuel":4082,
    "Deebo Samuel":5872,
    "Braylon Sanders":8178,
    "Mohamed Sanu":1071,
    "C.J. Saunders":8068,
    "Garrett Scantling":4922,
    "Anthony Schwartz":7533,
    "Caleb Scott":5223,
    "Kevin Shaa":8697,
    "Rashid Shaheed":8676,
    "Khalil Shakir":8134,
    "Tajae Sharpe":3297,
    "Laviska Shenault":6814,
    "Sterling Shepard":3200,
    "Darrius Shepherd":6519,
    "Trent Sherfield":5154,
    "David Sills":6154,
    "David Sills V":6154,
    "Micah Simon":7618,
    "Cam Sims":5432,
    "Steven Sims":6402,
    "Ben Skowronek":7757,
    "Matt Slater":312,
    "Darius Slayton":6149,
    "Tre'Quan Smith":5026,
    "Jaylen Smith":6155,
    "Jeff Smith":6557,
    "DeVonta Smith":7525,
    "Shi Smith":7603,
    "Brandon Smith":7865,
    "Ihmir Smith-Marsette":7559,
    "JuJu Smith-Schuster":4040,
    "Willie Snead":1911,
    "Tyler Snead":8409,
    "Equanimeous St. Brown":5323,
    "Amon-Ra St. Brown":7547,
    "Jerreth Sterns":8236,
    "Marquez Stevenson":7556,
    "Dillon Stoner":7996,
    "Mike Strachan":7944,
    "Courtland Sutton":5045,
    "Freddie Swain":7135,
    "Trent Taylor":4218,
    "Malik Taylor":6239,
    "Adam Thielen":1689,
    "Michael Thomas":3199,
    "Mike Thomas":3652,
    "DeAndre Thompkins":6540,
    "Deven Thompkins":8253,
    "Cody Thompson":6171,
    "Tyquan Thornton":8188,
    "Jalen Tolbert":8117,
    "Kadarius Toney":7606,
    "Samori Toure":8235,
    "Austin Trammell":7746,
    "Laquon Treadwell":3155,
    "Malik Turner":5781,
    "DJ Turner":7989,
    "KaVontae Turpin":8917,
    "Marquez Valdes-Scantling":5086,
    "T.J. Vasher":7862,
    "Tyler Vaughns":7548,
    "Binjimen Victor":6939,
    "Jalen Virgil":8416,
    "Jaylen Waddle":7526,
    "Tylan Wallace":7595,
    "Greg Ward":6744,
    "James Washington":5024,
    "Montrell Washington":8475,
    "Sammy Watkins":1817,
    "Quez Watkins":6927,
    "Justin Watson":5374,
    "Christian Watson":8167,
    "Raleigh Webb":8732,
    "Nsimba Webster":6387,
    "Connor Wedington":7954,
    "Antoine Wesley":6165,
    "Nick Westbrook-Ikhine":7496,
    "Keric Wheatfall":8892,
    "Kevin White":2312,
    "Myles White":3050,
    "Cody White":7039,
    "Isaac Whitney":4451,
    "Kristian Wilkerson":7438,
    "Mike Williams":4068,
    "Preston Williams":6148,
    "Seth Williams":7534,
    "Jameson Williams":8148,
    "Cedrick Wilson":5113,
    "Cedrick Wilson Jr.":5113,
    "Garrett Wilson":8146,
    "Javon Wims":5111,
    "Juwann Winfree":6223,
    "Easop Winston":7337,
    "Easop Winston Jr.":7337,
    "Robert Woods":1352,
    "Michael Woods":8202,
    "Derek Wright":8570,
    "Dareke Young":8527,
    "Olamide Zaccheaus":6271,
    "Isaiah Zuber":7458,
    "Brandon Zylstra":4878,
    "D'Wayne Eskridge":7612,
    "Latavius Murray":1476,
    "Brandon Aubrey":11533,
    "Anders Carlson":11008,
    "Blake Grupe":11058,
    "Jake Moody":10937,
    "Chad Ryland":10955,
    "Holton Ahlers":11216,
    "Tyson Bagent":11256,
    "Stetson Bennett":10857,
    "Sean Clifford":10983,
    "Malik Cunningham":10860,
    "Tommy DeVito":11292,
    "Max Duggan":10233,
    "Jake Haener":10215,
    "Jaren Hall":9231,
    "Hendon Hooker":9998,
    "Will Levis":9999,
    "Tanner McKee":9230,
    "Aidan O'Connell":10866,
    "Anthony Richardson":9229,
    "Nathan Rourke":8938,
    "C.J. Stroud":9758,
    "Dorian Thompson-Robinson":10862,
    "Clayton Tune":10217,
    "Bryce Young":9228,
    "Israel Abanikanda":9227,
    "De'Von Achane":9226,
    "Tank Bigsby":9225,
    "Chris Brooks":11370,
    "Christopher Brooks":11370,
    "Chase Brown":9224,
    "Robert Burns":11060,
    "Robert Burns":11260,
    "Zach Charbonnet":9753,
    "Jack Colletto":11174,
    "Emari Demercado":11199,
    "Elijah Dotson":11114,
    "Zach Evans":9222,
    "Jahmyr Gibbs":9221,
    "Eric Gray":10223,
    "Hassan Hall":11270,
    "Evan Hull":9220,
    "Roschon Johnson":10235,
    "Hunter Luepke":11510,
    "DeWayne McBride":9512,
    "Kenny McIntosh":10216,
    "Jaleel McLaughlin":11439,
    "Ellis Merriweather":11483,
    "Kendre Miller":9757,
    "Keaton Mitchell":9511,
    "Henry Pearson":11209,
    "Duplicate Player":6352,
    "Deneric Prince":10870,
    "Bijan Robinson":9509,
    "Chris Rodriguez":10219,
    "Chris Rodriguez Jr.":10219,
    "Tyjae Spears":9508,
    "SaRodorick Thompson":11104,
    "Sean Tucker":9506,
    "Xazavian Valladay":10861,
    "Deuce Vaughn":9505,
    "Emanuel Wilson":11435,
    "Owen Wright":11384,
    "Nate Adkins":11433,
    "Davis Allen":10214,
    "Payne Durham":10227,
    "Princeton Fant":11508,
    "Elijah Higgins":10231,
    "Julian Hill":11371,
    "Ryan Jones":11298,
    "Dalton Kincaid":10236,
    "Tucker Kraft":9484,
    "Zack Kuntz":9483,
    "Sam LaPorta":10859,
    "Cameron Latu":10210,
    "Will Mallory":10220,
    "Michael Mayer":9482,
    "Luke Musgrave":9481,
    "Brady Russell":11280,
    "Luke Schoonmaker":10871,
    "John Samuel Shenker":11467,
    "Ben Sims":11082,
    "John Stephens":11511,
    "Brenton Strange":9480,
    "Tanner Taula":11415,
    "Leonard Taylor":11140,
    "Travis Vokolek":11381,
    "Darnell Washington":9479,
    "Josh Whyle":10212,
    "Brayden Willis":10224,
    "Joel Wilson":11113,
    "Jordan Addison":9756,
    "Josh Ali":8931,
    "Kazmeir Allen":11070,
    "Ronnie Bell":10221,
    "Jake Bobo":10867,
    "Kayshon Boutte":9504,
    "Jalen Brooks":11034,
    "Jason Brownlee":11311,
    "Terrell Bynum":11115,
    "Elijah Cooks":11139,
    "Jalen Cropper":11506,
    "Derius Davis":10234,
    "Shaquan Davis":11105,
    "Tank Dell":9502,
    "Demario Douglas":9501,
    "Colton Dowell":11046,
    "Josh Downs":9500,
    "Dylan Drummond":11474,
    "Grant DuBose":11024,
    "David Durden":11505,
    "Zay Flowers":9997,
    "Bryce Ford-Wheaton":9499,
    "Xavier Gipson":11306,
    "Antoine Green":11053,
    "Tre'Shaun Harrison":11456,
    "Malik Heath":11210,
    "Xavier Hutchinson":10218,
    "Jalin Hyatt":9497,
    "Andrei Iosivas":10226,
    "Kearis Jackson":11099,
    "Shedrick Jackson":11257,
    "Lucky Jackson":11520,
    "Rakim Jarrett":9495,
    "Cephus Johnson":11081,
    "Quentin Johnston":9754,
    "Charlie Jones":10228,
    "Matt Landers":10869,
    "Zay Malone":11189,
    "Jesse Matthews":11452,
    "Ryan Miller":11421,
    "Marvin Mims":9494,
    "Marvin Mims Jr.":9494,
    "Jonathan Mingo":10225,
    "Puka Nacua":9493,
    "Joseph Ngata":11276,
    "Trey Palmer":9492,
    "A.T. Perry":10863,
    "Thyrick Pitts":11266,
    "Duplicate Player":5282,
    "Jayden Reed":10222,
    "Rashee Rice":10229,
    "Sean Ryan":11387,
    "Tyler Scott":9490,
    "Tyrell Shavers":11377,
    "Justin Shorter":9489,
    "Xavier Smith":11168,
    "Jaxon Smith-Njigba":9488,
    "Thayer Thomas":11073,
    "Bryan Thompson":11495,
    "Cedric Tillman":10444,
    "Mitchell Tinsley":11068,
    "Brycen Tremayne":11157,
    "Tre Tucker":10213,
    "Parker Washington":9487,
    "Dontayvion Wicks":9486,
    "Michael Wilson":10232,
    "Isaiah Winstead":11232,
    "Brandon Aubrey":11533,
    "Michael Badgley":5230,
    "Tyler Bass":7042,
    "Chris Boswell":1945,
    "Randy Bullock":1099,
    "Harrison Butker":4227,
    "Daniel Carlson":5095,
    "Anders Carlson":11008,
    "Cameron Dicker":8259,
    "Jake Elliott":4195,
    "Ka'imi Fairbairn":3451,
    "Nick Folk":650,
    "Graham Gano":503,
    "Matt Gay":6083,
    "Blake Grupe":11058,
    "Lucas Havrisik":8932,
    "Dustin Hopkins":1348,
    "Greg Joseph":5272,
    "Alex Kessman":7933,
    "Younghoe Koo":4666,
    "Wil Lutz":3678,
    "Chase McLaughlin":6650,
    "Brandon McManus":1433,
    "Evan McPherson":7839,
    "Jake Moody":10937,
    "Jason Myers":2747,
    "Riley Patterson":7922,
    "Eddy Pineiro":5189,
    "Matt Prater":17,
    "Chad Ryland":10955,
    "Jason Sanders":5119,
    "Cairo Santos":2020,
    "Joey Slye":6528,
    "Justin Tucker":1264,
    "Cade York":8258,
    "Greg Zuerlein":1266,
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
    "Las Vegas Raiders":"LV",
    "Los Angeles Chargers":"LAC",
    "Los Angeles Rams":"LAR",
    "Miami Dolphins":"MIA",
    "Minnesota Vikings":"MIN",
    "New England Patriots":"NE",
    "New Orleans Saints":"NO",
    "New York Giants":"NYG",
    "New York Jets":"NYJ",
    "Philadelphia Eagles":"PHI",
    "Pittsburgh Steelers":"PIT",
    "San Francisco 49ers":"SF",
    "Seattle Seahawks":"SEA",
    "Tampa Bay Buccaneers":"TB",
    "Tennessee Titans":"TEN",
    "Washington Commanders":"WAS"
  };

  try {
    id = names[name];
  }
  catch (err) {
    var id = null;
  }
  return id;
}
//view-source:

function searchResults(input) {
  var url = "https://search.aol.com/aol/search?q="+encodeURIComponent(input);//+"&num=1&start=1";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var options = {
    'muteHttpExceptions' : true
  };
  var searchResults = UrlFetchApp.fetch(url, options);
  var urlExp = /(id\/[0-9]+)/g;
  try {
    var titleResults = searchResults.getContentText().match(urlExp);
    // return the first match
    return titleResults[0];
  } catch (err) {
    return (err + ' ' + url);
  }
}

function espnPlayerIDSearch(input) {
  arr = input.split(" ");
  first = arr[0];
  last = arr[arr.length-1];
  if (last.length <= 3){
    last = arr[arr.length-2];
  }
  var lower = [];
  arr.forEach(element => {
    lower.push(element.toLowerCase());
  });
  full = lower.join('-');
  var url = "http://www.espn.com/nfl/players?search="+encodeURIComponent(last);//+"&num=1&start=1";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var options = {
    'muteHttpExceptions' : true
  };
  var searchResults = UrlFetchApp.fetch(url, options);
  var urlExp = new RegExp("[0-9]+(?=\/"+full+")","g");
  try {
    var titleResults = searchResults.getContentText().match(urlExp);
    // return the first match
    return titleResults[0];
  } catch (err) {
    return (url);
  }
}


function searchResults2(input) {
  var url = "https://duckduckgo.com/?q="+encodeURIComponent(input);//+"&num=1&start=1";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var options = {
    'muteHttpExceptions' : true
  };
  var searchResults = UrlFetchApp.fetch(url, options);
  var urlExp = /(\<a\ href\=\"http([A-Za-z0-9\.\:\/\_\-\"]+))/gi;
  var titleResults = searchResults.getContentText().match(urlExp);
  // return the first match
  return titleResults;
}

/*
ADDITIONAL ENDPOINTS
https://api.sleeper.com/players/nfl
https://api.sleeper.com/stats/nfl/2023?season_type=regular&position=TEAM&order_by=
https://api.sleeper.com/stats/nfl/2023?season_type=regular&position=DEF&order_by=fan_pts_allow
https://api.sleeper.com/stats/nfl/2023?season_type=regular&position[]=TEAM&order_by=pts_half
https://api.sleeper.com/schedule/nfl/regular/2023
*/
