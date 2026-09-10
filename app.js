const API_URL =
  "https://script.google.com/macros/s/AKfycbyeTDWPcKy5V5vuCWg8xNEsgo_YQ2Fqwn6ofAy42yVbQZumfAi35q38CBFQ_EAuYxl8/exec";


const input =
  document.getElementById("caseNumber");

const searchButton =
  document.getElementById("searchButton");

const message =
  document.getElementById("message");

const results =
  document.getElementById("results");


searchButton.addEventListener(
  "click",
  searchCase
);


input.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {
      searchCase();
    }

  }
);


function searchCase() {

  const caseNumber =
    input.value.trim();

  message.textContent = "";
  message.className = "";

  results.innerHTML = "";


  if (!caseNumber) {

    showMessage(
      "Please enter a Case Number.",
      "error"
    );

    input.focus();

    return;
  }


  searchButton.disabled = true;
  searchButton.textContent = "Searching...";


  const callbackName =
    "caseSearchCallback_" + Date.now();


  const script =
    document.createElement("script");


  let finished = false;


  window[callbackName] =
    function(data) {

      finished = true;

      delete window[callbackName];

      script.remove();


      if (!data.success) {

        showMessage(
          data.message ||
          "Case not found.",
          "error"
        );

        resetButton();

        return;
      }


      showMessage(
        `${data.count} record(s) found.`,
        "success"
      );


      renderRecords(
        data.records
      );


      resetButton();
    };


  script.onerror =
    function() {

      if (finished) return;

      finished = true;

      delete window[callbackName];

      script.remove();


      showMessage(
        "Unable to retrieve case details. Please try again.",
        "error"
      );


      resetButton();
    };


  script.src =
    API_URL +
    "?case=" +
    encodeURIComponent(caseNumber) +
    "&callback=" +
    encodeURIComponent(callbackName);


  document.body.appendChild(script);
}


function resetButton() {

  searchButton.disabled = false;

  searchButton.textContent = "Search";
}


function renderRecords(records) {

  results.innerHTML = "";


  records.forEach(record => {

    const card =
      document.createElement("article");

    card.className =
      "case-card";


    const heading =
      document.createElement("h2");

    heading.textContent =
      "Case Details";


    card.appendChild(heading);


    card.appendChild(
      createDetail(
        "Case No.",
        record.caseNumber
      )
    );


    card.appendChild(
      createDetail(
        "Case",
        record.caseTitle
      )
    );


    card.appendChild(
      createDetail(
        "Next Date",
        record.nextDate ||
        "Not available",
        "next-date"
      )
    );


    card.appendChild(
      createDetail(
        "Stage",
        record.stage ||
        "Not available",
        "stage"
      )
    );


    results.appendChild(card);

  });
}


function createDetail(
  label,
  value,
  valueClass = ""
) {

  const row =
    document.createElement("div");

  row.className =
    "detail";


  const labelElement =
    document.createElement("div");

  labelElement.className =
    "detail-label";

  labelElement.textContent =
    label;


  const valueElement =
    document.createElement("div");


  if (valueClass) {
    valueElement.className =
      valueClass;
  }


  valueElement.textContent =
    value || "-";


  row.appendChild(labelElement);
  row.appendChild(valueElement);


  return row;
}


function showMessage(text, type) {

  message.textContent =
    text;

  message.className =
    type;
}
