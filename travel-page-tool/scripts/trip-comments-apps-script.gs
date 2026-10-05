/**
 * Paste this into the existing Google Apps Script bound to the comments sheet,
 * then Deploy > Manage deployments > New version (same web app URL).
 *
 * Sheet header row should be: Date | Name | Message | Trip | Page | Approved
 * Older rows with only Date/Name/Message still work.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  ensureHeaders_(sheet);
  sheet.appendRow([
    new Date(),
    (e.parameter.cName || '').toString().slice(0, 80),
    (e.parameter.cMessage || '').toString().slice(0, 2000),
    (e.parameter.cTrip || '').toString().slice(0, 120),
    (e.parameter.cPage || '').toString().slice(0, 240),
    true,
  ]);
  return json_({ ok: true });
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var trip = ((e && e.parameter && e.parameter.trip) || '').toString();
  var values = sheet.getDataRange().getValues();
  var comments = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var approved = row[5] === '' || row[5] === true || String(row[5]).toLowerCase() === 'true';
    if (!approved) continue;
    if (trip && row[3] && String(row[3]) !== trip) continue;
    comments.push({
      date: row[0],
      name: row[1],
      text: row[2],
      trip: row[3] || '',
    });
  }
  return json_({ comments: comments });
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow(['Date', 'Name', 'Message', 'Trip', 'Page', 'Approved']);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
