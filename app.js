const API_URL =
  "https://script.google.com/macros/s/AKfycbyeTDWPcKy5V5vuCWg8xNEsgo_YQ2Fqwn6ofAy42yVbQZumfAi35q38CBFQ_EAuYxl8/exec";

const input = document.getElementById("caseNumber");
const searchButton = document.getElementById("searchButton");
const message = document.getElementById("message");
const results = document.getElementById("results");

searchButton.addEventListener("click", searchCase);

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    searchCase();
  }
});

async function searchCase() {

  const caseNumber = input.value.trim();

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

  try {

    const url =
      `${API_URL}?case=${encodeURIComponent(caseNumber)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    if (!data.success) {
      showMessage(
        data.message || "Case not found.",
        "error"
      );
      return;
    }

    showMessage(
      `${data.count} record(s) found.`,
      "success"
    );

    renderRecords(data.records);

  } catch (error) {

    console.error(error);

    showMessage(
      "Unable to retrieve case details. Please try again.",
      "error"
    );

  } finally {

    searchButton.disabled = false;
    searchButton.textContent = "Search";

  }
}

function renderRecords(records) {

  results.innerHTML = "";

  records.forEach(record => {

    const card = document.createElement("article");
    card.className = "case-card";

    const heading = document.createElement("h2");
    heading.textContent = "Case Details";

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
        record.nextDate || "Not available",
        "next-date"
      )
    );

    card.appendChild(
      createDetail(
        "Stage",
        record.stage || "Not available",
        "stage"
      )
    );

    results.appendChild(card);

  });
}

function createDetail(label, value, valueClass = "") {

  const row = document.createElement("div");
  row.className = "detail";

  const labelElement =
    document.createElement("div");

  labelElement.className = "detail-label";
  labelElement.textContent = label;

  const valueElement =
    document.createElement("div");

  if (valueClass) {
    valueElement.className = valueClass;
  }

  valueElement.textContent =
    value || "-";

  row.appendChild(labelElement);
  row.appendChild(valueElement);

  return row;
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = type;
}


/* Register PWA service worker */

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./sw.js")
      .catch(error => {
        console.error(
          "Service Worker registration failed:",
          error
        );
      });

  });

}