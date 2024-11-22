// WEEKLY FF SCORING - Updated 11.22.2024

// Creates a trigger to automatically run the 'sleeperScoring' function every X minutes
function sleeperLiveScoringOn() {
  let frequency = 5; // minutes
  // Run the function at onset to fetch scores initially, then the trigger should run every X minutes
  sleeperScoringLogging();
  ScriptApp.newTrigger('sleeperScoringLogging')
      .timeBased()
      .everyMinutes(frequency) // must be 1, 5, 10, 15, 30
      .create();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getRangeByName('LIVE').setValue('LIVE SCORING')
    .setFontColor('#FFD900')
    .setFontSize(12)
    .setFontWeight('bold');
  ss.toast('Live Scoring ON');
}

// Deletes the trigger based on any trigger associated that trigger the script 'sleeperScoring'
function sleeperLiveScoringOff() {
  let triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if ( triggers[i].getHandlerFunction() == 'sleeperScoringLogging' ) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getRangeByName('LIVE').setValue('');
  ss.toast('Live Scoring OFF');
}

// SLEEPER SCORES
// pull down players' scoring for a week in Sleeper (returns OBJECT with format {player_id}:{points scored})
function sleeperScoring(format,week) {
  const year = seasonInfo('year');
  if (week == null || week > 20 || week < 1) {
    week = fetchWeek();  
  }

  const scoring = leagueInfo(dummyLeagueSleeper(format),'scoring');
  
  const obj = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/stats/nfl/'+year+'/'+week+'?season_type=regular&position[]=DEF&position[]=FLEX&position[]=QB&position[]=RB&position[]=TE&position[]=WR&position[]=K&order_by=player_id'));
  const players = obj.length;

  let ids = [];
  let pts = {};
  let id, key, score;
  for (let a = 0; a < players; a++) {
    score = 0;
    id = obj[a]['player_id'];
    for (var keys in scoring) {
      if ( isNaN(parseFloat(obj[a]['stats'][keys])*parseFloat(scoring[keys])) == false && parseFloat(obj[a]['stats'][keys]) != null ) {
        score = score + parseFloat(obj[a]['stats'][keys])*parseFloat(scoring[keys]);
      }
    }
    pts[id] = score;
  }
  Logger.log('Scoring pulled for week ' + week + ' successfully');
  return pts;   
}

// SLEEPER SCORING LOGGING
// write Sleeper scores to sheet
function sleeperScoringLogging(){
  
  let format = fetchFormat()
  format == 'HALF PPR' ? format = 'HALF' : null;
  const week = fetchWeek('week');
  let obj = sleeperScoring(format,week)
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sourceID = ss.getRangeByName('SLPR_PLAYER_ID').getValues().flat();
  let scoreRange = ss.getRangeByName('SLPR_SCORE');
  let arr = [];
  let data = [];
  for (let a = 0; a < sourceID.length; a++) {
    arr = [];
    if (obj[sourceID[a]] != null) {
      arr = [obj[sourceID[a]]];
    } else {
      arr = [''];
    }
    data.push(arr);
  }
  for (let a = 0; a < data.length; a++) {
    Logger.log(data[a].length);
  }
  Logger.log(data)
  scoreRange.setHorizontalAlignment('right');
  scoreRange.setValues(data);

  if (!complete()) {
    ss.toast('Updated scores for all players in week ' + week + ' successfully');
  } else {
    ss.toast('Trigger for live scoring disabled, matchups are all complete. Checking for winner.')
    const namesRange = ss.getRangeByName('ROSTER_NAMES');
    const pointsRange = ss.getRangeByName('ROSTER_POINTS');
    let names = namesRange.getValues().flat();
    const regex = /^(?!Score$|\s*$).+/;
    let namesFiltered = names.filter(value => regex.test(value));
    let points = pointsRange.getValues().flat();
    const isNumeric = value => typeof value === 'number' && !isNaN(value);
    let pointsFiltered = points.filter(isNumeric);
    // Create an array of indices to maintain the original order
    const indices = Array.from({ length: pointsFiltered.length }, (_, index) => index);
    indices.sort((a, b) => pointsFiltered[b] - pointsFiltered[a]);
    namesFiltered = indices.map(index => namesFiltered[index]);
    pointsFiltered = indices.map(index => pointsFiltered[index]);
    let multiple = (count = pointsFiltered.filter((value) => value === pointsFiltered[0]).length > 1) ? true : false;
    let title = ss.getSheetByName('CONFIG').getRange(1,1).getValue();
    let upper = (/^[A-Z0-9\ ]+$/).test(title);
    const titleRegEx = /^(?!a|A|the|The|THE).*/;
    titleRegEx.test(title) ? null : (upper ? title = ('THE ').concat(title) : title = ('the ').concat(title));
    ss.toast('The winner of ' + title + ' is: ' + namesFiltered[0] + '!');
    for (let a = 0; a < names.length; a++) {
      if (points[a] == pointsFiltered[0]) {
        let row = namesRange.getRow();
        let col = namesRange.getColumn();
        let sheet = namesRange.getSheet();
        multiple ? sheet.getRange(row,col+a).setValue('CO-CHAMP: ' + names[a]) : sheet.getRange(row,col+a).setValue('CHAMPION: ' + names[a]);
      }
    }
    sleeperLiveScoringOff();

  }

}

function complete() {
  const year = seasonInfo('year');
  const matchupWeek = fetchWeek();
  const teams = fetchTeams(true); //returns two arrays, away teams and home teams
  const awayTeams = teams[0];
  const homeTeams = teams[1];
  const url = 'https://api.sleeper.com/schedule/nfl/regular/' + year;
  const obj = JSON.parse(UrlFetchApp.fetch(url));
  const matchups = obj.filter(matchup => (matchup.week == matchupWeek && awayTeams.indexOf(matchup.away) >= 0 && homeTeams.indexOf(matchup.home) >= 0));
  let check = matchups.length == awayTeams.length;
  if (!check) {
    Logger.log('\'complete\' function: issue with the teams in the CONFIG not being found for the provided week when checking for game completion');
    ss.toast('There\'s an issue with the teams in the CONFIG not being found for the provided week when checking for game completion');
  }
  done = true;
  for (let a = 0; a < matchups.length; a++) {
    matchups[a].status != 'complete' ? done = false : null;
  }
  return done;
}

// 2024 - Created by Ben Powers
// ben.powers.creative@gmail.com
