/** GOOGLE SHEETS WEEKLY FANTASY FOOTBALL PLATFORM TOOL
 * Single week or day drafting and scoring for NFL games
 * v1.1
 * 11/22/2024
 * 
 * Created by Ben Powers
 * ben.powers.creative@gmail.com
 * 
 * ------------------------------------------------------------------------
 * DESCRIPTION:
 * This Google Sheet and accompanying script file will let you draft a team and play fantasy football
 * for a single game, single day, or single week of the NFL regular season.
 * 
 * This is a fun tool to make the Thanksgiving, Christmas, or just any day/week of the NFL more entertaining.
 * Find some friends and load up the spreadsheet (ideally granting them view-only access).
 * Input owners, team names, position counts, week, and day, then select which games to include.
 * Allows to duplicate players in the player pool if the ratio of QBs to owners is restrictive, for instance.
 * A draft order randomizer is included, or you could manually enter the order.
 *  
 * ------------------------------------------------------------------------
 * INSTRUCTIONS:
 * If you're reading this, you've made it to the Apps Script console. Simply click "Run" at the top of this page (with the "runFirst" script selected in the box that by default says "onOpen").
 * 1. You'll be prompted by a permission request of "Authorization required", select "Review permissions"
 * 2. Next select your Google account
 * 3. A box that "Google hasn’t verified this app" will appear, click the "Advanced" text in the lower left
 * 4. Next select "Go to Google Sheets Weekly FF Scripts (unsafe)" <-- I promise there isn't anything malicious in here!
 * 5. Next it will say that "Google Sheets Weekly FF Scripts wants to access your Google Account", Select "Allow"
 * 6. Go back to the Sheet, which should now have two new menus present at the top
 * 
 * ------------------------------------------------------------------------
 * USAGE:
 * Football Tools Menu
 * 
 *  - Initial Setup - this function will configure the draft board and player pool based on your selection,
 * as well as randomize the draft order if you haven't entered one manually
 * 
 *  - Refresh Players - this will fetch the current active players for the teams included in the game, 
 * including projections and the previous week's scoring
 *  
 *  - Recreate Triggers - should not be needed, but if things aren't working when performing the draft, run this script
 * 
 *  - Update NFL Schedule - the schedule should be pulled upon running the initial script, but you can force it to update 
 * if the NFL has changed the schedule since it was first imported into your sheet
 * 
 * Scoring Sub-Menu
 *  
 *  - Get Scores - pulls all current scores for players (both completed and in-progress games)
 * 
 *  - Live Scoring ("ON" and "OFF"), you can enable or disable live scoring, which is a trigger that runs
 * every 5 minutes to automatically pull scoring.
 * ------------------------------------------------------------------------
 * 
 * If you're feeling generous and would like to support my work, you can support my wife, five kiddos, and me:
 * https://www.buymeacoffee.com/benpowers
 * 
 * Thanks for checking out the script!
 * 
 * **/


function onOpen() {
  var ui = SpreadsheetApp.getUi();

  // Check if the script is already authorized
  if (!isScriptAuthorized()) {
    // If not authorized, create a menu item to run the authorization function
    ui.createMenu('Football Tools')
      .addItem('Authorize Script', 'authorizeScript')
      .addToUi();
  }
}

function isScriptAuthorized() {
  var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
  return authInfo.getAuthorizationStatus() === ScriptApp.AuthorizationStatus.LIMITED;
}

function authorizeScript() {
  var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);

  if (authInfo.getAuthorizationStatus() === ScriptApp.AuthorizationStatus.REQUIRED) {
    // Display a dialog prompting the user to authorize the script
    var authorizationUrl = authInfo.getAuthorizationUrl();
    var htmlOutput = HtmlService.createHtmlOutput('<p>Please authorize the script:</p><a href="' + authorizationUrl + '" target="_blank">Authorize</a>');
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Authorization Required');
  } else {
    // Authorization is already granted
    SpreadsheetApp.getUi().alert('Script is authorized.');
  }
  runFirst();
}

function runFirst() {
  // Deletes any existing triggers
  deleteTriggers();

  // Creates a trigger to automatically load the toolbars upon opening
  createOnOpen();
  toolbar('first');

  // Gathers NFL matchups for season
  fetchNFL();
  
  const week = seasonInfo('week');
  SpreadsheetApp.getActiveSpreadsheet().getRangeByName('WEEK').setValue(week);

  const ui = SpreadsheetApp.getUi();
  ui.alert('Congratulations!\r\n\r\nYou\'ve successfully enabled the scripts to run and imported the NFL schedule data.\r\n\r\n1. Format is Half PPR by default (select PPR or Standard if desired)\r\n2. Select which NFL regular season week to use games from (likely week ' + week + ')\r\n3. Select preferred day or leave as \"All\"\r\n4. Enter values for owners and team names\r\n5. Pick from the available NFL games\r\n6. Pick which positions you want to use\r\n7. Select which positional players to have duplicate copies\r\n8. Go to the \"Football Tools\" menu and select \"Setup\"\r\n9. Have fun!', ui.ButtonSet.OK);

}
