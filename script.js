const API_URL = "https://script.google.com/macros/s/AKfycbzIvltWLwlFN-haLdBhJl9tSk_8BbAai5cFSMJqiyWwWw_LVUgSZsmksaKyaftucpzd/exec";

let scheduleData = [];


// =====================================
// 初期処理
// =====================================
document.addEventListener("DOMContentLoaded", function () {

    setToday();

    setDefaultDate();

    document
        .getElementById("vehicleSelect")
        .addEventListener(
            "change",
            loadSchedule
        );

    document
        .getElementById("dateSelect")
        .addEventListener(
            "change",
            loadSchedule
        );

    document
        .getElementById("refreshButton")
        .addEventListener(
            "click",
            loadSchedule
        );

    loadVehicles();
});


// =====================================
// 今日の日付表示
// =====================================
function setToday() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    document
        .getElementById("todayDate")
        .textContent =
        year + "/" + month + "/" + day;
}


// =====================================
// 日付初期値
// =====================================
function setDefaultDate() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    document
        .getElementById("dateSelect")
        .value =
        year + "-" + month + "-" + day;
}


// =====================================
// 車種一覧取得
// =====================================
function loadVehicles() {

    const select =
        document.getElementById(
            "vehicleSelect"
        );

    select.innerHTML =
        '<option value="">読み込み中...</option>';

    fetch(
        API_URL +
        "?action=getVehicles"
    )
        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "車種取得エラー"
                );
            }

            return response.json();
        })
        .then(function (result) {

            if (!result.success) {
                throw new Error(
                    result.message ||
                    "車種を取得できません"
                );
            }

            select.innerHTML =
                '<option value="">' +
                "車種を選択してください" +
                "</option>";

            result.data.forEach(
                function (vehicle) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        vehicle;

                    option.textContent =
                        vehicle;

                    select.appendChild(
                        option
                    );
                }
            );
        })
        .catch(function (error) {

            console.error(error);

            select.innerHTML =
                '<option value="">' +
                "車種を取得できません" +
                "</option>";
        });
}


// =====================================
// 運行取得
// =====================================
function loadSchedule() {

    const vehicle =
        document.getElementById(
            "vehicleSelect"
        ).value;

    const date =
        document.getElementById(
            "dateSelect"
        ).value;

    const list =
        document.getElementById(
            "scheduleList"
        );


    if (!vehicle) {

        list.innerHTML =
            '<div class="loading">' +
            "車種を選択してください" +
            "</div>";

        document
            .getElementById("driverName")
            .textContent = "--";

        return;
    }


    if (!date) {

        list.innerHTML =
            '<div class="loading">' +
            "運送日を選択してください" +
            "</div>";

        return;
    }


    list.innerHTML =
        '<div class="loading">' +
        "読み込み中..." +
        "</div>";


    const url =
        API_URL +
        "?action=getSchedule" +
        "&date=" +
        encodeURIComponent(date) +
        "&vehicle=" +
        encodeURIComponent(vehicle);


    fetch(url)
        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "通信エラー"
                );
            }

            return response.json();
        })
        .then(function (result) {

            if (!result.success) {
                throw new Error(
                    result.message ||
                    "データ取得エラー"
                );
            }

            scheduleData =
                result.data || [];

            displaySchedule(
                scheduleData
            );
        })
        .catch(function (error) {

            console.error(error);

            list.innerHTML =
                '<div class="loading">' +
                "運行予定を取得できませんでした。" +
                "</div>";
        });
}


// =====================================
// 運行表示
// =====================================
function displaySchedule(data) {

    const list =
        document.getElementById(
            "scheduleList"
        );

    list.innerHTML = "";


    if (!data || data.length === 0) {

        list.innerHTML =
            '<div class="loading">' +
            "この車種の運行予定はありません。" +
            "</div>";

        document
            .getElementById("driverName")
            .textContent = "--";

        return;
    }


    document
        .getElementById("driverName")
        .textContent =
        data[0].driver || "--";


    data.forEach(
        function (item, index) {

            const card =
                document.createElement("div");

            card.className =
                "schedule-card";


            let detail = "";

            if (item.detail1) {
                detail += item.detail1;
            }

            if (item.detail2) {

                if (detail) {
                    detail += " / ";
                }

                detail += item.detail2;
            }

            if (item.detail3) {

                if (detail) {
                    detail += " / ";
                }

                detail += item.detail3;
            }


            const isLast =
                index === data.length - 1;


            card.innerHTML =

                '<div class="schedule-number">' +
                "運行 " +
                (index + 1) +
                "</div>" +

                '<div class="schedule-time">' +
                (item.plannedDeparture || "--:--") +
                " ～ " +
                (item.plannedEnd || "--:--") +
                "</div>" +

                '<div class="schedule-destination">' +
                (item.destination || "") +
                "</div>" +

                (
                    item.route
                        ? '<div class="schedule-route">' +
                          "経由：" +
                          item.route +
                          "</div>"
                        : ""
                ) +

                (
                    detail
                        ? '<div class="schedule-detail">' +
                          detail +
                          "</div>"
                        : ""
                ) +

                (
                    item.unloadingPlace
                        ? '<div class="schedule-route">' +
                          "荷降ろし：" +
                          item.unloadingPlace +
                          "</div>"
                        : ""
                ) +

                '<div class="actual-control">' +

                createActualRow(
                    "出発",
                    "departure",
                    item.rowNumber,
                    item.actualDeparture
                ) +

                createActualRow(
                    "到着",
                    "arrival",
                    item.rowNumber,
                    item.actualArrival
                ) +

                createActualRow(
                    isLast
                        ? "帰着"
                        : "次へ出発",
                    "return",
                    item.rowNumber,
                    item.actualReturn,
                    isLast
                ) +

                '<div class="duration-row">' +

                '<span class="duration-label">' +
                "所要時間" +
                "</span>" +

                '<strong class="duration-value" ' +
                'id="duration-' +
                item.rowNumber +
                '">' +
                (
                    item.duration ||
                    "--時間 --分"
                ) +
                "</strong>" +

                "</div>" +

                "</div>";


            list.appendChild(card);
        }
    );


    document
        .querySelectorAll(".action-button")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    recordActual(
                        Number(
                            this.dataset.row
                        ),
                        this.dataset.type,
                        this
                    );
                }
            );
        });
}


// =====================================
// 実績行作成
// =====================================
function createActualRow(
    label,
    type,
    rowNumber,
    actualTime,
    isLast
) {

    const done =
        !!actualTime;

    return (

        '<div class="actual-result-row">' +

        '<span>' +
        label +
        "</span>" +

        '<strong id="' +
        type +
        "-" +
        rowNumber +
        '">' +
        (
            actualTime ||
            "--:--"
        ) +
        "</strong>" +

        '<button ' +
        'class="action-button ' +
        type +
        '" ' +
        'data-row="' +
        rowNumber +
        '" ' +
        'data-type="' +
        type +
        '" ' +
        (
            done
                ? "disabled"
                : ""
        ) +
        ">" +

        (
            type === "return"
                ? (
                    isLast
                        ? "帰着"
                        : "次へ出発"
                )
                : label
        ) +

        "</button>" +

        "</div>"
    );
}


// =====================================
// 実績記録
// =====================================
function recordActual(
    rowNumber,
    type,
    button
) {

    if (button.disabled) {
        return;
    }

    button.disabled = true;


    const displayId =
        type +
        "-" +
        rowNumber;


    const time =
        getCurrentTime();


    document
        .getElementById(displayId)
        .textContent =
        time;


    const url =
        API_URL +
        "?action=recordActual" +
        "&rowNumber=" +
        encodeURIComponent(rowNumber) +
        "&type=" +
        encodeURIComponent(type);


    fetch(url)
        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "送信エラー"
                );
            }

            return response.json();
        })
        .then(function (result) {

            if (!result.success) {

                throw new Error(
                    result.message ||
                    "記録に失敗しました"
                );
            }

            showStatus(
                "実績を記録しました。"
            );

            loadSchedule();
        })
        .catch(function (error) {

            console.error(error);

            button.disabled = false;

            document
                .getElementById(displayId)
                .textContent =
                "--:--";

            showStatus(
                error.message ||
                "実績の送信に失敗しました。"
            );
        });
}


// =====================================
// 現在時刻
// =====================================
function getCurrentTime() {

    const now = new Date();

    const hours =
        String(now.getHours())
            .padStart(2, "0");

    const minutes =
        String(now.getMinutes())
            .padStart(2, "0");

    return hours + ":" + minutes;
}


// =====================================
// ステータス
// =====================================
function showStatus(message) {

    const element =
        document.getElementById(
            "statusMessage"
        );

    element.textContent =
        message;

    setTimeout(function () {

        element.textContent = "";

    }, 3000);
}