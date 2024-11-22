// WEEKLY FF DRAFT - Updated 11.22.2024

// DRAFT SETUP
// Function to remake "PICKS" (table), "DRAFT" (display of snake draft), and "ROSTERS" sheets for new configuration data
function draftSetup() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  let valid = setupCheck();

  if (valid) {
    deleteTriggers();
    let positionsRanges = ['QB','RB','WR','TE','FLX','SPFLX','DEF','K'];
    let positionArr = [];
    let positionDraftList = [];
    let quantity;
    for ( let a = 0; a < positionsRanges.length; a++ ) {
      quantity = ss.getRangeByName('COUNT_' + positionsRanges[a]).getValue();
      positionArr.push(quantity);
      for ( let b = 1; b <= quantity; b++ ) {
        positionDraftList.push(positionsRanges[a]);
      }
    }  

    let positions = positionDraftList.length;
    let existing = existingDraft();
    let active = existing[0] > 0;
    let completed = (existing[1] == 0 && existing[0] > 0);
    let backup, failed, promptText = '';
    if (completed) {
      backup = ui.alert('It looks like your draft board has been populate by a previous draft.\r\n\r\nDo you want to make a copy before proceeding?',ui.ButtonSet.YES_NO_CANCEL)
    }
    if (backup == 'YES') {
      try {
        let sheetName;
        try {
          let namedRanges = ss.getNamedRanges();
          for(let a = 0; a < namedRanges.length; a++){
            if (namedRanges[a].getRange().getSheet().getName() == 'ROSTERS') {
              namedRanges[a].remove();
            }
          }
        }
        catch (err) {
          Logger.log('\"ROSTERS\" backup failed to remove existing named ranges');
        }
        let sheetNames = ss.getSheets().map(sheet => sheet.getName());
        let rosterSheets = sheetNames.filter(sheetName => /^ROSTERS_\d{2}$/.test(sheetName));
        if (rosterSheets.length === 0) {
          Logger.log('No matching sheets found.');
          sheetName = 'ROSTERS_01';
        } else {
          let highestIndex = Math.max(...rosterSheets.map(sheetName => parseInt(sheetName.match(/\d{2}$/)[0], 10)));
          let index = highestIndex;
          highestIndex < 9 ? index = '0' + (index+1) : index++;
          sheetName = 'ROSTERS_' + index;
        }
        ss.getSheetByName('ROSTERS').copyTo(ss).setName(sheetName);
        ss.toast('Backed up previous draft to \"' + sheetName + '\".');
      }
      catch (err) {
        Logger.log(err.stack)
        failed = ui.alert('Error encounter while trying to copy over existing \"ROSTERS\" sheet.\r\n\r\nWould you still like to continue?', ui.ButtonSet.YES_NO);
      }
      if (failed == 'NO') {
        ss.toast('Canceled setup');
        Logger.log('Canceled setup')
        return null;
      }
    }
    let prompt;
    promptText = active ? 'Reset draft board and start new draft?' : 'Set up the draft board for a new draft?';
    if ( backup == 'YES' || !completed ) {
      prompt = ui.alert(promptText, ui.ButtonSet.OK_CANCEL );
    } else {
      prompt = 'OK';
    }
    if ( prompt == 'OK' ) {
      let checkboxes = ss.getRangeByName('DRAFT_CHECKBOXES').getValues();
      let draftBoard = ss.getSheetByName('DRAFT_LOBBY');
      ss.getRangeByName('DRAFT_CHECKBOXES').clearContent();
      draftBoard.showRows(3,checkboxes.length);
      let draftersImport = ss.getRangeByName('DRAFTERS').getValues().flat();
      let draftersImportTeamNames = ss.getRangeByName('DRAFTERS_TEAM_NAMES').getValues().flat();
      let draftersImportManual = ss.getRangeByName('DRAFTERS_MANUAL_ORDER').getValues().flat();
      let drafters = [];
      let draftersTeamNames = [];
      let draftersManual = [];
      let a, b, c, teamName, rows, cols, full, topRow, rowMultiplier, rowAdditional, range;
      for ( let a = 0; a < draftersImport.length; a++ ) {
        if ( draftersImport[a] != '' ) {
          drafters.push(draftersImport[a]);
        }
      }
      let count = drafters.length;
      let style = 'random';
      for ( a = 0; a < draftersImportManual.length; a++ ) {
        if ( draftersImportManual[a] != '' ) {
          draftersManual.push(draftersImportManual[a]);
        }
      }
      let countManual = draftersManual.length;
      if ( count == countManual ) {
        style = 'manual';
        drafters = draftersManual;
        prompt = ui.alert('Using Manually Entered Drafters. (Clear manual row of CONFIG sheet and rerun script to randomize)', ui.ButtonSet.OK_CANCEL);
      } else {
        // Code that randomizes drafters
        for (a = drafters.length - 1; a > 0; a--) {
          b = Math.floor(Math.random() * (a + 1));
          c = drafters[a];
          drafters[a] = drafters[b];
          drafters[b] = c;
        }
        prompt = 'OK';
      }
      // Setting team name array
      for ( let a = 0; a < drafters.length; a++ ) {
        teamName = draftersImportTeamNames[draftersImport.indexOf(drafters[a])];
        if ( teamName == '' ) {
          teamName = 'Team ' + drafters[a];
        }
        draftersTeamNames[a] = teamName;
      }
      
      // Updates all the player information and available pool of players
      playersRefresh(1);

      injuryCheck();
      ss.toast('Updated player pool, projections, and outlooks for players');

      if ( prompt == 'OK' ) {

        const trr = ss.getRangeByName('CONFIG_TRR').getValue();

        if ( style == 'random' ) {
          prompt = ui.alert('Reveal randomized order sequentially?', ui.ButtonSet.YES_NO);
          if ( prompt == 'YES' ) {
            for ( a = (count-1); a >= 0; a-- ) {
              prompt = ui.alert((a+1) + ': ' + draftersTeamNames[a] + '\r\n\r\nunder the direction of ' + drafters[a], ui.ButtonSet.OK);
            }
          } else {
            let text = 'DRAFT ORDER:\r\n\r\n';
            for ( a = 0; a < count; a++ ) {
              text = text.concat((a+1) + ': ' + draftersTeamNames[a] + ' [' + drafters[a]  + ']\r\n');
            }
            prompt = ui.alert(text, ui.ButtonSet.OK);
          }
        }
        let picker = drafters[0];
        let onDeck = drafters[1];
        let totalDrafters = drafters.length;
        positions = parseInt(positions,10);
        let sheet;
        
        let draftSheetName = 'DRAFT';
        let rostersSheetName = 'ROSTERS';
        let picksSheetName = 'PICKS';
        let draftSheet = ss.getSheetByName(draftSheetName);
        let rostersSheet = ss.getSheetByName(rostersSheetName);
        let picksSheet = ss.getSheetByName(picksSheetName);
        let sheetNames = [draftSheetName,rostersSheetName,picksSheetName];
        const darkNavy = '#222735';
        const lightGray = '#E5E5E5';
        for ( a = 0; a < sheetNames.length; a++ ) {
          if ( ss.getSheetByName(sheetNames[a]) == null ) {
            ss.insertSheet(sheetNames[a]);
            draftSheet = ss.getSheetByName(sheetNames[a]);
          }
          sheet = ss.getSheetByName(sheetNames[a]);
          
          if ( sheetNames[a] == 'DRAFT' ) {
            rowMultiplier = 3;
            rowAdditional = 2;
            cols = count + 1;
          } else if ( sheetNames[a] == 'ROSTERS' ) {
            rowMultiplier = 3;
            rowAdditional = 2;
            cols = count*3 + 1;
          } else if ( sheetNames[a] == 'PICKS' ) {
            cols = 8 + positionDraftList.length;
            rows = count*positions+3;
            rowMultiplier = 1;
            rowAdditional = 1;
          }
          
          // Format draft board to be the correct size
          sheet.clear();
          
          let maxCols = sheet.getMaxColumns();
          if ( cols < maxCols ) {
            sheet.deleteColumns(cols, maxCols - cols);
          } else if ( cols > maxCols ) {
            sheet.insertColumnsAfter(maxCols, cols - maxCols);
          }
          maxCols = sheet.getMaxColumns();
          
          let maxRows = sheet.getMaxRows();
          if ( sheetNames[a] != 'PICKS') {
            rows = positions * rowMultiplier + rowAdditional;
          }
          if ( rows < maxRows ) {
            sheet.deleteRows(rows, maxRows - (rows));
          } else if ( rows > maxRows ) {
            sheet.insertRowsAfter(maxRows, (rows) - maxRows);
          }
          maxRows = sheet.getMaxRows();
          if ( sheetNames[a] == 'ROSTERS' ) {
            sheet.insertRowsAfter(maxRows, 4);
            maxRows = sheet.getMaxRows();
          }
          
          if ( sheetNames[a] == 'DRAFT' || sheetNames[a] == 'ROSTERS' ) {
            sheet.setRowHeight(1,35)
              .setRowHeight(2,25)
              .setRowHeights(3,rows-2,25)
              .setColumnWidth(1,65)
              .setColumnWidths(2,cols-1,120);
            full = sheet.getRange(1,1,maxRows,maxCols);
            
            ss.setNamedRange('FULL',full);
            full.breakApart()
              .setFontSize(18)
              .setBackground('white') // formerly '#283244'
              .setFontColor(darkNavy)
              .setHorizontalAlignment('center')
              .setVerticalAlignment('middle')
              .setBorder(true,true,true,true,false,false,darkNavy,SpreadsheetApp.BorderStyle.SOLID_THICK);
            sheet.getRange(1,2,1,maxCols-1).setBackground('#FFD900'); // Bright Yellow
            sheet.getRange(2,2,1,maxCols-1).setBackground('#FFF1A2'); // Desaturated Yellow
            let topCorner = sheet.getRange(1,1,2,1);
            topCorner.setBackground(darkNavy)
              .merge()
              .setHorizontalAlignment('center')
              .setVerticalAlignment('middle')
              .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
            ss.setNamedRange('LIVE',sheet.getRange(1,1));
            for ( b = 2; b < rows; b++ ) {
              if ( b % 3 == 0 ) {
                if ( sheetNames[a] == 'DRAFT' ) {
                  if ( b == 1 ) {
                    sheet.getRange(b-1,1).setValue('ROUND')
                      .setFontSize(12)
                      .setFontColor('white')
                      .setVerticalAlignment('bottom');
                  }
                  sheet.getRange(b,1).setValue(b/3);
                }
                sheet.getRange(b,1,1,cols).setBorder(true,null,null,null,null,null,darkNavy,SpreadsheetApp.BorderStyle.SOLID_THICK);
                if (b/3 == 3 && trr && sheetNames[a] == 'DRAFT' ) {
                  sheet.getRange(b,1,3,1).setValues([['THIRD'],['ROUND'],['REVERSAL']])
                    .setFontColor(darkNavy)
                    .setFontSize(12)
                    .setVerticalAlignment('middle')
                    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
                    .setHorizontalAlignment('center');
                  sheet.setRowHeight(b,21);      
                } else {
                  sheet.getRange(b,1,3,1).mergeVertically();
                }
              }
            }
            for ( b = 0; b <= positions-1; b++ ) {
              //First Row
              sheet.setRowHeight(b*3+3,21);
              sheet.getRange(b*3+3,2,1,cols-1).setFontSize(12)
                .setHorizontalAlignment('left')
                .setVerticalAlignment('bottom');
              
              //Second Row
              sheet.getRange(b*3+4,2,1,cols-1).setFontSize(14)
                .setHorizontalAlignment('left')
                .setVerticalAlignment('bottom')
                .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
              
              //Third Row
              sheet.getRange(b*3+5,2,1,cols-1).setFontSize(14)
                .setHorizontalAlignment('left')
                .setVerticalAlignment('top')
                .setFontWeight('bold')
                .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
              if ( (b+1) % 2 == 0 ) { 
                sheet.getRange(b*3+3,1,3,maxCols).setBackground(lightGray);
              }
            }
            
            //full.setFontFamily("Abel");
            //full.setFontFamily("Montserrat");
            full.setFontFamily("Teko");
            topRow = sheet.getRange(1,1,1,maxCols);
            topRow.setVerticalAlignment('bottom');
            sheet.getRange(2,1,1,maxCols).setFontSize(12);
            sheet.getRange(2,1,1,maxCols).setVerticalAlignment('top');

            // DRAFT SHEET ONLY FORMATTING            
            if ( sheetNames[a] == 'DRAFT' ) {
              sheet.getRange(1,(cols+1)-count,1,count).setValues([drafters]);
              sheet.getRange(2,(cols+1)-count,1,count).setValues([draftersTeamNames]);
              for ( b = 0; b <= positionDraftList.length-1; b++ ) {
                for ( c = 0; c <= positionDraftList.length-1; c++ ) {
                  sheet.getRange(c*3+3,b+2,3,3).setBorder(false,false,false,false,false,false,darkNavy,SpreadsheetApp.BorderStyle.SOLID);
                  sheet.getRange(c*3+3,b+2,3,3).setBorder(true,true,true,true,false,false,darkNavy,SpreadsheetApp.BorderStyle.SOLID_THICK);
                  sheet.getRange(c*3+5,b+2,3,2).setBorder(null,null,true,null,null,null,darkNavy,SpreadsheetApp.BorderStyle.SOLID);
                }
              }
              ss.toast('Set up draft sheet');
            // ROSTER SHEET ONLY FORMATTING
            } else if ( sheetNames[a] == 'ROSTERS' ) {
              sheet.unhideRow(sheet.getRange(1,1,sheet.getMaxRows(),1));
              let posList = ['QB','RB','WR','TE','DEF','K','FLX','SPFLX'];//
              //let hexList = ['b22052','009288','4781c4','b37c43','022047','8e4dbf','a3b500','b50900'];
              let hexList = ['FF2A6D','00CEB8','58A7FF','FFAE58','7988A1','BD66FF','FFF858','E22D24'];
              let hexAltList = ['C82256','00A493','4482C6','CD8B45','5D697D','9650CB','CAC444','B8251E'];
              for ( b = 0; b <= positionDraftList.length-1; b++ ) {
                sheet.getRange(b*3+3,1).setValue(positionDraftList[b]);
                sheet.getRange(b*3+3,1,3,1).setBackground('#' + hexList[posList.indexOf(positionDraftList[b])]);
              }
              sheet.getRange(maxRows-3,1).setValue('PROJ');
              sheet.getRange(maxRows-2,1).setValue('RANK');
              sheet.getRange(maxRows-1,1).setValue('POINTS');
              ss.setNamedRange('ROSTER_NAMES',sheet.getRange(1,2,1,maxCols-1));
              ss.setNamedRange('ROSTER_POINTS',sheet.getRange(maxRows-1,2,1,maxCols-1));
              sheet.getRange(maxRows,1).setValue('RANK');
              sheet.setRowHeights(maxRows-3,2,50);
              let conditionalRangePlayers = [];
              
              for ( b = 0; b < count; b++ ) {
                sheet.getRange(1,b*3+2).setValue(drafters[b]);
                sheet.getRange(2,b*3+2).setValue(draftersTeamNames[b]);
                sheet.getRange(2,b*3+2,1,2).merge();
                sheet.hideColumn(sheet.getRange(2,b*3+4));
                sheet.getRange(1,b*3+4).setValue('Score');
                sheet.getRange(1,b*3+2,1,2,).merge();
                sheet.getRange(1,b*3+4,2,1).merge();
                                
                for ( c = 0; c <= positionDraftList.length-1; c++ ) {
                  sheet.getRange(c*3+3,b*3+2,3,3).setBorder(false,false,false,false,false,false,darkNavy,SpreadsheetApp.BorderStyle.SOLID);
                  sheet.getRange(c*3+3,b*3+2,3,3).setBorder(true,true,true,true,false,false,darkNavy,SpreadsheetApp.BorderStyle.SOLID_THICK);
                  sheet.getRange(c*3+3,b*3+3,3,2).setBorder(null,null,null,null,true,null,darkNavy,SpreadsheetApp.BorderStyle.SOLID);
                  
                  let scoreRange = sheet.getRange(c*3+3,b*3+4);
                  scoreRange.setFormulaR1C1('=iferror\(vlookup\(vlookup\(R\[1\]C\[-1\]\&\" \"\&R\[2\]C\[-1\],\{SLPR\_FULL\_NAME,SLPR\_PLAYER\_ID\},2,false\),\{SLPR\_PLAYER\_ID,SLPR\_SCORE\},2,false\)\)');
                  
                  let scoringColBoxes = sheet.getRange(c*3+3,b*3+4,3,1)
                  scoringColBoxes.merge()
                    .setFontSize(18)
                    .setFontWeight('bold')
                    .setFontColor(darkNavy)
                    .setHorizontalAlignment('center')
                    .setVerticalAlignment('middle');

                  let headshotRange = sheet.getRange(c*3+4,b*3+2,2,1);
                  headshotRange.merge()
                    .setFormulaR1C1('=iferror\(image\(vlookup\(vlookup\(R\[0\]C\[1\]\&\" \"\&R\[1\]C\[1\],\{SLPR_FULL_NAME,SLPR_PLAYER_ID\},2,false\),\{SLPR_PLAYER_ID,SLPR_IMAGE\},2,false\)\)\)');
                  
                  let teamRange = sheet.getRange(c*3+3,b*3+2);
                  teamRange.setHorizontalAlignment('left')
                    .setVerticalAlignment('middle')
                    .setFormulaR1C1('=iferror\(vlookup\(vlookup\(R\[1\]C\[1\]\&\" \"\&R\[2\]C\[1\],\{SLPR_FULL_NAME,SLPR_PLAYER_ID\},2,false\),\{SLPR_PLAYER_ID,SLPR_TEAM\},2,false\),\)');
                  
                  let projRange = sheet.getRange(c*3+3,b*3+3);
                  projRange.setHorizontalAlignment('right')
                    .setVerticalAlignment('middle')
                    .setFormulaR1C1('=iferror\(vlookup\(vlookup\(R\[1\]C\[0\]\&\" \"\&R\[2\]C\[0\],\{SLPR_FULL_NAME,SLPR_PLAYER_ID\},2,false\),\{SLPR_PLAYER_ID,SLPR_PROJ\},2,false\),\)');
                }
              
                sheet.getRange(maxRows-3,b*3+2).setFormulaR1C1('=iferror\(sum\(R3C\[1\]:R\[-3\]C\[1\]\)\)');
                sheet.getRange(maxRows-2,b*3+2).setFormulaR1C1('=iferror\(if\(R\[-1\]C\[0\]\=0,,arrayformula\(rank\(R\[-1\]C\[0\],R\[-1\]C2:R\[-1\]C'+(count*3+1)+'\)\)\)\)');
                sheet.getRange(maxRows-1,b*3+2).setFormulaR1C1('=iferror\(sum\(R3C\[2\]:R\[-3\]C\[2\]\)\)');
                sheet.getRange(maxRows,b*3+2).setFormulaR1C1('=iferror\(if\(R\[-1\]C\[0\]\=0,,arrayformula\(rank\(R\[-1\]C\[0\],R\[-1\]C2:R\[-1\]C'+(count*3+1)+'\)\)\)\)');
                
                conditionalRangePlayers.push(sheet.getRange(2,b*3+4,maxRows-6,1));
                
                sheet.getRange(maxRows-3,b*3+2,4,3).mergeAcross();
                
                sheet.setColumnWidth(b*3+2,50); // Headshot col width
                sheet.setColumnWidth(b*3+4,55); // Score col width
                
              }
              sheet.getRange(maxRows-3,1,4,count*3+1).setBorder(true,true,true,true,true,true,darkNavy,SpreadsheetApp.BorderStyle.SOLID_THICK)
                .setVerticalAlignment('middle')
                .setHorizontalAlignment('center');
              sheet.clearConditionalFormatRules();

              // const lightGray = '#b9b9b9';
              // const darkNavy = '#00142f';
              const slprGreen = '#45E6A7'
              const slprRed = '#F75C8D';              

              //Formatting for projected scoring and rank
              let formatProj = SpreadsheetApp.newConditionalFormatRule()
                .setGradientMaxpointWithValue(slprGreen, SpreadsheetApp.InterpolationType.PERCENT, '100')
                .setGradientMidpointWithValue('white',SpreadsheetApp.InterpolationType.PERCENT, '50')
                .setGradientMinpointWithValue(slprRed,SpreadsheetApp.InterpolationType.PERCENT, '0')
                .setRanges([sheet.getRange(maxRows-3,2,1,sheet.getMaxColumns())])
                .build();

              let formatProjRank = SpreadsheetApp.newConditionalFormatRule()
                .setGradientMaxpointWithValue(slprRed, SpreadsheetApp.InterpolationType.PERCENT, '100')
                .setGradientMidpointWithValue('white',SpreadsheetApp.InterpolationType.PERCENT, '50')
                .setGradientMinpointWithValue(slprGreen,SpreadsheetApp.InterpolationType.PERCENT, '0')
                .setRanges([sheet.getRange(maxRows-2,2,1,sheet.getMaxColumns())])
                .build();
              
              //Formatting for actual scoring and rank
              let formatPoints = SpreadsheetApp.newConditionalFormatRule()
                .setGradientMaxpointWithValue(slprGreen, SpreadsheetApp.InterpolationType.PERCENT, '100')
                .setGradientMidpointWithValue('white',SpreadsheetApp.InterpolationType.PERCENT, '50')
                .setGradientMinpointWithValue(slprRed,SpreadsheetApp.InterpolationType.PERCENT, '0')
                .setRanges([sheet.getRange(maxRows-1,2,1,sheet.getMaxColumns())])
                .build();

              let formatPointsRank = SpreadsheetApp.newConditionalFormatRule()
                .setGradientMaxpointWithValue(slprRed, SpreadsheetApp.InterpolationType.PERCENT, '100')
                .setGradientMidpointWithValue('white',SpreadsheetApp.InterpolationType.PERCENT, '50')
                .setGradientMinpointWithValue(slprGreen,SpreadsheetApp.InterpolationType.PERCENT, '0')
                .setRanges([sheet.getRange(maxRows,2,1,sheet.getMaxColumns())])
                .build();
              
              //Formatting for points scored per player
              let formatPlayerPoints = SpreadsheetApp.newConditionalFormatRule()
                .setGradientMaxpointWithValue(slprGreen, SpreadsheetApp.InterpolationType.PERCENT, '100')
                .setGradientMidpointWithValue('white',SpreadsheetApp.InterpolationType.PERCENT, '50')
                .setGradientMinpointWithValue(slprRed,SpreadsheetApp.InterpolationType.PERCENT, '0')
                .setRanges(conditionalRangePlayers)
                .build();

              let formatRules = sheet.getConditionalFormatRules();
              formatRules.push(formatProj);
              formatRules.push(formatProjRank);
              formatRules.push(formatPoints);
              formatRules.push(formatPointsRank);
              formatRules.push(formatPlayerPoints);
              sheet.setConditionalFormatRules(formatRules);
              
              let hideRange = sheet.getRange(maxRows-1,1,2,maxCols);
              sheet.hideRow(hideRange);
            }
            ss.toast('Set up roster and scoring sheet');
          } else if ( sheetNames[a] == 'PICKS' ) {
            let draftersHelper = [...drafters];
            draftersHelper.reverse();
            let arrCol = [];
            for (let a = draftersHelper.length; a > 0 ; a--) {
              arrCol = arrCol.concat(a);
            }
            let arrDraftersInitial = [];
            let arrColsInitial = [];
            sheet.setColumnWidths(1,4,30);
            sheet.setColumnWidth(5,80);
            sheet.setColumnWidths(6,4,40);
            sheet.setColumnWidths(9,positionDraftList.length,50);
            
            sheet.getRange(2,5,maxRows,maxCols-5).setHorizontalAlignment('left');
            full = sheet.getRange(2,1,maxRows,maxCols);

            for (let a = 2; a < (positions + 2); a++) {
              if (trr & a == 4) {
                arrDraftersInitial = arrDraftersInitial.concat(draftersHelper);
                arrColsInitial = arrColsInitial.concat(arrCol);  
              } else {
                arrDraftersInitial = arrDraftersInitial.concat(draftersHelper.reverse());
                arrColsInitial = arrColsInitial.concat(arrCol.reverse());
              }
            }
            let arr = [];
            arrDraftersInitial = arrDraftersInitial.concat('End');
            for (let a = 0; a < arrDraftersInitial.length; a++) {
              arr[a] = [];
              arr[a] = [a+1, Math.floor(a/totalDrafters) + 1,(a+1) - (Math.floor((a/totalDrafters)))*totalDrafters,arrColsInitial[a],arrDraftersInitial[a]];
            }

            sheet.getRange(1,1,sheet.getMaxRows(),sheet.getMaxColumns()).clearNote();
            let headers = ['overall','round','round_pick','col','picker','player','pos','pos_index'];
            headers = headers.concat(...positionDraftList);
            sheet.getRange(1,1,1,headers.length).setValues([headers]);
            const picksNamedRanges = ['OVERALL','ROW','PICK','COL','NAME','ID','POS','ROSTER_ROW','REMAINING'] // will have 'PICKS_' appended;
            const picksNotes = ['Overall selection number',
              'Draft pick row placement on DRAFT sheet, also draft round',
              'Round pick number',
              'Column index of drafter',
              'Drafters name',
              'ID of draft pick, based on Sleeper ID',
              'Position of draft pick',
              'Position index of draft pick on drafter\'s roster',
              'Array of all remaining positions to fill after this pick'];

            picksNamedRanges.forEach(index => {
              let col = picksNamedRanges.indexOf(index)+1;
              sheet.getRange(1,col).setNote(picksNotes[picksNamedRanges.indexOf(index)]);
              if (index == 'REMAINING') {
                ss.setNamedRange('PICKS_'+index,sheet.getRange(2,col,maxRows,positionDraftList.length));
                ss.setNamedRange('STARTERS',sheet.getRange(1,col,1,positionDraftList.length))
              } else {
                ss.setNamedRange('PICKS_'+index,sheet.getRange(2,col,maxRows,1));
              }
            });
            
            sheet.getRange(2,1,maxRows-2,5).setValues(arr);
            ss.toast('Configured picks based on draft order');
          }
          
        }
        // Sets the active drafter to the cell on the draft board page
        ss.getRangeByName('PICKER').setValue(picker);
        ss.getRangeByName('PICKER_NEXT').setValue(onDeck);
        ss.getRangeByName('PICKER_ROSTER').setValue(arrayToString(arrayClean(positionDraftList),false,false));
        
        
      }      
      prompt = ui.alert('Are you ready to begin the draft?', ui.ButtonSet.YES_NO);
      if (prompt == 'YES') {
        ss.toast('Creating triggers for active drafting...');
        draftBoard.activate();
        triggersDrafting();
        toolbar('draft');
        ui.alert('START DRAFTING!\r\n\r\n' + drafters[0] + ' is on the clock!\r\n\r\nUse the Challenge Flag to UNDO the last pick.' ,ui.ButtonSet.OK);
      } else {
        ui.alert('Use the "Fantasy Tools" menu option "Begin Draft" to start.\r\n\r\nProjections and injury statuses may change before kickoff\r\nUse the \"Fantasy Tools\" \> \"Refresh Players\" to get up-to-date information before drafting.');
        toolbar('predraft');
        ss.toast('Configuration completed');
      }
    } else {
      triggersStandard();
    }
  } else {
    ss.toast('Invalid configuration data, check inputs and run again');
  }
}

// SHOW SCORING
// Reveals "Score" column on "ROSTERS" sheet for after the draft when using scoring
function scoringShow() {
  scoringCells(1);
}
// HIDE SCORING
// Hides "Score" column on "ROSTERS" sheet
function scoringHide() {
  scoringCells(0);
}

// SCORING CELLS VISIBILITY
// Takes boolean (1 = show, 0 = hide) to reveal or conceal scoring cells on "ROSTERS"
function scoringCells(visible) {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('ROSTERS');
  let maxCols = sheet.getMaxColumns();
  for ( let b = 4; b <= maxCols; b+=3 ) {
    if ( visible == 1 ) {
    sheet.unhideColumn(sheet.getRange(1,b));
    } else if ( visible == 0 ) {
    sheet.hideColumn(sheet.getRange(1,b));
    }
  }
  let maxRows = sheet.getMaxRows();
  let range = sheet.getRange(maxRows-1,1);
  if ( visible == 1 ) {
    sheet.unhideRow(range);
    range = sheet.getRange(maxRows,1);
    sheet.unhideRow(range);
  } else if ( visible == 0 ) {
    sheet.hideRow(range);
    range = sheet.getRange(maxRows,1);
    sheet.hideRow(range);
  }
}

// FETCHES PICKS
// A more efficient way to get all 'PICK' sheet data quickly than by named ranges
function picksData(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PICKS');
  const regex = new RegExp(/[A-Z]/,'g');
  const table = sheet.getDataRange().getValues();
  const starterRow = table[0].splice(table[0].indexOf('pos_index')+1,table[0].length - table[0].indexOf('pos_index'));
  let obj = table[0].reduce((result, key, col) => {
    result = result || {};
    if (key === 'pos_index') {
      result.remaining = table.slice(1).map((row) => row.slice(col + 1));
      result.starters = table[0].slice(1,table[0].length);
    } else {
      result[key] = result[key] || table.slice(1).map((row) => row[col]);
    }
    return result;
  }, {});
  obj.starters = starterRow;
  obj.participants = Math.max(...obj.round_pick);
  for (let a = obj.participants; a < obj.remaining.length; a++) {
    if (obj.remaining[a].every(value => value === '')) {
      obj.last = a;
      break;
    }
  }
  const counts = obj.starters.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
  for (let a = obj.last - obj.participants; a < obj.last; a++) {
    obj.remaining[a].forEach(key => {
      if (key) counts[key] += 1;
    });
  }
  const positions = ['QB','RB','WR','TE','K','DEF'].filter(key => obj.starters.indexOf(key) >= 0);
  const flx = ['RB','WR','TE'];
  const spflx = ['QB','RB','WR','TE'];
  obj.eliminated = [];
  for (let a = 0; a < positions.length; a++) {
    const pos = positions[a];
    if (counts[pos] === 0) {
      if (spflx.indexOf(pos) >= 0) {
        if (counts.hasOwnProperty('SPFLX')) {
          if (counts['SPFLX'] === 0 && pos === 'QB') {
            obj.eliminated.push(pos);
          } else if (flx.indexOf(pos) >= 0) {
            if (counts.hasOwnProperty('FLX')) {
              if (counts['FLX'] === 0) {
                obj.eliminated.push(pos);
              }
            }
          }
        }
      } else {
        obj.eliminated.push(pos);
      }
    }
  }
  return obj;
}

// FETCHES DRAFTER PLAYER PLACEMENT AND NEXT TWO PICKER NAMES
function nextDrafter(dataObj,pos,ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  
  const sleeperId = ss.getRangeByName('SLPR_PLAYER_ID').getValues().flat();
  const sleeperName = ss.getRangeByName('SLPR_FULL_NAME').getValues().flat();
  
  let target = dataObj.player.indexOf('');
  let row = dataObj.round[target];
  let col = dataObj.col[target];
  let count = target+1;
  
  let pick = dataObj.round_pick[target];
  let picker = dataObj.picker[target];
  let nextPicker = dataObj.picker[target+1];
  let onDeck = dataObj.picker[target+2];

  // Third Round Reversal Boolean
  let third = dataObj.round.indexOf(3);
  const trr = (third > -1) ? (dataObj.picker[third] != dataObj.picker[third-1] ? true : false) : false;
  const reverse = (trr && dataObj.round[target+2] === 3) ? true : false;

  let currentRoster = [];

  let last = 0;
  for (let a = 0; a < dataObj.picker.length; a++ ) {
    if (dataObj.picker[a] == picker && dataObj.player[a] != '') {
      currentRoster = dataObj.remaining[a];
    }
  }
  if (currentRoster.length == 0) {
    currentRoster = dataObj.starters;
  }
  let nextCurrentRoster = [];
  
  if (picker === nextPicker && row === 1) {
    for (let a = 0; a < dataObj.starters.length; a++) {
      nextCurrentRoster.push(dataObj.starters[a]);
    }
    try {
      nextCurrentRoster.splice(nextCurrentRoster.indexOf(pos),1,'');
    } catch (err) {
      try {
        if (pos === 'WR' || pos === 'RB' || pos === 'TE') {
          nextCurrentRoster.splice(nextCurrentRoster.indexOf('FLX'),1,'');
        } else if (pos === 'QB') {
          nextCurrentRoster.splice(nextCurrentRoster.indexOf('SPFLX'),1,'');
        }
      } catch (err) {
        if (pos === 'QB') {
          nextCurrentRoster.splice(nextCurrentRoster.indexOf('SPFLX'),1,'');
        }
      }
    }
  }

  for (let a = 0; a < dataObj.picker.length; a++ ) {
    if (dataObj.picker[a] == nextPicker && dataObj.player[a] != ''  && picker != nextPicker) {
      nextCurrentRoster = dataObj.remaining[a];
    } else if (dataObj.picker[a] == picker && dataObj.player[a] != '' && picker == nextPicker) {
      for (let a = 0; a < dataObj.starters.length-1; a++) {
        nextCurrentRoster.push(dataObj.starters[a]);
      }
      try {
        nextCurrentRoster.splice(dataObj.starters.indexOf(pos),1,'');
      } catch (err) {
        try {
          if (pos === 'WR' || pos === 'RB' || pos === 'TE') {
            nextCurrentRoster.splice(dataObj.starters.indexOf('FLX'),1,'');
          } else if (pos === 'QB') {
            nextCurrentRoster.splice(dataObj.starters.indexOf('SPFLX'),1,'');
          }
        } catch (err) {
          if (pos === 'QB') {
            nextCurrentRoster.splice(dataObj.starters.indexOf('SPFLX'),1,'');
          }
        }
      }
    }
    if (dataObj.picker[a] == picker) {
      last = a;
    }
  }
  if (nextCurrentRoster.length == 0) {
    nextCurrentRoster = dataObj.starters;
  }  
  let currentPlayerIds = [];
  let currentPlayerNames = [];
  for (let a = 0; a < dataObj.player.length; a++ ) {
    if ( dataObj.picker[a] == picker ) {
      currentPlayerIds.push(dataObj.player[a]);
      currentPlayerNames.push(sleeperName[sleeperId.indexOf(dataObj.player[a])]);
    }
  }
  let object = {
    row,
    col,
    count,
    pick,
    picker,
    nextPicker,
    onDeck,
    roster:currentRoster,
    nextRoster:nextCurrentRoster,
    currentPlayerIds,
    currentPlayerNames,
    trr,
    reverse
  };
  return object;
}

// DYNAMIC DRAFTER
// Tool to hide/reveal all picked players and select them while moving them to the correct sheet
function dynamicDrafter(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const draftBoard = ss.getActiveSheet();
  const sheetName = ss.getSheetName();

  const range = e.range;
  const colDraft = range.getColumnIndex();
  const rowDraft = range.getRowIndex();
  if ( sheetName === 'DRAFT_LOBBY' &&  colDraft === 2 ) {
    let dataObj = picksData(ss);
    if(rowDraft === 1) {
      toggleMarked(e,ss,dataObj.eliminated);
    } else if (rowDraft > 2) {
      let value = range.isChecked();
      if ( value == true ) {
        let completed = false;
        let draftHeaders = ss.getRangeByName('DRAFT_HEADERS').getValues().flat();
        // let id = sheet.getRange(rowDraft,draftHeaders.indexOf("ID")+1).getValues();
        let playerInfo = draftBoard.getRange(rowDraft,draftHeaders.indexOf("PLAYER")+1,1,3).getValues().flat();
        let player = playerInfo[0];
        let team = playerInfo[1];
        let pos = playerInfo[2];
        let obj = nextDrafter(dataObj,pos,ss);
        let id = nameFinder(player);
        // let team = draftBoard.getRange(rowDraft,draftHeaders.indexOf("TEAM")+1).getValue();
        // let pos = draftBoard.getRange(rowDraft,draftHeaders.indexOf("POS")+1).getValue();
        let opening = obj.roster.indexOf(pos);
        let alreadyOwned = 0;
        // const positions = ['QB','RB','WR','TE','K','DEF'].filter(key => obj.starters.indexOf(key) >= 0);
        const flx = ['RB','WR','TE'];
        const spflx = ['QB','RB','WR','TE'];
        if (opening == -1) {
          if (flx.indexOf(pos) >= 0) {
            opening = obj.roster.indexOf('FLX');
          }
        }
        if (opening == -1) {
          if (spflx.indexOf(pos) >= 0) {
            opening = obj.roster.indexOf('SPFLX');
          }
        }
        let rosterSlotUsedIndex = -1;
        let rosterString = '';
        if (obj.picker == obj.nextPicker) {
          Logger.log('currentRoster: ' + obj.roster);
          Logger.log('pos: ' + pos + '( found at ' + obj.roster.indexOf(pos) + ')');
          if (obj.roster.indexOf(pos) > -1) {
            rosterSlotUsedIndex = obj.roster.indexOf(pos);
          }
          if (rosterSlotUsedIndex == -1) {
            if (( pos == 'RB' || pos == 'WR' || pos == 'TE' ) && obj.roster.indexOf('FLX') > -1 ) {
              rosterSlotUsedIndex = obj.roster.indexOf('FLX');
            }
          }
          if (rosterSlotUsedIndex == -1) {
            if (( pos == 'RB' || pos == 'WR' || pos == 'TE' || pos == 'QB' ) && obj.roster.indexOf('SPFLX') > -1 ) {
              rosterSlotUsedIndex = obj.roster.indexOf('SPFLX');
            }
          }
          let tempRoster = [];
          for (let a = 0; a < obj.roster.length; a++) {
            tempRoster.push(obj.roster[a]);
          }
          tempRoster.splice(rosterSlotUsedIndex,1);
          for ( let a = 0; a < tempRoster.length; a++ ) {
            if ( tempRoster[a] != '' ) {
              rosterString = rosterString.concat(tempRoster[a] + ', ');
            }
          }
          rosterString = rosterString.slice(0,-2);  
        } else {
          for ( let a = 0; a < obj.nextRoster.length; a++ ) {
            if ( obj.nextRoster[a] != '' ) {
              rosterString = rosterString.concat(obj.nextRoster[a] + ', ');
            }
          }
          rosterString = rosterString.slice(0,-2);
        }
        let currentPlayersString = '';
        for ( let a = 0; a < obj.currentPlayerNames.length; a++ ) {
          if ( obj.currentPlayerNames[a] != '' && obj.currentPlayerNames[a] != undefined ) {
            currentPlayersString = currentPlayersString.concat(obj.currentPlayerNames[a] + '\r\n');
          }
        }  
        if ( obj.currentPlayerIds.indexOf(id) > -1 ) {
          alreadyOwned = 1;
        }
        const ui = SpreadsheetApp.getUi();
        
        if ( opening == -1 && alreadyOwned == 1 ) {
          let str = ( 'INVALID PICK\r\n\r\nThere isn\'t a roster spot left for ' + player + ' and you already own that player.\r\n\r\nRemaining positions:\r\n\r\n' + rosterString + '\r\n\r\nCurrent Players:\r\n\r\n' + currentPlayersString);
          ui.alert(str, ui.ButtonSet.OK);
          range.setValue(false);
        } else if ( opening == -1 ) {
          let str = ( 'INVALID PICK\r\n\r\nThere isn\'t a roster spot left for ' + player + '.\r\n\r\nRemaining positions:\r\n\r\n' + rosterString);
          ui.alert(str, ui.ButtonSet.OK);
          range.setValue(false);
        } else if ( alreadyOwned == 1 ) {
          let str = ( 'INVALID PICK\r\n\r\nYou\'ve already selected ' + player + '.\r\n\r\nCurrent Players:\r\n\r\n' + currentPlayersString);
          ui.alert(str, ui.ButtonSet.OK);
          range.setValue(false);
        } else {
          obj.roster.splice(opening,1,'');
          opening++;
          let pickString = obj.row + '.' + obj.pick;
          let again = '';
          if (obj.reverse) {
            again = ' (3rd Round Reversal)';
          } else if (obj.picker === obj.nextPicker) {
            again = ' (turn)';
          }
          let str = ('PICK ' + obj.count + ' BY ' + obj.picker.toUpperCase() + '\r\n\r\n ' + player + ', ' + pos + ' (' + team + ')');
          if (obj.nextPicker == 'End') {
            str = str.concat('\r\n\r\nDraft Completed!\r\n\r\nUse the \"Scoring\" menu to turn on live scoring when the games are near and see who proves victorious!');
            completed = true;
          } else {
            str = str.concat('\r\n\r\nNext up: ' + obj.nextPicker + again);  
          }
          let notify = ui.alert(str, ui.ButtonSet.OK_CANCEL);
          if ( notify == 'OK' ) {
            ss.getRangeByName('PICKER').setValue(obj.nextPicker);
            ss.getRangeByName('PICKER_ROSTER').setValue(rosterString);
            ss.getRangeByName('PICKER_NEXT').setValue(obj.onDeck);          
            
            if (draftBoard.getRange(1,2).isChecked()) {
              draftBoard.hideRow(draftBoard.getRange(rowDraft,1));
            }
            
            let playerArr = player.split(' ');
            let first = playerArr[0];
            let last = playerArr[1];
            if ( playerArr.length > 2 ) {
              for (let a = 2 ; a < playerArr.length; a++ ) {
                last = last.concat(' ' + playerArr[a]);
              }
            }
            let picksSheet = ss.getSheetByName('PICKS');
            picksSheet.getRange((obj.count + 1),6,1,(3 + obj.roster.length)).setValues([[id,pos,opening].concat(...obj.roster)]);
                      
            let draftSheet = ss.getSheetByName('DRAFT');
            let tabs = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t';
            if ( ( pickString.length + team.length ) > 6 ) {
              tabs = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t';
            } else if ( ( pickString.length + team.length ) > 5 ) {
              tabs = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t';
            } else if ( ( pickString.length + team.length ) > 4 ) {
              tabs = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t';
            }
            draftSheet.getRange((obj.row-1)*3+3,obj.col+1,3,1).setValues([[pos + ' - ' + team + tabs + pickString],[first],[last]]);
            // draftSheet.getRange((obj.row-1)*3+4,obj.col+1).setValue();
            // draftSheet.getRange((obj.row-1)*3+5,obj.col+1).setValue(last);
            let posList = ['QB','RB','WR','TE','DEF','K','FLX','SPFLX'];          
            let hexList = ['FF2A6D','00CEB8','58A7FF','FFAE58','7988A1','BD66FF','FFF858','E22D24'];
            let hexAltList = ['C82256','00A493','4482C6','CD8B45','5D697D','9650CB','CAC444','B8251E'];
            //let hexList = ['b22052','009288','4781c4','b37c43','022047','8e4dbf','a3b500','b50900']; // Old
            // let hexAltList = ['8f153f','01746c','2c5e97','916232','00142f','6a3096']; // Old
            let hex = hexList[posList.indexOf(pos)];
            
            // Adjust second value to reduce/increase saturation
            let hexDesat = hexAltList[posList.indexOf(pos)];

            hexList[posList.indexOf(pos)] == '' ?  hexDesat = hexColorAdjust(hex,-15) : null;
            
            draftSheet.getRange((obj.row-1)*3+3,obj.col+1,3,1).setBackgrounds([['#'+hexDesat],['#'+hex],['#'+hex]]);
            
            let rostersSheet = ss.getSheetByName('ROSTERS');
            rostersSheet.getRange((opening-1)*3+3,(obj.col-1)*3+2).setValue(team)
            rostersSheet.getRange((opening-1)*3+4,(obj.col-1)*3+3,2,1).setValues([[first],[last]]);
            
            rostersSheet.getRange((opening-1)*3+3,(obj.col-1)*3+2,3,2).setBackgrounds([['#'+hexDesat,'#'+hexDesat],['#'+hex,'#'+hex],['#'+hex,'#'+hex]]);

            ss.toast('Draft pick recorded');
            if (completed) {
              toolbarScoring();
            }
          } else {
            range.setValue(false);
            ss.toast('Declined to confirm pick, ' + obj.picker + ' is still on the clock!')
          }
        }
      }
    }
  }
}

// UNDO LAST PICK
// Associated with the flag to remove the most recently picked player
function undoPick() {
  deleteTriggers();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const lightGray = '#E5E5E5';
  let picksId = ss.getRangeByName('PICKS_ID').getValues().flat();
  let picksName = ss.getRangeByName('PICKS_NAME').getValues().flat();
  let target = picksId.indexOf('') - 1;
  let id = picksId[target]; 
  
  let picker = picksName[target];
  let sleeperId, sleeperName, player, team;
  let prompt = 'CANCEL';
  if ( picksId[0] == '' ) {
    ui.alert('No selections have been made, get drafting!', ui.ButtonSet.OK);
  } else {
    sleeperId = ss.getRangeByName('SLPR_PLAYER_ID').getValues().flat();
    sleeperName = ss.getRangeByName('SLPR_FULL_NAME').getValues().flat();
    player = sleeperName[sleeperId.indexOf(id)];
    prompt = ui.alert('Undo last pick of ' + player + ' made by ' + picker + '?', ui.ButtonSet.OK_CANCEL);
  }
  if ( prompt == 'OK' ) {
    
    let picksRow = ss.getRangeByName('PICKS_ROW').getValues().flat();
    let picksCol = ss.getRangeByName('PICKS_COL').getValues().flat();
    
    let picksRosterRow = ss.getRangeByName('PICKS_ROSTER_ROW').getValues().flat();
    let picksStarters = ss.getRangeByName('PICKS_REMAINING').getValues();

    let row = picksRow[target];
    let col = picksCol[target];
    let count = target+1;
    
    let nextPicker = picksName[target+1];
    let rosterRow = picksRosterRow[target];
    let currentRoster = picksStarters[target];

    let pickerRosters = picksStarters.filter((_value, index) => (picksName[index] == picker && picksStarters[index].some(x => x.length > 0)));
    let previousRoster = pickerRosters[pickerRosters.length-2];

    // Reveal picked player
    let unhideRow = ss.getRangeByName('DRAFT_ID').getValues().flat().indexOf(id);
    let lobbySheet = ss.getSheetByName('DRAFT_LOBBY');
    lobbySheet.getRange(unhideRow+3,2).clearContent();
    ss.toast(unhideRow+3);
    lobbySheet.unhideRow(lobbySheet.getRange(unhideRow+3,1));

    // Define and clear range for 'DRAFT' sheet
    let range = ss.getSheetByName('DRAFT').getRange((row-1)*3+3,col+1,3,1);
    range.clearContent();
    if ( row % 2 == 0 ) {
      range.setBackground(lightGray);
    } else {
      range.setBackground('white');
    }

    // Define and clear range for 'ROSTERS' sheet
    let rowRosters = rosterRow;
    // Clear first and last name
    ss.getSheetByName('ROSTERS').getRange((rowRosters-1)*3+4,(col-1)*3+3,2,1).clearContent();
    // Clear team abbreviation
    ss.getSheetByName('ROSTERS').getRange((rowRosters-1)*3+3,(col-1)*3+2).clearContent();
    // Get Range of full box and set color
    range = ss.getSheetByName('ROSTERS').getRange((rowRosters-1)*3+3,(col-1)*3+2,3,2);
    if ( rowRosters % 2 == 0 ) {
      range.setBackground(lightGray);
    } else {
      range.setBackground('white');
    }

    // Define range that will be cleared out
    let rangePicksSheet = ss.getSheetByName('PICKS').getRange(count+1,6,1,currentRoster.length + 4);
    
    picksRosterRow = ss.getRangeByName('PICKS_ROSTER_ROW').getValues().flat();
    picksStarters = ss.getRangeByName('PICKS_REMAINING').getValues();

    rangePicksSheet.clearContent();
    
    ss.getRangeByName('PICKER').setValue(picker);
    ss.getRangeByName('PICKER_NEXT').setValue(nextPicker);
    ss.getRangeByName('PICKER_ROSTER').setValue(arrayToString(arrayClean(previousRoster),false,false)); // Cleans up the previous roster to place on DRAFT_LOBBY sheet
    ui.alert('Last pick of ' + player + ' removed.\r\n\r\n' + picker + ' is back on the clock!',ui.ButtonSet.OK);
  } else {
    ss.toast('Undo of last pick canceled');
  }
  triggersDrafting();
}

// MASTER FUNCTION TO TOGGLE VISIBILITY
// Two options: the fist when checked will hide all drafted players and all players of a position who cannot be drafted by anyone else
function toggleMarked(e,ss,eliminated) {
  let range = e.range;
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  if( range.getRowIndex() == 1 && range.getColumnIndex() == 2 && ss.getSheetName() == 'DRAFT_LOBBY' ) {
    let activeSheet = ss.getActiveSheet();
    if ( activeSheet !== null ) {
      let draftedRange = ss.getRangeByName('DRAFT_CHECKBOXES');
      let drafted = draftedRange.getValues().flat();
      let hidden = Array(draftedRange.getRow()-1).fill(0); // Populates with 0s for first rows
      if( range.getCell(1,1).getValue() === true ) {
        for (let a = 0 ; a < drafted.length ; a++) {
          if (drafted[a] == true) {
            hidden.push(1);
          } else {
            hidden.push(0);
          }
        }
        let elim = true;
        if (eliminated) {
          if (eliminated.length > 0) {
            hidden = hideEliminated(ss,eliminated,hidden);    
          } else {
            elim = false;
          }
        } else {
          elim = false;
        }
        hideRowsUtility(activeSheet,hidden);
        if (elim) {
          ss.toast(eliminated + ' All marked and eliminated rows hidden');
        } else {
          ss.toast('All marked rows hidden');
        }
      } else if ( range.getCell(1,1).getValue() == false ) {
        for (let a = 0 ; a < drafted.length ; a++) {
          activeSheet.unhideRow(activeSheet.getRange(a+3,1));
        }
        ss.toast('All marked rows revealed');
      }
    }
  }
}

// ADDS OR CREATES BINARY ARRAY OF ROWS TO HIDE BASED ON ELIMINATED POSITIONS FROM ALL ROSTERS
function hideEliminated(ss,eliminated,hidden) {
  if (eliminated.length > 0) {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    const positionsRange = ss.getRangeByName('DRAFT_POS');
    const positions = Array(positionsRange.getRow()-1).fill('').concat(positionsRange.getValues().flat());
    hidden = hidden || Array(positionsRange.getRow()-1).fill(0).concat(Array(positions.length).fill(0)); // Populates with 0s for first rows
    for (let a = positionsRange.getRow()-1; a < positions.length; a++) {
      if (eliminated.indexOf(positions[a]) >= 0) {
        hidden[a] = 1;
      }
    }
  }
  return hidden;
}

// HIDES ROWS IN BATCHES TO REDUCE RUNTIME
function hideRowsUtility(sheet,arr) {
  try { 
    let start = null, end = null;
    for (let a = 0; a < arr.length; a++) {
      if (arr[a] === 1) {
        if (start === null) {
          start = a + 1;
          end = a + 1;
        } else {
          end = a + 1;
        }
      } else if (start !== null) {
        // Hide the range of rows and reset
        sheet.hideRows(start, end - start + 1);
        start = null;
        end = null;
      }
    }
    if (start !== null) {
      sheet.hideRows(start, end - start + 1);
    }
    return true;
  }
  catch (err) {
    return false;
  }
}
// STARTUP CHECK
function setupCheck() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const activeWeek = seasonInfo('week');

  let week = ss.getRangeByName('WEEK').getValue();

  let weekUpdate = false;

  const removeBlanks = (array) => array.filter(item => item != null && item !== '');
  
  if (!Number.isInteger(week) || week < 1 || week > 18) {
    let prompt = ui.alert('Invalid value provided for \"WEEK\" cell.\r\n\r\nThe current fantasy football week is ' + activeWeek + '.\r\n\r\nWould you like to update to that week now?', ui.ButtonSet.OK_CANCEL);
    if (prompt == 'OK') {
      Logger.log('Invalid week value provided, updating to week ' + activeWeek);
      ss.getRangeByName('WEEK').setValue(activeWeek);
      weekUpdate = true;
    } else {
      Logger.log('Invalid week value provided, canceling');
      return false;
    }
  }

  if (week != activeWeek) {
    let prompt = ui.alert('The current fantasy football week is ' + activeWeek + ', but you\'ve provided ' + week + ' for doing the draft.\r\n\r\nWould you like to update the draft week to ' + activeWeek + ' and select from the available games?\n\r\n\rNote: Fantasy Pros projections are only available during the week in which the games occur.', ui.ButtonSet.YES_NO_CANCEL);
    if (prompt == 'YES') {
      Logger.log('Non-current week value provided, updating to week ' + activeWeek);
      ss.getRangeByName('WEEK').setValue(activeWeek);
      weekUpdate = true;
    } else if (prompt == 'NO') {
      ss.toast('Continuing with non-current week, FP projections will not be available');
    } else {
      return false;
    }
  }

  // Check for at least 1 matching game regular expression and check for duplicates

  let games = arrayClean(ss.getRangeByName('GAMES').getValues().flat());
  let gamesOptions = arrayClean(ss.getRangeByName('GAMES_OPTIONS').getValues().flat());
  
  let check = arrayCheck(games,new RegExp(/[A-Z]{2,3}@[A-Z]{2,3}/));

  if (check.count == 0) {
    ui.alert('Please select at least 1 game in the bottom portion of the \"CONFIG\" tab and re-run the script.', ui.ButtonSet.OK);
    return false;
  }
  if (check.duplicates > 0) {
    let text = 'Duplicate game';
    if (check.duplicates >= 2) {
      text = text.concat('s');
    }
    text = text.concat(' of ' + (check.text) + ' found in game list, please ensure you\'ve selected the correct, unique games and re-run the script.');
    ui.alert(text, ui.ButtonSet.OK);
    Logger.log('Duplicate(s) found of ' + (check.text) + ', canceling');
    return false;
  }

  let valid = true;
  for (let a = 0; a < games.length; a++) {
    gamesOptions.indexOf(games[a]) == -1 ? valid = false : null;
  }
  if (!valid && !weekUpdate) {
    ui.alert('You have an NFL game selected that is not valid for the given week. Please check the selected games and re-run the script.', ui.ButtonSet.OK);
    Logger.log('Invalid NFL game found, canceling');
    return false;
  } else if (!valid && weekUpdate) {
    ui.alert('The games selected are no longer valid for the given week, which was updated to ' + activeWeek + '.\r\n\r\nPlease select from the updated list of games and re-run the script.', ui.ButtonSet.OK);
  }

  
  // Owner and order checking

  let owners = arrayClean(ss.getRangeByName('DRAFTERS').getValues().flat());
  let ownersTeamNames = arrayClean(ss.getRangeByName('DRAFTERS_TEAM_NAMES').getValues().flat());
  let order = arrayClean(ss.getRangeByName('DRAFTERS_MANUAL_ORDER').getValues().flat());

  // Check for at least 2 owners and for duplicates
  check = arrayCheck(owners,new RegExp(/\S{1,}/))

  if (check.count < 2) {
    ui.alert('No team owners found, please enter at least 2 owners to play', ui.ButtonSet.OK);
    if (check.count == 0) {
      Logger.log('No team owners entered, canceling');
    } else {
      Logger.log('Only one team owner entered, canceling');
    }
    return false;
  }
  
  if (check.duplicates > 0) {
    let text = 'Duplicate name';
    if (check.duplicates >= 2) {
      text = text.concat('s');
    }
    text = text.concat(' of ' + (check.text) + ' found in owners list, please make all owner names unique and re-run the script.');
    Logger.log('Duplicate name(s) of ' + (check.text) + ' found, canceling.');
    ui.alert(text, ui.ButtonSet.OK);
    return false;
  }  

  // Check for team names present per owner
  let missing = [];
  for (let a = 0; a < ownersTeamNames.length; a++) {
    let regEx = new RegExp(/\S{1,}/);
    if (regEx.test(owners[a]) && !regEx.test(ownersTeamNames[a])) {
      missing.push(owners[a]);
    }
  }
  let text = arrayToString(missing);
  if (missing.length > 0) {
    missing.length == 1 ? text = text.concat(' has not set a team name.') : text = text.concat(' have not set a team name.');
    let prompt = ui.alert(text + '\r\n\r\nDo you still wish to continue?', ui.ButtonSet.OK_CANCEL);
    if (prompt == 'CANCEL') {
     return false;
    }
  }

  // If manual order set, ensure that all members are given a value
  check = arrayCheck(order,new RegExp(/\S{1,}/));
  Logger.log(check);
  missing = [];
  let tempArray = [...owners];
  if (order.length > 0) {
    for (let a = 0; a < order.length; a++) {  
      try {
        missing.push(...tempArray.splice(tempArray.indexOf(order[a]),1));
      }
      catch (err) {
      }
    }
    Logger.log('missing ' + missing + ' missing len : ' + missing.length);
    Logger.log('tempArray ' + tempArray + ' tempArray len : ' + tempArray.length);
    
    check = arrayCheck(order,new RegExp(/\S{1,}/));
    if (check.duplicates == 0 && tempArray.length > 0) {
      text = 'All names must be included to use the manual draft order feature.\r\n\r\n';
      if (tempArray.length > 2) {
        missingText = arrayToString(arrayClean(tempArray),false);
        
        text = text.concat('The following members were omitted:\n' + missingText + '\r\n\r\n');
      } else {
        Logger.log('test')
        text = text.concat(missing[0] + ' has been omitted from the list.\r\n\r\n');
      }
      text = text.concat('Click \"CANCEL\" to correct the draft order.\r\nSelect \"OK\" to continue and generate a draft order randomly.');
      let prompt = ui.alert(text, ui.ButtonSet.OK_CANCEL);
      if (prompt == 'CANCEL') {
        Logger.log('Canceling to allow correction of manual draft order');
        return false;
      } else if (prompt == 'OK') {
        Logger.log('Manual draft entries are being disregarded, continuing');
      } else {
        return false;
      }
    } else if (check.duplicates > 0) {
      text = 'All names must be included only once to use the manual draft order feature.\r\n\r\n' + check.text;
      check.duplicates == 1 ? text = text.concat(' was ') : text = text.concat(' were ');
      text = text.concat('duplicated on the list.\r\n\r\nClick \"CANCEL\" to correct the draft order.\r\nSelect \"OK\" to continue and generate a draft order randomly.');
      let prompt = ui.alert(text,ui.ButtonSet.OK_CANCEL);
      if (prompt == 'CANCEL') {
        Logger.log('Duplicate entry of ' + check.text + ' in manual draft order list');
        return false;
      } else if (prompt == 'OK') {
        Logger.log('Manual draft entries are being disregarded, continuing');
      } else {
        return false;
      }
    } else {
      Logger.log('All members accounted for in manual draft order');
    }
  } else {
    Logger.log('No manual order entered, random draft order will be used');
  }

  let positions = ss.getRangeByName('COUNT').getValues().flat();
  let total = positions.reduce((x, y) => {
    return x + y
  },0);

  if (total == 0) {
    Logger.log('No positions selected, canceling');
    return false;
  } else {
    ss.toast('All user inputs validated, continuing setup.');
    return true;
  }
}

// DRAFT BOARD CLEAN
// Function to clean up draft board
function draftLobbyClean(ss) {
  deleteTriggers();
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const darkNavy = '#222735';
  const lobbySheet = ss.getSheetByName('DRAFT_LOBBY');
  const rankSheet = ss.getSheetByName('DRAFT_LIST');
  const draftHeaders = ss.getRangeByName('DRAFT_HEADERS').getValues().flat();
  let players = rankSheet.getLastRow()-1;
  let firstRowFormulas = lobbySheet.getRange(3,1,1,lobbySheet.getMaxColumns()).getFormulas().flat();
  let formulaCols = firstRowFormulas.map(x => x != '');

  let draftRows = lobbySheet.getMaxRows();
  
  // Adding and removing rows as needed
  adjustRows(lobbySheet,ss.getRangeByName('DRAFT_LIST_ID').getNumRows()+2);
  draftRows = lobbySheet.getMaxRows();

  // Reset all indices down column 2, as well as propogate all formulas down the specified columns in formulaCols array
  let arr = [];
  let index = [];
  for (let a = 1; a <= players; a++) {
    arr = [a];
    index.push(arr);
  }
  
  let indexRange = lobbySheet.getRange(3,3,draftRows-2,1);
  indexRange.setValues(index);
  
  for (let a = 0; a < formulaCols.length; a++ ) {
    if ( formulaCols[a] == true ) {
      let draftFormula = lobbySheet.getRange(3,a+1).getFormulaR1C1();
      for ( let b = 1; b < draftRows - 2; b++ ) {
        lobbySheet.getRange(b+3,a+1).setFormulaR1C1(draftFormula);
      }
    }
  }

  let sleeperId = ss.getRangeByName('SLPR_PLAYER_ID').getValues().flat();
  let sleeperOutlook = ss.getRangeByName('SLPR_OUTLOOK').getValues().flat();
  let id, outlook;
  for (let a = 3; a <= draftRows; a++ ) {
    lobbySheet.getRange(a,5).clearNote();
    id = lobbySheet.getRange(a,1).getValue();
    outlook = sleeperOutlook[sleeperId.indexOf(id)];
    if ( outlook != '' ) {
      lobbySheet.getRange(a,5).setNote(outlook);
    }
  }
  lobbySheet.getRange(3,1,draftRows - 2,lobbySheet.getMaxColumns())
    .setBorder(false,false,false,false,false,true,darkNavy,SpreadsheetApp.BorderStyle.SOLID_THICK);

  ss.setNamedRange('DRAFT_CHECKBOXES',lobbySheet.getRange(3,2,draftRows - 2,1)); // No static value in the DRAFT_HEADERS range, displays format in this cell
  ss.setNamedRange('DRAFT_ID',lobbySheet.getRange(3,draftHeaders.indexOf('ID')+1,draftRows - 2,1));
  ss.setNamedRange('DRAFT_PLAYER',lobbySheet.getRange(3,draftHeaders.indexOf('PLAYER')+1,draftRows - 2,3));
  ss.setNamedRange('DRAFT_POS',lobbySheet.getRange(3,draftHeaders.indexOf('POS')+1,draftRows - 2,1));
  ss.setNamedRange('DRAFT_HEALTH',lobbySheet.getRange(3,draftHeaders.indexOf('HEALTH')+1,draftRows - 2,1));
  
  // Prep for filter values
  let ssId = ss.getId();
  let lastRow = lobbySheet.getLastRow();
  let lastColumn = lobbySheet.getLastColumn();
  const sheetId = lobbySheet.getSheetId();
  
  // Filter specifics
  const filterSettings = {
    "range": {
      "sheetId": sheetId,
      "startRowIndex": 1,
      "endRowIndex": lastRow,
      "startColumnIndex": 0,
      "endColumnIndex": lastColumn
    }
  };
  
  // Filter request
  let requests = [{
    "setBasicFilter": {
      "filter": filterSettings
    }
  }];
  
  // Pushing the API request
  const url = "https://sheets.googleapis.com/v4/spreadsheets/" + ssId + ":batchUpdate";
  const params = {
    method:"post",
    contentType: "application/json",
    headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken()},
    payload: JSON.stringify({"requests": requests}),
    muteHttpExceptions: true,
  };
  
  let res = UrlFetchApp.fetch(url, params).getContentText();
  ss.toast('Draft Board Cleaned Up');
  
  triggersStandard();
}

// DRAFT LIST
// Creates a sheet that has all eligible players on it (by Sleeper ID) and has their ordered spot based on projection
function draftList() {
  deleteTriggers();
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let sheet = ss.getSheetByName('DRAFT_LIST');
  if (sheet == null) {
    ss.insertSheet('DRAFT_LIST');
    sheet = ss.getSheetByName('DRAFT_LIST');
  }
  sheet.clear();
  
  let sourceID = ss.getRangeByName('SLPR_PLAYER_ID').getValues().flat();
  let sourcePOS = ss.getRangeByName('SLPR_FANTASY_POSITIONS').getValues().flat();
  
  let positions = ['QB','RB','WR','TE','K','DEF'];
  for (let a = positions.length-1; a > 0; a--) {
    if (ss.getRangeByName('COUNT_'+positions[a]).getValue() == 0) {
      positions.splice(a,1);
    }
  }  
  let positionDups = [];
  let positionRank = [];
  for (let a = 0; a < positions.length; a++) {
    positionDups.push(ss.getRangeByName('DUP_' + positions[a]).getValue());
    positionRank.push(1);
  }
  let arr = [];
  let data = [];
  let count = 1;
  for (let a = 0; a < sourcePOS.length; a++){
    if (positions.indexOf(sourcePOS[a]) >= 0) {
      for (let b = -1; b < positionDups[positions.indexOf(sourcePOS[a])]; b++) {
        arr = []
        arr.push(count);
        count++;
        arr.push(sourceID[a]);
        arr.push(positionRank[positions.indexOf(sourcePOS[a])]);
        data.push(arr);
      }
      positionRank[positions.indexOf(sourcePOS[a])] = positionRank[positions.indexOf(sourcePOS[a])] + 1;
    }
  }
  headers = ['RNK','ID','POS_RNK'];
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
  let dataRange = sheet.getRange(2,1,data.length,headers.length);
  dataRange.setValues(data);
  dataRange.setHorizontalAlignment('right');
  sheet.setColumnWidths(1,headers.length,70);
  adjustRows(sheet,data.length+1);
  adjustColumns(sheet,headers.length);

  ss.setNamedRange('DRAFT_LIST_RNK',sheet.getRange(2,headers.indexOf('RNK')+1,count-1,1));
  ss.setNamedRange('DRAFT_LIST_ID',sheet.getRange(2,headers.indexOf('ID')+1,count-1,1));
  ss.setNamedRange('DRAFT_LIST_POS_RNK',sheet.getRange(2,headers.indexOf('POS_RNK')+1,count-1,1));

  ss.toast('Created list of draftable players.');
  createTriggers();
}

// EXISTING DRAFT
// Function to check if there are any picked entries on the PICKS sheet and return an array with both picked quantity and remaining to pick quantity
function existingDraft(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ids = ss.getRangeByName('PICKS_ID').getValues().flat();
  const owners = ss.getRangeByName('PICKS_NAME').getValues().flat();
  let picked = owners.filter((value, index) => (typeof ids[index] === 'number' && owners[index] != 'End'));
  let remaining = owners.filter((value, index) => (typeof ids[index] === 'string' && ids[index].trim() === '' && owners[index] != 'End' && owners[index].length > 0));
  return [picked.length,remaining.length];
}

// START DRAFTING
// Creates the dynamicDrafter trigger and prompts for first draft picker as well as displays initial roster
function startDrafting(){
  triggersDrafting();
  toolbar('draft');
  let obj = nextDrafter();
  Logger.log(JSON.stringify(obj));
  const ui = SpreadsheetApp.getUi();
  let rosterFresh = obj.roster.indexOf('') > -1 ? '' : 'Starting Roster:\r\n' + arrayToString(arrayClean(obj.roster),false) + '\r\n\r\n' ;
  let startTxt = obj.roster.indexOf('') > -1 ? 'THE DRAFT HAS BEEN RESTARTED\r\n\r\n' : 'THE DRAFT HAS BEGUN\r\n\r\n' ;
  ui.alert(startTxt + obj.picker + ' is on the clock!\r\n\r\n' + rosterFresh + 'Use the Challenge Flag to UNDO the last pick.',ui.ButtonSet.OK);
}


// 2024 - Created by Ben Powers
// ben.powers.creative@gmail.com
