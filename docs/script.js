const API_URL = "https://script.google.com/macros/s/AKfycbxu8w6LGLpiR4I0iJCsHDNGI9kVDotAzyuH8_gXlbRS34h4me7TF9Ypll1KDSPBo1S9cA/exec";

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
function formatPaymentPeriod(periodValue) {
  if (!periodValue) return "-";

  const textValue = String(periodValue);

  if (/^\d{4}-\d{2}$/.test(textValue)) {
    return textValue;
  }

  const date = new Date(periodValue);

  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
  }

  return textValue;
}
async function payMaintenance(paymentId, email) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "createMaintenanceCheckout",
        paymentId: paymentId,
        email: email,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      alert("Unable to create payment checkout: " + result.message);
      return;
    }

    window.location.href = result.data.checkoutUrl;
  } catch (error) {
    alert("Unable to create payment checkout: " + error.message);
  }
}
async function submitPaymentLookupForm(event) {
  event.preventDefault();

  const form = event.target;
  const statusBox = document.getElementById("paymentLookupStatus");
  const resultBox = document.getElementById("paymentResult");

  const formData = new FormData(form);
const email = formData.get("residentEmail");
const password = formData.get("residentPassword");

  statusBox.textContent = "Checking payment status...";
  resultBox.classList.add("hidden");
  resultBox.innerHTML = "";

  try {
    const response = await fetch(
  `${API_URL}?action=getResidentPayments&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
);
    const result = await response.json();

    if (!result.success) {
      statusBox.textContent = result.message;
      return;
    }

    const resident = result.data.resident;
    const payments = result.data.payments || [];
    const totalDue = Number(result.data.totalDue || 0);

    statusBox.textContent = "Payment status loaded.";

    const paymentRows = payments.length
      ? payments.map((payment) => `
         <tr>
  <td>${formatPaymentPeriod(payment.paymentPeriod)}</td>
  <td>${payment.paymentType || "-"}</td>
  <td>RM${Number(payment.amount || 0).toFixed(2)}</td>
  <td>${payment.status || "-"}</td>
  <td>${formatDisplayDate(payment.paidAt)}</td>
  <td>${payment.receiptNo || "-"}</td>
  <td>
    ${payment.status === "Due" || payment.status === "Overdue"
      ? `<button type="button" class="small-button" onclick="payMaintenance('${payment.paymentId}', '${resident.email}')">Pay Now</button>`
      : "-"
    }
  </td>
</tr>
        `).join("")
      : `
          <tr>
  <td colspan="7">No payment records found.</td>
</tr>
        `;

    resultBox.innerHTML = `
      <h3>${resident.fullName}</h3>
      <p><b>Unit:</b> ${resident.unitNo}</p>
      <p><b>Total Due:</b> RM${totalDue.toFixed(2)}</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
  <th>Period</th>
  <th>Type</th>
  <th>Amount</th>
  <th>Status</th>
  <th>Paid At</th>
  <th>Receipt No.</th>
  <th>Action</th>
</tr>
          </thead>
          <tbody>
            ${paymentRows}
          </tbody>
        </table>
      </div>
    `;

    resultBox.classList.remove("hidden");
  } catch (error) {
    statusBox.textContent = "Unable to check payment status: " + error.message;
  }
}
async function loadPostedAnnouncements() {
  const announcementsList = document.getElementById("announcementsList");

  if (!announcementsList) return;

  announcementsList.innerHTML = "<p>Loading announcements...</p>";

  try {
    const response = await fetch(`${API_URL}?action=getPostedAnnouncements`);
    const result = await response.json();

    if (!result.success) {
      announcementsList.innerHTML = `<p>Unable to load announcements: ${result.message}</p>`;
      return;
    }

    const announcements = result.data.announcements || [];

    if (announcements.length === 0) {
      announcementsList.innerHTML = "<p>No announcements available at the moment.</p>";
      return;
    }

    announcementsList.innerHTML = announcements.map((announcement) => {
      return `
        <article class="announcement-card">
          <span class="announcement-category">${announcement.category || "General"}</span>
          <h3>${announcement.title || "Untitled Announcement"}</h3>
          <p>${announcement.content || ""}</p>
          <small>Posted on ${formatDisplayDate(announcement.postedAt)}</small>
        </article>
      `;
    }).join("");
  } catch (error) {
    announcementsList.innerHTML = `<p>Unable to load announcements: ${error.message}</p>`;
  }
}
function showPaymentRedirectStatus() {
  const statusBox = document.getElementById("paymentRedirectStatus");

  if (!statusBox) return;

  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment");
  const paymentId = params.get("paymentId");
  const eventId = params.get("eventId");
  const type = params.get("type");

  if (paymentStatus === "success") {
    if (type === "event") {
      statusBox.textContent = eventId
        ? `Event promotion payment successful. Your event will be published after confirmation. Event ID: ${eventId}`
        : "Event promotion payment successful. Your event will be published after confirmation.";
    } else {
      statusBox.textContent = paymentId
        ? `Payment successful. Receipt will be sent after confirmation. Payment ID: ${paymentId}`
        : "Payment successful. Receipt will be sent after confirmation.";
    }

    statusBox.classList.remove("hidden");
    statusBox.classList.add("success");
  }

  if (paymentStatus === "cancelled") {
    if (type === "event") {
      statusBox.textContent = eventId
        ? `Event promotion payment cancelled. You may use the payment link again anytime. Event ID: ${eventId}`
        : "Event promotion payment cancelled. You may use the payment link again anytime.";
    } else {
      statusBox.textContent = paymentId
        ? `Payment cancelled. You may try again anytime. Payment ID: ${paymentId}`
        : "Payment cancelled. You may try again anytime.";
    }

    statusBox.classList.remove("hidden");
    statusBox.classList.add("error");
  }
}
async function submitResetPasswordForm(event) {
  event.preventDefault();

  const form = event.target;
  const statusBox = document.getElementById("resetPasswordStatus");

  const formData = new FormData(form);

  const email = formData.get("resetEmail");
  const temporaryPassword = formData.get("temporaryPassword");
  const newPassword = formData.get("newPassword");
  const confirmNewPassword = formData.get("confirmNewPassword");

  if (newPassword !== confirmNewPassword) {
    statusBox.textContent = "New password and confirm password do not match.";
    return;
  }

  statusBox.textContent = "Resetting password...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "resetResidentPassword",
        email: email,
        temporaryPassword: temporaryPassword,
        newPassword: newPassword,
      }),
    });

    const result = await response.json();

    if (result.success) {
      statusBox.textContent = "Password reset successfully. You can now use your new password to check payment records.";
      form.reset();
    } else {
      statusBox.textContent = "Password reset failed: " + result.message;
    }
  } catch (error) {
    statusBox.textContent = "Password reset failed: " + error.message;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  testBackendConnection();
  showPaymentRedirectStatus();
  loadPostedAnnouncements();
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
const paymentLookupForm = document.getElementById("paymentLookupForm");

if (paymentLookupForm) {
  paymentLookupForm.addEventListener("submit", submitPaymentLookupForm);
}
const resetPasswordForm = document.getElementById("resetPasswordForm");

if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", submitResetPasswordForm);
}
});