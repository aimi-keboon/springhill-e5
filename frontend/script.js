const API_URL = "https://script.google.com/macros/s/AKfycbz4BZXk8xXab4sMbEJnOOjvkbn35bilq02IWFOG7ufmYozGMVu7MctuvKWr5MZ7Cq12Tg/exec";

function showSection(sectionId) {
  const sections = document.querySelectorAll(".panel");

  sections.forEach((section) => {
    section.classList.add("hidden");
  });

  const selectedSection = document.getElementById(sectionId);

  if (selectedSection) {
    selectedSection.classList.remove("hidden");
    selectedSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

async function testBackendConnection() {
  const statusBox = document.getElementById("backendStatus");

  if (!statusBox) return;

  try {
    statusBox.textContent = "Checking backend connection...";

    const response = await fetch(API_URL);
    const result = await response.json();

    if (result.success) {
      statusBox.textContent = "Backend connected successfully.";
      statusBox.className = "status success";
    } else {
      statusBox.textContent = "Backend responded, but connection failed.";
      statusBox.className = "status error";
    }
  } catch (error) {
    statusBox.textContent = "Backend connection failed: " + error.message;
    statusBox.className = "status error";
  }
}

function addTransportRow() {
  const transportRows = document.getElementById("transportRows");

  const row = document.createElement("div");
  row.className = "repeat-row";

  row.innerHTML = `
    <label>
      Transport / Vehicle Type
      <select name="transportType[]">
        <option value="">Select type</option>
        <option value="Car">Car</option>
        <option value="Motorcycle">Motorcycle</option>
        <option value="Van">Van</option>
        <option value="Lorry">Lorry</option>
        <option value="Other">Other</option>
      </select>
    </label>

    <label>
      Registration / Identification No.
      <input type="text" name="transportRegistration[]" placeholder="Example: VAB1234" />
    </label>

    <button type="button" class="remove-button" onclick="removeRow(this)">
      Remove
    </button>
  `;

  transportRows.appendChild(row);
}

function addFamilyRow() {
  const familyRows = document.getElementById("familyRows");

  const row = document.createElement("div");
  row.className = "repeat-row family-row";

  row.innerHTML = `
    <label>
      Family Member Name
      <input type="text" name="familyMemberName[]" />
    </label>

    <label>
      Relationship with Owner
      <input type="text" name="familyMemberRelationship[]" placeholder="Example: Spouse, Child, Parent" />
    </label>

    <button type="button" class="remove-button" onclick="removeRow(this)">
      Remove
    </button>
  `;

  familyRows.appendChild(row);
}

function removeRow(button) {
  button.closest(".repeat-row").remove();
}
function getFormValuesByName(form, fieldName) {
  return Array.from(form.querySelectorAll(`[name="${fieldName}"]`))
    .map((input) => input.value.trim())
    .filter((value) => value !== "");
}

function collectTransportDetails(form) {
  const types = getFormValuesByName(form, "transportType[]");
  const registrations = getFormValuesByName(form, "transportRegistration[]");

  return types.map((type, index) => ({
    type: type,
    registration: registrations[index] || "",
  }));
}

function collectFamilyMembers(form) {
  const names = getFormValuesByName(form, "familyMemberName[]");
  const relationships = getFormValuesByName(form, "familyMemberRelationship[]");

  return names.map((name, index) => ({
    name: name,
    relationship: relationships[index] || "",
  }));
}

async function submitResidentForm(event) {
  event.preventDefault();

  const form = event.target;
  const statusBox = document.getElementById("residentFormStatus");

  statusBox.textContent = "Submitting registration...";

  const formData = new FormData(form);

  const payload = {
    action: "submitResidentRegistration",
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    unitNo: formData.get("unitNo"),
    residentType: formData.get("residentType"),
    transportDetails: collectTransportDetails(form),
    familyMembers: collectFamilyMembers(form),
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      statusBox.textContent = "Registration submitted successfully. Please wait for committee approval.";
      form.reset();

      document.getElementById("transportRows").innerHTML = "";
      document.getElementById("familyRows").innerHTML = "";
    } else {
      statusBox.textContent = "Submission failed: " + result.message;
    }
  } catch (error) {
    statusBox.textContent = "Submission failed: " + error.message;
  }
}
function calculateEventFeePreview() {
  const eventForm = document.getElementById("eventForm");
  const feePreview = document.getElementById("eventFeePreview");

  if (!eventForm || !feePreview) return;

  const organiserType = eventForm.organiserType.value;
  const duration = Number(eventForm.websiteDurationDays.value || 0);
  const blastCount = Number(eventForm.whatsappBlastCount.value || 0);

  let websiteFee = 0;

  if (duration === 7) websiteFee = 50;
  if (duration === 14) websiteFee = 80;
  if (duration === 30) websiteFee = 120;

  const whatsappFee = blastCount * 20;
  let totalFee = websiteFee + whatsappFee;

  if (organiserType === "Resident / Member") {
    totalFee = totalFee * 0.5;
  }

  if (!organiserType || !duration || eventForm.whatsappBlastCount.value === "") {
    feePreview.textContent = "Please select organiser type, duration, and WhatsApp blast count.";
    return;
  }

  feePreview.textContent = `RM${totalFee.toFixed(2)}`;
}
function toggleResidentOfferFields() {
  const offerAvailable = document.getElementById("residentOfferAvailable");
  const offerFields = document.getElementById("residentOfferFields");

  if (!offerAvailable || !offerFields) return;

  if (offerAvailable.value === "Yes") {
    offerFields.classList.remove("hidden");
  } else {
    offerFields.classList.add("hidden");

    const inputs = offerFields.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
      input.value = "";
    });
  }
}
async function submitEventForm(event) {
  event.preventDefault();

  const form = event.target;
  const statusBox = document.getElementById("eventFormStatus");

  statusBox.textContent = "Submitting event promotion...";

  const formData = new FormData(form);

  const payload = {
    action: "submitEventPromotion",
    organiserType: formData.get("organiserType"),
    organiserName: formData.get("organiserName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    unitNo: formData.get("unitNo"),
    eventTitle: formData.get("eventTitle"),
    eventDescription: formData.get("eventDescription"),
    eventDate: formData.get("eventDate"),
    eventTime: formData.get("eventTime"),
    eventLocation: formData.get("eventLocation"),
    eventPosterUrl: formData.get("eventPosterUrl"),
    registrationLink: formData.get("registrationLink"),
    websiteDurationDays: formData.get("websiteDurationDays"),
    whatsappBlastCount: formData.get("whatsappBlastCount"),
    preferredBlastDates: formData.get("preferredBlastDates"),
    residentOfferAvailable: formData.get("residentOfferAvailable"),
    residentOfferTitle: formData.get("residentOfferTitle"),
    residentOfferDescription: formData.get("residentOfferDescription"),
    normalPrice: formData.get("normalPrice"),
    residentPrice: formData.get("residentPrice"),
    promoCode: formData.get("promoCode"),
    offerExpiryDate: formData.get("offerExpiryDate"),
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      statusBox.textContent = "Event promotion submitted successfully. Please wait for admin review.";
      form.reset();
    } else {
      statusBox.textContent = "Submission failed: " + result.message;
    }
  } catch (error) {
    statusBox.textContent = "Submission failed: " + error.message;
  }
}
async function loadApprovedEvents() {
  const eventsList = document.getElementById("approvedEventsList");

  if (!eventsList) return;

  eventsList.innerHTML = "<p>Loading approved events...</p>";

  try {
    const response = await fetch(`${API_URL}?action=getApprovedEvents`);
    const result = await response.json();

    if (!result.success) {
      eventsList.innerHTML = `<p>Unable to load events: ${result.message}</p>`;
      return;
    }

    const events = result.data.events || [];

    if (events.length === 0) {
      eventsList.innerHTML = "<p>No approved events available at the moment.</p>";
      return;
    }

    eventsList.innerHTML = events.map((event) => {
      const offerBadge = event.residentOfferAvailable === "Yes"
        ? `<span class="event-badge">Resident Offer Available</span>`
        : "";

      const poster = event.eventPosterUrl
        ? `<img src="${event.eventPosterUrl}" alt="${event.eventTitle}" class="event-poster" />`
        : "";

      const registrationButton = event.registrationLink
        ? `<a href="${event.registrationLink}" target="_blank" class="event-link">Register / Contact</a>`
        : "";

      const offerDetails = event.residentOfferAvailable === "Yes"
        ? `
          <div class="resident-offer">
            <strong>${event.residentOfferTitle || "Special Offer for Residents"}</strong>
            <p>${event.residentOfferDescription || ""}</p>
            ${event.normalPrice ? `<p><b>Normal Price:</b> ${event.normalPrice}</p>` : ""}
            ${event.residentPrice ? `<p><b>Resident Price:</b> ${event.residentPrice}</p>` : ""}
            ${event.promoCode ? `<p><b>Promo Code:</b> ${event.promoCode}</p>` : ""}
          </div>
        `
        : "";

      return `
        <article class="event-card">
          ${poster}
          <div class="event-content">
            ${offerBadge}
            <h3>${event.eventTitle || "Untitled Event"}</h3>
            <p>${event.eventDescription || ""}</p>
            <p><b>Date:</b> ${formatDisplayDate(event.eventDate)}</p>
            <p><b>Time:</b> ${formatDisplayTime(event.eventTime)}</p>
            <p><b>Location:</b> ${event.eventLocation || "-"}</p>
            ${offerDetails}
            ${registrationButton}
          </div>
        </article>
      `;
    }).join("");
  } catch (error) {
    eventsList.innerHTML = `<p>Unable to load events: ${error.message}</p>`;
  }
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function formatDisplayTime(timeValue) {
  if (!timeValue) return "-";

  const date = new Date(timeValue);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-MY", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return timeValue;
}
document.addEventListener("DOMContentLoaded", () => {
  testBackendConnection();
  loadApprovedEvents();

  const residentForm = document.getElementById("residentForm");

  if (residentForm) {
    residentForm.addEventListener("submit", submitResidentForm);
  }

  const eventForm = document.getElementById("eventForm");

if (eventForm) {
  eventForm.addEventListener("submit", submitEventForm);
  eventForm.addEventListener("change", calculateEventFeePreview);
  eventForm.addEventListener("change", toggleResidentOfferFields);

  calculateEventFeePreview();
  toggleResidentOfferFields();
}
});