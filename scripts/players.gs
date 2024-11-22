// WEEKLY FF PLAYERS - Updated 11.22.2024
function players(selectedWeek){
  // Set min projected score to be included in dataset
  let cutoff = 1;

  // Fetch JSON object from Sleeper's API
  let json = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/players/nfl'));
  
  // Gets spreadsheet and sheet (creates if not existing)
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PLAYERS');
  if (sheet == null) {
    ss.insertSheet('PLAYERS');
    sheet = ss.getSheetByName('PLAYERS');
  }
  
  const teams = fetchTeams();

  // Initial variables -- look at notes to customize
  let arr = [];
  let data = [];
  
  let format = fetchFormat();
  format == 'HALF PPR' ? format = 'HALF' : null;
  const year = seasonInfo('year');
  const week = fetchWeek(); 
  selectedWeek = selectedWeek || week;
  const available = selectedWeek == week ? true : false;
  let positions = ['QB','RB','WR','TE','K','DEF'];
  for (let a = positions.length-1; a > 0; a--) {
    if (ss.getRangeByName('COUNT_'+positions[a]).getValue() == 0) {
      positions.splice(a,1);
    }
  }

  // Fetch images from Fantasy Pros site with function below
  // let images = fantasyProsImages(positions);

  // Fetch NFL logos (for team defenses);
  const logos = fetchLogos();

  // Fetch previous scoring from Sleeper stats
  let score, previous, previousTwo;
  score = sleeperScoring(format,week);
  week > 1 ? previous = sleeperScoring(format,week-1) : null;
  week > 2 ? previousTwo = sleeperScoring(format,week-2) : null;
  
  if (positions.indexOf('RB') > -1) {
    positions.splice(positions.indexOf('RB')+1,0,'FB');
  }

  let slpr = {};
  // try{
    Logger.log('Fetching projections from Sleeper...');
    slpr = slprProjectionFetch(format,selectedWeek,year);
    Logger.log('Done');
  // }
  // catch (err){
  //   Logger.log('Sleeper Projections Failed ' + err)
  // }
  let espn = {};
  let fp = {};
  let injury = {};
  if (available) {
    try {
      Logger.log('Fetching projections and outlooks from ESPN...');
      espn = espnFetch(format,week,year);
      Logger.log('Done');
    }
    catch (err){
      Logger.log('ESPN Projections Failed ' + err);
    }    
    try {
      Logger.log('Fetching projections from Fantasy Pros...');
      fp = fpProjectionFetch(format);
      Logger.log('Done');
    }
    catch (err){
      Logger.log('FP Projections Failed ' + err);
    }
    try {
      Logger.log('Fetching practice reports, injuries, and official injury designations...');
      injury = filterInjuries();
      Logger.log('Done');
    }
    catch (err){
      Logger.log('Injury Fetching Failed ' + err);
    }
  } else {
    Logger.log('Current week and selected week are not the same, no FP projects, ESPN projections/outlooks, or injury designations fetched.');
  }

  // Modify these as needed
  const dataPoints = {
    'player_id':{'width':50,'hide':false,'named_range':true},
    'full_name':{'width':170,'hide':false,'named_range':true},
    // 'last_name':{'width':100,'hide':false,'named_range':true},
    // 'first_name':{'width':100,'hide':false,'named_range':true},
    'team':{'width':50,'hide':false,'named_range':true},
    // 'height':{'width':50,'hide':false,'named_range':true},
    // 'weight':{'width':50,'hide':false,'named_range':true},
    // 'age':{'width':50,'hide':false,'named_range':true},
    // 'birth_date':{'width':50,'hide':false,'named_range':true},
    // 'years_exp':{'width':50,'hide':false,'named_range':true},
    // 'position':{'width':50,'hide':true,'named_range':false},
    'fantasy_positions':{'width':50,'hide':false,'named_range':true},
    // 'depth_chart_position':{'width':50,'hide':true,'named_range':false},
    'depth_chart_order':{'width':50,'hide':false,'named_range':true},
    // 'number':{'width':50,'hide':true,'named_range':false},
    // 'college':{'width':50,'hide':true,'named_range':false},
    // 'status':{'width':50,'hide':true,'named_range':false},
    // 'active':{'width':50,'hide':true,'named_range':false},
    'espn_id':{'width':50,'hide':false,'named_range':true},
    // 'yahoo_id':{'width':50,'hide':false,'named_range':true},
    // 'rotowire_id':{'width':50,'hide':true,'named_range':false},
    // 'rotoworld_id':{'width':50,'hide':true,'named_range':false},
    // 'fantasy_data_id':{'width':50,'hide':false,'named_range':false},
    // 'gsis_id':{'width':50,'hide':true,'named_range':false},
    // 'sportradar_id':{'width':50,'hide':true,'named_range':false},
    // 'stats_id':{'width':50,'hide':true,'named_range':false},
    // 'news_updated':{'width':50,'hide':true,'named_range':false}
    'proj':{'width':50,'hide':false,'named_range':true},
    'proj_espn':{'width':50,'hide':false,'named_range':true},
    'proj_fp':{'width':50,'hide':false,'named_range':true},
    // 'proj_ff':{'width':50,'hide':false,'named_range':true},
    'previous':{'width':50,'hide':false,'named_range':true},
    'score':{'width':50,'hide':false,'named_range':true},
    'injury_status':{'width':50,'hide':false,'named_range':true},
    // 'injury_start_date':{'width':50,'hide':true,'named_range':false},
    // 'injury_body_part':{'width':50,'hide':true,'named_range':false},
    // 'injury_notes':{'width':50,'hide':true,'named_range':false},
    'injury':{'width':300,'hide':false,'named_range':true},
    'image':{'width':500,'hide':true,'named_range':true},
    'outlook':{'width':1000,'hide':true,'named_range':true}
  };
  
  // Defense ESPN IDs (Sleeper API lacks these)
  const espnIds = {
    'ARI':-16022,'ATL':-16001,'BAL':-16033,'BUF':-16002,'CAR':-16029,'CHI':-16003,'CIN':-16004,'CLE':-16005,'DAL':-16006,'DEN':-16007,'DET':-16008,'GB':-16009,
    'HOU':-16034,'IND':-16011,'JAX':-16030,'KC':-16012,'LV':-16013,'LAC':-16024,'LAR':-16014,'MIA':-16015,'MIN':-16016,'NE':-16017,'NO':-16018,'NYG':-16019,
    'NYJ':-16020,'PHI':-16021,'PIT':-16023,'SF':-16025,'SEA':-16026,'TB':-16027,'TEN':-16010,'WAS':-16028
  };
  // Injury status shorthand for easier representation in cells
  const injuries = {
    'Questionable':'Q',
    'Doubtful':'D',
    'Out':'O',
    'IR':'IR',
    'PUP':'PUP',
    'COV':'COV',
    'NA':'NA',
    'Sus':'SUS',
    'DNR':'DNR'
  };
  
  // Creates an array of the header values to use
  let headers = [];
  for (let a = 0; a < Object.keys(dataPoints).length; a++){
    headers.push(Object.keys(dataPoints)[a]);
  }
  
  // Sets the header values to the first row of the array 'keys' to be written to the sheet
  data.push(headers);
  let z = 1; 
  let x = 1;
  // Loops through all 'key' entries (players) in the JSON object that was fetched
  Object.keys(json).forEach(key => {
    try {
      // First if statement checks if the player is one of the selected positions (other than DEF)
      if ( slpr[json[key]['player_id']] >= cutoff && positions.indexOf(json[key].position) >= 0 && teams.indexOf(json[key]['team']) >= 0 ) {
        if ( json[key]['status'] == 'Active' || json[key].position == 'DEF' ) {
          let name = json[key]['first_name'] + ' ' + json[key]['last_name'];
          for ( let col = 0; col < Object.keys(dataPoints).length; col++ ) {
            if ( Object.keys(dataPoints)[col] == 'full_name' ) {
              // Creates the full name entry alongside the first/last entries in the JSON data
              arr.push(name);
            } else if (Object.keys(dataPoints)[col] == 'espn_id') {
              if ( json[key].position == 'DEF' ) {
                // Adds ESPN id
                let id = espnIds[json[key]['player_id']];
                if (id == null) {
                  arr.push('');
                } else {
                  arr.push(id);
                }
              } else {
                let id = espnId(json[key]['player_id']);
                if (id != null){
                  arr.push(id);
                } else {
                  arr.push('');
                }
              }
            } else if ( Object.keys(dataPoints)[col] == 'injury_status') {
              if ( json[key][Object.keys(dataPoints)[col]] == null && injury[json[key]['player_id']] == null) {
                // Pushes a 'G' for 'good' to any player without an injury tag
                arr.push('G');
              } else if (injury[json[key]['player_id']] != null) {
                if (injury[json[key]['player_id']].status == '') {
                  // If the player is listed on the injury report at all, it will default to giving that player a 'Q'
                  arr.push('Q');
                } else {
                  arr.push(injury[json[key]['player_id']].status.charAt(0));
                }
              } else {
                // If player has injury designation, assigns the shorthand to that player
                arr.push(injuries[json[key][Object.keys(dataPoints)[col]]]);
              }
            } else if ( json[key][Object.keys(dataPoints)[col]] != null ) {
              // Once the above conditions are not met, this part cycles through all the values in the 'headers' array above
              arr.push(json[key][Object.keys(dataPoints)[col]]);
            } else if ( Object.keys(dataPoints)[col] == 'proj') {
              arr.push(slpr[json[key]['player_id']]);
            } else if ( Object.keys(dataPoints)[col] == 'proj_espn' ) {
              if (available) {
                try {
                  arr.push(espn[json[key]['player_id']].points);
                }
                catch (err) {
                  Logger.log('No ESPN Projection for ' + name);
                  try {
                    let avg = [];
                    slpr[json[key]['player_id']] != null ? avg.push(slpr[json[key]['player_id']]) : null;
                    fp[json[key]['player_id']] != null ? avg.push(fp[json[key]['player_id']]) : null;
                    // projFF[json[key]['player_id']] != null ? avg.push(projFF[json[key]['player_id']]) : null;
                    let sum = 0;
                    for (let p = 0; p < avg.length; p++) {
                      sum = parseFloat(sum) + parseFloat(avg[p]);
                    }
                    arr.push((sum/avg.length).toFixed(2));
                  }
                  catch (err) {
                    Logger.log('Missing either Sleeper or FP projection for ' + name);
                    try {
                      arr.push(slpr[json[key]['player_id']]);
                    }
                    catch (err) {
                      Logger.log('Missing Sleeper projection for ' + name)
                      try {
                        arr.push(fp[json[key]['player_id']])
                      }
                      catch (err) {
                        Logger.log('No player projections available for ' + name);
                        arr.push('');
                      }
                    }
                  }                
                }
              } else {
                arr.push('');
              }
            } else if ( Object.keys(dataPoints)[col] == 'proj_fp') {
              if (available) {
                arr.push(fp[json[key]['player_id']]);
              } else {
                arr.push('');
              }
            } else if ( Object.keys(dataPoints)[col] == 'previous') {
              if(previous[json[key]['player_id']] == null || previous[json[key]['player_id']] == undefined) {
                if(previousTwo[json[key]['player_id']] == null == previousTwo[json[key]['player_id']] == undefined) {
                  arr.push('NA');
                } else {
                  arr.push(previousTwo[json[key]['player_id']]);
                }
              } else {
                arr.push(previous[json[key]['player_id']]);
              }
            } else if ( Object.keys(dataPoints)[col] == 'score') {
              if(score[json[key]['player_id']] == null) {
                arr.push('');
              } else {
                arr.push(score[json[key]['player_id']])
              }
            } else if ( Object.keys(dataPoints)[col] == 'image') {
              if (json[key].position == 'DEF') {
                arr.push(logos[json[key]['team']]);
              } else {
                arr.push('https://sleepercdn.com/content/nfl/players/thumb/' + json[key]['player_id'] + '.jpg');
              }
              // could use checking, this is a placeholder image: 'https://images.fantasypros.com/images/players/nfl/missing/headshot/210x210.webp'
            } else if ( Object.keys(dataPoints)[col] == 'injury') {
              if(injury[json[key]['player_id']] == null) {
                arr.push('');
              } else {
                let injured = injury[json[key]['player_id']];
                let string = '';
                if (injured.practice == '') {
                  string = 'NO INFO';
                } else {
                  string = injured.practice;
                }
                
                if (injured.injury != '') {
                  string = string.concat(': ' + injured.injury);
                }
                
                if (injured.status != '') {
                  string = string + ' (' + injured.status.toUpperCase() + ')';
                }
                
                arr.push(string);
              }
            } else if ( Object.keys(dataPoints)[col] == 'depth_chart_order') {
              if (json[key].position == 'DEF') {
                arr.push(1);
              } else {
                arr.push(json[key][Object.keys(dataPoints)[col]]);
              }
            } else if ( Object.keys(dataPoints)[col] == 'outlook') {
              try {
                arr.push(espn[key].outlook);
              }
              catch (err) {
                arr.push('');
              }
            } else {
              // If there is a null value, it pushes a blank entry to the array
              arr.push('');
            }
          }
        }
      }
      if (arr.length > 0) {
        // so long as the array mapped values, it pushes the array into the array ('data') of arrays
        data.push(arr);
        // resets the 'arr' variable to start over
        arr = [];
      }
    } catch (err) {
      ss.toast('Error bringing in data');
    }
  });

  // Clear the sheet for new data
  sheet.clear();

  // Gets range for setting data and headers
  let playerTable = sheet.getRange(1,1,data.length,data[0].length);
  // Sets data in place
  playerTable.setValues(data);
  // Sorts based on 
  sheet.getRange(2,1,data.length-1,data[0].length).sort([{column: headers.indexOf('proj')+1, ascending: false}]);
  
  // Creates named ranges for doing VLOOKUP functions in Google Sheets; only for keys in 'headers' object tagged with 'true' for 'named_range'
  for (let col = 0; col < Object.keys(dataPoints).length; col++ ) {
    if (dataPoints[Object.keys(dataPoints)[col]]['named_range'] == true) {
      ss.setNamedRange('SLPR_' + headers[col].toUpperCase(),sheet.getRange(2,col+1,data.length-1,1));
    }
  }

  // Hides columns and aligns data in cells
  for (let col = 0; col < Object.keys(dataPoints).length; col++ ) {
    sheet.setColumnWidth(col+1,dataPoints[Object.keys(dataPoints)[col]]['width']);
    if (dataPoints[Object.keys(dataPoints)[col]]['hide'] == true){
      sheet.hideColumns(col+1,1);
    } else {
      sheet.unhideColumn(sheet.getRange(1,col+1,sheet.getMaxRows(),1));
    }
  }
  
  // Notification text creation
  let positionsString = '';
  if (positions.indexOf('FB') >= 0) {
    positions.splice(positions.indexOf('FB'),1);
  }
  for (let a = 0; a < positions.length; a++) {
    if (positions[a+2] == undefined) {
      positionsString = positionsString.concat(' and ' + positions[a]);
    } else {
      positionsString = positionsString.concat(positions[a] + ', ');
    }
  }
  ss.toast('All Sleeper player data imported successfully for ' + positionsString);

  // Update for correct rows
  let maxRows = sheet.getMaxRows();
  let rows = data.length;
  adjustRows(sheet,rows);

  // Update for correct columns
  let maxCols = sheet.getMaxColumns();
  let columns = data[0].length;
  adjustColumns(sheet,columns);

  let alignments = sheet.getRange(1,1,data.length,data[0].length);
  alignments.setHorizontalAlignment('left');

  // Locks data on sheet
  sheet.protect(); 
}

//-------------------------------------------------------------
// SLEEPER League-Specific Projections
function slprProjectionFetch(format,week,year) {
  const scoring = leagueInfo(dummyLeagueSleeper(format),'scoring');
  if ( year == undefined || year == null ){
    year = seasonInfo('year');
  }
  if ( week == undefined || week == null ){
    week = fetchWeek();  
  }

  const obj = JSON.parse(UrlFetchApp.fetch( 'https://api.sleeper.app/projections/nfl/'+year+'/'+week+'?season_type=regular&position[]=DEF&position[]=FLEX&position[]=QB&position[]=RB&position[]=TE&position[]=WR&position[]=K&order_by=player_id'));
  const players = obj.length;
  let a;
  let score;
  let slprProjections = {};
  for (a = 0; a < players; a++) {
    score = 0;
    let id = obj[a]['player_id'];
    for (let keys in scoring) {
      if ( isNaN(parseFloat(obj[a]['stats'][keys])*parseFloat(scoring[keys])) == false && parseFloat(obj[a]['stats'][keys]) != null ) {
        score = score + parseFloat(obj[a]['stats'][keys])*parseFloat(scoring[keys]);
      }
    }
    slprProjections[id] = score.toFixed(2);
  }
  // Logger.log(slprProjections);
  return slprProjections;
}

//-------------------------------------------------------------
// FUNCTION TO FETCH OBJECT OF ESPN PROJECTIONS
function espnFetch(format,week,year){
  (week == undefined || week == null) ? week = seasonInfo('week') : null;
  (year == undefined || year == null) ? year = seasonInfo('year') : null;
  const leagueId = dummyLeagueESPN(format);

  const teams = fetchTeams();
  const playersObj = Object.values(JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/players/nfl')));
  const espnIds = espnRookieId('obj');
  let slprId, pos, team, name, player, espnIdNum, nameSearch;
  // ESPN PROJECTION FETCHING
  const byes = nflByeWeeks(year);
  let espnData = {};
  const urlBase = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/' + year + '/segments/0/leagues/';
  const urlTail = '?&view=kona_player_info&scoringPeriodId=';
  const options = { "headers": {"x-fantasy-filter": JSON.stringify({ "players": { "limit": 1500, "sortDraftRanks": { "sortPriority": 100, "sortAsc": true, "value": "PPR" } } })}};
  let obj = JSON.parse(UrlFetchApp.fetch(urlBase + leagueId + urlTail + week,options).getContentText()).players; 
  Object.keys(obj).forEach( key => {
    pos = espnPositionId(obj[key].player.defaultPositionId);
    if (pos == "QB" || pos == "RB" || pos == "WR" || pos == "TE" || pos == "DEF" || pos == "K"){
      team = espnProTeamId(obj[key].player.proTeamId);
      if (teams.indexOf(team) >= 0) {
        name = obj[key].player.fullName;
        espnIdNum = obj[key].player.id;
        slprId = null;
        if (pos === 'DEF'){
          slprId = team;
        }
        if (slprId == null) {
          try{
            slprId = playersObj.find(x => x.espn_id === espnIdNum).player_id;
          }
          catch (err){
            try {
              slprId = nameFinder(name);
            } catch (err) {
              try{
                slprId = getKeyByValue(espnIds,parseInt(espnId));
                if (slprId == null) {
                  nameSearch = name.replace(/(\ III)|(\ II)|(\ IV)|(Jr\.)|(Sr\.)/g,'');
                  nameSearch = nameSearch.toLowerCase().replace(/(\ )|(\-)|(\\)|(\.)|(\')/g,'');
                  for (let player in playersObj) {
                    if (playersObj[player].search_full_name == nameSearch) {
                      slprId = playersObj[player].player_id;
                    }
                  }
                  if (slprId == null || slprId == undefined) {
                    Logger.log('ESPN Projection Fetch: Could not find value for ' + name + ' and search ' + nameSearch + ' ' + slprId + ' and searchable is ' + playersObj[player]['search_full_name']);
                  }
                }
              }
              catch (err){
                Logger.log('ESPN Projection Fetch ' + err + ' ' + name + ' ' + key);
              }
            }
          }
        }
        if (slprId != null && team != null && byes[team] != week) {
          let points,outlook;
          try {
            points = parseInt(100*(obj[key].player.stats).find(x => x.id === ('11'+year+week)).appliedTotal)/100;
          }
          catch (err){
            // Logger.log('ESPN Projection Fetch Issue for ' + name + ' (' + err + ')');
          }
          try {
            outlook = obj[key].player.outlooks.outlooksByWeek[week];
            espnData[slprId] = {
              'outlook':outlook
            };
          }
          catch (err){
            // Logger.log('ESPN Outlook Fetch Issue for ' + name + ' (' + err + ')');
          }
          espnData[slprId] = {
            'points':points,
            'outlook':outlook,
          }
        }
      }
    }
  });
  return espnData;
}

//-------------------------------------------------------------
// FUNCTION TO FETCH OBJECT OF FP PROJECTIONS
function fpProjectionFetch(format) {
  if (format == undefined){
    format = 'HALF';
  } else if (format == 'FULL'){
    format = 'PPR';
  }
  const playersObj = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/players/nfl'));
  let playersNames = [];
  let playersIds = [];
  for (let key in playersObj){
    if ( playersObj[key]['fantasy_positions'] == 'DEF'){
      playersNames.push(playersObj[key]['first_name'] + ' ' + playersObj[key]['last_name']);
      playersIds.push(playersObj[key]['player_id']);
    } else if ( playersObj[key]['fantasy_positions'] == 'QB' ||  playersObj[key]['fantasy_positions'] == 'RB' ||  playersObj[key]['fantasy_positions'] == 'WR' ||  playersObj[key]['fantasy_positions'] == 'TE' ||  playersObj[key]['fantasy_positions'] == 'K') {
      playersNames.push(playersObj[key]['first_name'] + ' ' + playersObj[key]['last_name']);
      playersIds.push(playersObj[key]['player_id']);
    }    
  }
  let obj = {};
  let url, table, count, output = [], values = [], missed = [], name, id, points, len;
  let baseUrl = 'https://www.fantasypros.com/nfl/projections';
  let positionList = ['qb', 'rb', 'wr', 'te', 'dst', 'k'];
  for (let b = 0 ; b < positionList.length ; b++) {
    //https://www.fantasypros.com/nfl/projections/qb.php
    url = (baseUrl+'/'+positionList[b]+'.php');
    if (['rb','wr','te'].indexOf(positionList[b]) >= 0) {
      url = url.concat('?scoring=' + format );
    }
    table = UrlFetchApp.fetch(url).getContentText();
    table = table.substring(table.indexOf('<table cellpadding="0" cellspacing="0" border="0" id="data"') - 1).split('</table>')[0].split('<tbody>')[1].split('</tbody>')[0].split('<tr class=').slice(1);
    
    count = table.length;
    for (let c = 0 ; c < count ; c++) {
      arr = [];
      id = table[c].match(/fp\-id\-[0-9]+/g);
      id = id[0].substring(6);
      values = table[c].split('<td class');
      len = values.length;
      values = values[len-1].split('"');
      len = values.length;
      points = values[len-1].match(/[0-9\.]+/g)[0];
      name = table[c].split('fp-player-name="')[1].split('</a>')[0];
      name = name.split('">')[1];
      
      let skip = false;
      nameFound = nameFinder(name);
      if ( nameFound == null ) {
          missed.push(name);
          skip = true;
      }
      if (positionList[b] != 'dst'){
        nameFound = parseInt(nameFound);
      }
      if ( skip == false) {
        obj[nameFound] = points;
      }
    }
  }
    
  if ( output.length > 0 ) {
    Logger.log('These players missed: ' + output);
  } else {
    Logger.log('All FP Players matched');
  }
  return obj;
}

// 2024 - Created by Ben Powers
// ben.powers.creative@gmail.com
