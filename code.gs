const SPREADSHEET_ID = "ここにスプレッドシートID";
const SHEET_NAME = "運行計画";


// =====================================
// Web API
// =====================================
function doGet(e) {

    const action = e && e.parameter
        ? e.parameter.action
        : "";

    if (action === "getSchedule") {
        return getSchedule();
    }

    if (action === "recordActual") {
        return recordActual(e);
    }

    return createJsonResponse({
        success: false,
        message: "actionが指定されていません"
    });
}


// =====================================
// 本日の運行予定取得
// =====================================
function getSchedule() {

    const sheet = SpreadsheetApp
        .openById(SPREADSHEET_ID)
        .getSheetByName(SHEET_NAME);

    if (!sheet) {
        return createJsonResponse({
            success: false,
            message: "シートが見つかりません"
        });
    }

    const values = sheet.getDataRange().getValues();

    if (values.length < 2) {
        return createJsonResponse({
            success: true,
            data: []
        });
    }

    const rows = values.slice(1);

    const today = new Date();

    const todayString = Utilities.formatDate(
        today,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
    );

    const result = [];

    rows.forEach(function(row, index) {

        const transportDate = formatDateValue(row[2]);

        if (transportDate !== todayString) {
            return;
        }

        result.push({

            rowNumber: index + 2,

            vehicle: row[0] || "",
            driver: row[1] || "",

            date: transportDate,

            plannedDeparture:
                formatTimeValue(row[3]),

            plannedEnd:
                formatTimeValue(row[5]),

            destination:
                row[6] || "",

            route:
                row[7] || "",

            detail1:
                row[8] || "",

            detail2:
                row[9] || "",

            detail3:
                row[10] || "",

            unloadingPlace:
                row[11] || "",

            actualDeparture:
                formatTimeValue(row[12]),

            actualArrival:
                formatTimeValue(row[13]),

            actualReturn:
                formatTimeValue(row[14]),

            duration:
                row[15] || ""
        });
    });

    return createJsonResponse({
        success: true,
        data: result
    });
}


// =====================================
// 実績記録
// =====================================
function recordActual(e) {

    const rowNumber =
        Number(e.parameter.rowNumber);

    const type =
        e.parameter.type;

    if (!rowNumber || !type) {

        return createJsonResponse({
            success: false,
            message: "必要な情報がありません"
        });
    }

    const sheet = SpreadsheetApp
        .openById(SPREADSHEET_ID)
        .getSheetByName(SHEET_NAME);

    if (!sheet) {

        return createJsonResponse({
            success: false,
            message: "シートが見つかりません"
        });
    }

    const actualDeparture =
        sheet.getRange(rowNumber, 13).getValue();

    const actualArrival =
        sheet.getRange(rowNumber, 14).getValue();

    const actualReturn =
        sheet.getRange(rowNumber, 15).getValue();

    const now = new Date();

    let column;

    // ---------------------------------
    // 出発
    // ---------------------------------
    if (type === "departure") {

        if (actualDeparture) {

            return createJsonResponse({
                success: false,
                message: "出発時刻はすでに記録されています"
            });
        }

        column = 13;
    }

    // ---------------------------------
    // 到着
    // ---------------------------------
    else if (type === "arrival") {

        if (!actualDeparture) {

            return createJsonResponse({
                success: false,
                message: "先に出発を記録してください"
            });
        }

        if (actualArrival) {

            return createJsonResponse({
                success: false,
                message: "到着時刻はすでに記録されています"
            });
        }

        column = 14;
    }

    // ---------------------------------
    // 帰着
    // ---------------------------------
    else if (type === "return") {

        if (!actualDeparture) {

            return createJsonResponse({
                success: false,
                message: "先に出発を記録してください"
            });
        }

        if (!actualArrival) {

            return createJsonResponse({
                success: false,
                message: "先に到着を記録してください"
            });
        }

        if (actualReturn) {

            return createJsonResponse({
                success: false,
                message: "帰着時刻はすでに記録されています"
            });
        }

        column = 15;
    }

    else {

        return createJsonResponse({
            success: false,
            message: "不正な実績種別です"
        });
    }


    // ---------------------------------
    // 時刻を書き込み
    // ---------------------------------
    sheet
        .getRange(rowNumber, column)
        .setValue(now);

    sheet
        .getRange(rowNumber, column)
        .setNumberFormat("HH:mm");


    // ---------------------------------
    // 帰着時に所要時間計算
    // ---------------------------------
    if (type === "return") {

        calculateDuration(
            sheet,
            rowNumber
        );
    }


    return createJsonResponse({
        success: true,

        time: Utilities.formatDate(
            now,
            Session.getScriptTimeZone(),
            "HH:mm"
        )
    });
}


// =====================================
// 所要時間計算
// =====================================
function calculateDuration(
    sheet,
    rowNumber
) {

    const departure =
        sheet.getRange(rowNumber, 13).getValue();

    const returnTime =
        sheet.getRange(rowNumber, 15).getValue();

    if (!departure || !returnTime) {
        return;
    }

    const diff =
        returnTime.getTime() -
        departure.getTime();

    if (diff < 0) {
        return;
    }

    const minutes =
        Math.floor(diff / 1000 / 60);

    const hours =
        Math.floor(minutes / 60);

    const remainingMinutes =
        minutes % 60;

    let result = "";

    if (hours > 0) {
        result += hours + "時間 ";
    }

    result += remainingMinutes + "分";

    sheet
        .getRange(rowNumber, 16)
        .setValue(result);
}


// =====================================
// 日付
// =====================================
function formatDateValue(value) {

    if (!value) {
        return "";
    }

    if (
        Object.prototype.toString.call(value)
        === "[object Date]"
    ) {

        return Utilities.formatDate(
            value,
            Session.getScriptTimeZone(),
            "yyyy-MM-dd"
        );
    }

    return String(value);
}


// =====================================
// 時刻
// =====================================
function formatTimeValue(value) {

    if (!value) {
        return "";
    }

    if (
        Object.prototype.toString.call(value)
        === "[object Date]"
    ) {

        return Utilities.formatDate(
            value,
            Session.getScriptTimeZone(),
            "HH:mm"
        );
    }

    return String(value);
}


// =====================================
// JSON
// =====================================
function createJsonResponse(data) {

    return ContentService
        .createTextOutput(
            JSON.stringify(data)
        )
        .setMimeType(
            ContentService.MimeType.JSON
        );
}