// WEEKLY FF FUNCTIONS - Updated 11.22.2024

const scoreboard = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

// Function to create draft menu on spreadsheet, should be triggered by an onOpen trigger
function toolbar(setting) {
  const ui = SpreadsheetApp.getUi();
  let menuTools = ui.createMenu('Football Tools')
  menuTools.addItem('Setup','draftSetup');
  if (setting != 'first') {;
    menuTools.addItem('Refresh Players','playersRefresh');
  }
  if (setting == 'draft') {
    menuTools.addItem('Recreate Triggers','triggersDrafting');
    menuTools.addItem('Stop Draft','deleteTriggers');
  } else if (setting == 'predraft') {
    menuTools.addItem('Start Draft','startDrafting');
  }
  menuTools.addItem('Update NFL Schedule','fetchNFL');
  menuTools.addToUi();
  
  if (setting == 'scoring') {
    scoringShow();
    menuTools.addSubMenu(ui.createMenu('Scoring')
      .addItem('Get Scores', 'sleeperScoringLogging')
      .addItem('Live Scoring ON', 'sleeperLiveScoringOn')
      .addItem('Live Scoring OFF', 'sleeperLiveScoringOff'))
      .addToUi();
  } else {
    scoringHide();
  }
}

function toolbarFirst(){
  toolbar('first');
}
function toolbarPreDraft(){
  toolbar('predraft');
}
function toolbarDraft(){
  toolbar('draft');
}
function toolbarScoring(){
  toolbar('scoring');
}
function toolbarAuto(){
  let existing = existingDraft()
  let type;
  existing[1] == 0 ? toolbarScoring() : (existing[0] == 0 ? toolbarPreDraft() : type = toolbarDraft());
}

// Function to run all player pool setup scripts (auto = 1 escapes prompt)
function playersRefresh(auto) {
  let prompt;
  if ( auto != 1 ) {
    const ui = SpreadsheetApp.getUi();
    prompt = ui.alert('Update Sleeper players list, Sleeper projections, ESPN projections, Fantasy Pros projections, statuses, and injury notes?', ui.ButtonSet.OK_CANCEL)
  } else {
    prompt = 'OK';
  }
  
  if ( prompt == 'OK' ) {
    players();
    ss.toast('All player data updated');
    draftList();
    ss.toats('Draft list created for eligible players');
    draftLobbyClean();
    ss.toast('Updated and prepped the draft lobby');
    SpreadsheetApp.getActiveSpreadsheet().toast('Updated Players');
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast('Canceled');
  }

}


// Refresh triggers if errors being experienced
function triggersDrafting() {
  deleteTriggers();
  createTriggers();
}

// Refresh triggers if errors being experienced
function triggersStandard() {
  deleteTriggers();
  createOnOpen();
}

// Deletes all triggers in the current project.
function deleteTriggers() {
  let triggers = ScriptApp.getProjectTriggers();
  let scoring = false;
  for (let a = 0; a < triggers.length; a++) {
    if ( triggers[a].getHandlerFunction() == 'dynamicDrafter' ) {
      ScriptApp.deleteTrigger(triggers[a]);
    }
    if ( triggers[a].getHandlerFunction() == 'toolbarAuto' ) {
      ScriptApp.deleteTrigger(triggers[a]);
    }
    if ( triggers[a].getHandlerFunction() == 'sleeperScoringAuto' ) {
      ScriptApp.deleteTrigger(triggers[a]);
      scoring == false ? scoring = true : null;
    }
  }
  scoring == true ? sleeperLiveScoringOn() : null;
}

// Creates an edit trigger for a spreadsheet identified by ID.
function createTriggers() {
  createOnOpen();
  createDrafterTrigger();
}

// Creates an edit trigger for a spreadsheet identified by ID.
function createDrafterTrigger() {
  ScriptApp.newTrigger('dynamicDrafter')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet().getId())
    .onEdit()
    .create();
}


// Creates an edit trigger for a spreadsheet identified by ID.
function createOnOpen() {
  ScriptApp.newTrigger('toolbarAuto')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet().getId())
    .onOpen()
    .create();
}


// NFL TEAM INFO - script to fetch all NFL data for teams
// NFL TEAM INFO - script to fetch all NFL data for teams
function fetchNFL() {
  // Calls the linked spreadsheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Declaration of script variables
  let abbr, name, maxRows, maxCols;
  const year = fetchYear();
  const objTeams = fetchTeamsESPN();
  const teamsLen = objTeams.length;
  let arr = [];
  let nfl = [];
  let espnId = [];
  let espnAbbr = [];
  let espnName = [];
  let espnLocation = [];
  let location = [];  
  
  for (let a = 0 ; a < teamsLen ; a++ ) {
    arr = [];
    if(objTeams[a].id != 0 ) {
      abbr = objTeams[a].abbrev.toUpperCase();
      abbr = abbr == 'WSH' ? 'WAS' : abbr;
      name = objTeams[a].name;
      location = objTeams[a].location;
      espnId.push(objTeams[a].id);
      espnAbbr.push(abbr);
      espnName.push(name);
      espnLocation.push(location);
      arr = [objTeams[a].id,abbr,location,name,objTeams[a].byeWeek];
      nfl.push(arr);
    }
  }
  
  let sheet, range;
  let ids = [];
  let abbrs = [];
  for (let a = 0 ; a < espnId.length ; a++ ) {
    ids.push(espnId[a].toFixed(0));
    abbrs.push(espnAbbr[a]);
  }
  // Declaration of variables
  let schedule = [];
  let home = [];
  let dates = [];
  let allDates = [];
  let hours = [];
  let allHours = [];
  let minutes = [];
  let allMinutes = [];
  let byeIndex, id;
  let date, hour, minute;
  let weeks = Object.keys(objTeams[0].proGamesByScoringPeriod).length;
  if ( objTeams[0].byeWeek > 0 ) {
    weeks++;
  }

  location = [];
  
  for (let a = 0 ; a < teamsLen ; a++ ) {
    
    arr = [];
    home = [];
    dates = [];
    hours = [];
    minutes = [];
    byeIndex = objTeams[a].byeWeek.toFixed(0);
    if ( byeIndex != 0 ) {
      id = objTeams[a].id.toFixed(0);
      arr.push(abbrs[ids.indexOf(id)]);
      home.push(abbrs[ids.indexOf(id)]);
      dates.push(abbrs[ids.indexOf(id)]);
      hours.push(abbrs[ids.indexOf(id)]);
      minutes.push(abbrs[ids.indexOf(id)]);
      for (let b = 1 ; b <= weeks ; b++ ) {
        if ( b == byeIndex ) {
          arr.push('BYE');
          home.push('BYE');
          dates.push('BYE');
          hours.push('BYE');
          minutes.push('BYE');
        } else {
          if ( objTeams[a].proGamesByScoringPeriod[b][0].homeProTeamId.toFixed(0) === id ) {
            arr.push(abbrs[ids.indexOf(objTeams[a].proGamesByScoringPeriod[b][0].awayProTeamId.toFixed(0))]);
            home.push(1);
            date = new Date(objTeams[a].proGamesByScoringPeriod[b][0].date);
            dates.push(date);
            hour = date.getHours();
            hours.push(hour);
            minute = date.getMinutes();
            minutes.push(minute);
          } else {
            arr.push(abbrs[ids.indexOf(objTeams[a].proGamesByScoringPeriod[b][0].homeProTeamId.toFixed(0))]);
            home.push(0);
            date = new Date(objTeams[a].proGamesByScoringPeriod[b][0].date);
            dates.push(date);
            hour = date.getHours();
            hours.push(hour);
            minute = date.getMinutes();
            minutes.push(minute);
          }
        }
      }
      schedule.push(arr);
      location.push(home);
      allDates.push(dates);
      allHours.push(hours);
      allMinutes.push(minutes);
    }
  }
  
  // This section creates a nice table to be used for lookups and queries about NFL season
  let week, awayTeam, awayTeamName, awayTeamLocation, homeTeam, homeTeamName, homeTeamLocation, mnf, day, dayName;
  let formData = [];
  arr = [];
  let weekArr = [];
  for (let b = 0; b < (teamsLen - 1); b++ ) {
    for ( let c = 1; c <= weeks; c++ ) {
      if (location[b][c] == 1) {
        week = c;
        awayTeam = schedule[b][c];
        awayTeamName = espnName[espnAbbr.indexOf(awayTeam)];
        awayTeamLocation = espnLocation[espnAbbr.indexOf(awayTeam)];
        homeTeam = schedule[b][0];
        homeTeamName = espnName[espnAbbr.indexOf(homeTeam)];
        homeTeamLocation = espnLocation[espnAbbr.indexOf(homeTeam)];
        date = allDates[b][c];
        hour = allHours[b][c];
        minute = allMinutes[b][c];
        day = date.getDay();
        mnf = 0;
        if ( day == 1 ) {
          mnf = 1;
          dayName = 'Monday';
        } else if ( day == 0 ) {
          dayName = 'Sunday';
        } else if ( day == 4 ) {
          day = -3;
          dayName = 'Thursday';
        } else if ( day == 5 ) {
          day = -2;
          dayName = 'Friday';
        } else if ( day == 6 ) {
          day = -1;
          dayName = 'Saturday';
        }        
        arr = [week, date, day, hour, minute, dayName, awayTeam, homeTeam, awayTeamLocation, awayTeamName, homeTeamLocation, homeTeamName];
        formData.push(arr);
        weekArr.push(week);
      }
    }
  }
  let headers = ['week','date','day','hour','minute','dayName','awayTeam','homeTeam','awayTeamLocation','awayTeamName','homeTeamLocation','homeTeamName'];
  let sheetName = 'NFL_SEASON';
  let rows = formData.length + 1;
  let columns = formData[0].length;

  sheet = ss.getSheetByName(sheetName);  
  if (sheet == null) {
    ss.insertSheet(sheetName,0);
    sheet = ss.getSheetByName(sheetName);
  }
  
  maxRows = sheet.getMaxRows();
  if (maxRows < rows){
    sheet.insertRows(maxRows,rows - maxRows - 1);
  } else if (maxRows > rows){
    sheet.deleteRows(rows,maxRows - rows);
  }
  maxCols = sheet.getMaxColumns();
  if (maxCols < columns) {
    sheet.insertColumnsAfter(maxCols,columns - maxCols);
  } else if (maxCols > columns){
    sheet.deleteColumns(columns,maxCols - columns);
  }
  sheet.setColumnWidths(1,columns,30);
  sheet.setColumnWidth(2,60);
  sheet.setColumnWidth(6,60);
  sheet.setColumnWidths(9,4,80);
  sheet.clear();
  range = sheet.getRange(1,1,1,columns);
  range.setValues([headers]);
  ss.setNamedRange(sheetName+'_HEADERS',range);
 
  range = sheet.getRange(1,1,rows,columns);
  range.setFontSize(8);
  range.setVerticalAlignment('middle');  
  range = sheet.getRange(2,1,formData.length,columns);
  range.setValues(formData);

  ss.setNamedRange(sheetName,range);
  range.setHorizontalAlignment('left');
  range.sort([{column: 1, ascending: true},{column: 2, ascending: true},{column: 4, ascending: true},
              {column:  5, ascending: true},{column: 6, ascending: true},{column: 8, ascending: true}]); 
  sheet.getRange(1,3).setNote('-3: Thursday, -2: Friday, -1: Saturday, 0: Sunday, 1: Monday, 2: Tuesday');
  
  // Fetches sorted data
  formData = range.getValues();
  weekArr = sheet.getRange(2,1,rows-1,1).getValues().flat();
  // Sets named ranges for weekly home and away teams to compare for survivor status
  awayTeam = headers.indexOf('awayTeam')+1;
  homeTeam = headers.indexOf('homeTeam')+1;
  for (let a = 1; a <= weeks; a++) {
    let start = weekArr.indexOf(a)+2;
    let end = weekArr.indexOf(a+1)+2;
    if (a == weeks) {
      end = rows+1;
    }
    let len = end - start;
  }
  sheet.protect().setDescription(sheetName);
  try {
    sheet.hideSheet();
  }
  catch (err){
    // Logger.log('fetchNFL hiding: Couldn\'t hide sheet as no other sheets exist');
  }
  ss.toast('Imported all NFL schedule data');
}

//------------------------------------------------------------------------
// FETCH CURRENT YEAR
function fetchYear() {
  var obj;
  obj = JSON.parse(UrlFetchApp.fetch(scoreboard).getContentText());
  var year = obj['season']['year'];
  return year;
}

//------------------------------------------------------------------------
// FETCH CURRENT WEEK
function fetchWeek() {
  return SpreadsheetApp.getActiveSpreadsheet().getRangeByName('WEEK').getValue();
}

// FETCH FORMAT
function fetchFormat() {
  return SpreadsheetApp.getActiveSpreadsheet().getRangeByName('FORMAT').getValue();
}

// FETCH TEAMS
// Include boolean true value to split home and away as arrays
function fetchTeams(split) {
  const games = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('GAMES').getValues().flat();
  let teams = [], away = [], home = [];
  for (let a = 0; a < games.length; a++) {
    if ( games[a] != '' ) {
      if (split) {
        away.push(games[a].match(/[A-Z]+/g)[0]);
        home.push(games[a].match(/[A-Z]+/g)[1]);
      } else {
        teams.push(...games[a].match(/[A-Z]+/g));
      }
    }
  }
  if (split) {
    return [away,home];
  } else {
    return teams;
  }
}


// LEAGUE LOGOS - Saves URLs to logos to a Script Property variable named "logos"
function fetchLogos(){
  let obj = {};
  let logos = {};
  try{
    obj = JSON.parse(UrlFetchApp.fetch(scoreboard));
  }
  catch (err) {
    Logger.log(err.stack);
    ui.alert('ESPN API isn\'t responding currently, try again in a moment.',ui.ButtonSet.OK);
    throw new Error('ESPN API issue, try later');
  }
  
  if (Object.keys(obj).length > 0) {
    let games = obj.events;
    // Loop through games provided and creates an array for placing
    for (let a = 0; a < games.length; a++){
      let competitors = games[a].competitions[0].competitors;
      let teamOne = competitors[0].team.abbreviation;
      let teamTwo = competitors[1].team.abbreviation;
      let teamOneLogo = competitors[0].team.logo;
      let teamTwoLogo = competitors[1].team.logo;
      logos[teamOne] = teamOneLogo;
      logos[teamTwo] = teamTwoLogo;
    }
    const scriptProperties = PropertiesService.getScriptProperties();
    try {
      let logoProp = scriptProperties.getProperty('logos');
      let tempObj = JSON.parse(logoProp);
      if (Object.keys(tempObj).length < nflTeams) {
        scriptProperties.setProperty('logos',JSON.stringify(logos));
      }
    }
    catch (err) {
      Logger.log('Error fetching logo object, creating one now');
      scriptProperties.setProperty('logos',JSON.stringify(logos));
    }
  }
  return logos;
}


// Color adjustment function  
function hexColorAdjust(col, amt) {
  col = parseInt(col, 16);
  return (((col & 0x0000FF) + amt) | ((((col >> 8) & 0x00FF) + amt) << 8) | (((col >> 16) + amt) << 16)).toString(16);
}

// 2024 - Created by Ben Powers
// ben.powers.creative@gmail.com
