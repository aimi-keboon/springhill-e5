const API_URL = "https://script.google.com/macros/s/AKfycbyLSDiuFT5shVaPtdjmj34ANhjPi8ANd-fuFuHU03q3jnHXt0wdXnkz85wxmAe4SBI-Vg/exec";

let allAnnouncements = [];
let allApprovedEvents = [];
let currentPayments = [];
let currentLoggedInResident = null;
let currentResidentPassword = "";
let currentTotalDue = 0;

let currentAnnouncementPage = 1;
let currentEventPage = 1;
let currentBillingPage = 1;

const ITEMS_PER_PAGE = 5;
const BILLING_ITEMS_PER_PAGE = 10;
let eventPricingSettings = {
  eventWebsiteFee7Days: 50,
  eventWebsiteFee14Days: 80,
  eventWebsiteFee30Days: 120,
  eventWhatsappBlastFee: 20,
  eventResidentDiscountPercent: 50,
};

const bannerImages = [
  "assets/banners/banner-1.jpg",
  "assets/banners/banner-2.jpg",
  "assets/banners/banner-3.jpg",
];

let currentBannerIndex = 0;
let bannerInterval = null;

function showTab(tabId, clickedButton) {
  const tabPanels = document.querySelectorAll(".tab-panel");
  const tabButtons = document.querySelectorAll(".tab-button");

  tabPanels.forEach((panel) => {
    panel.classList.remove("active");
  });

  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  document.getElementById(tabId).classList.add("active");
  clickedButton.classList.add("active");
}

function openAuthModal(screenName = "login") {
  const modal = document.getElementById("authModal");

  if (!modal) return;

  modal.classList.remove("hidden");

  if (screenName === "signup") {
    const signupButton = document.querySelectorAll(".auth-tab")[1];
    showAuthScreen("signupScreen", signupButton);
    return;
  }

  if (screenName === "reset") {
    const resetButton = document.querySelectorAll(".auth-tab")[2];
    showAuthScreen("resetScreen", resetButton);
    return;
  }

  const loginButton = document.querySelectorAll(".auth-tab")[0];
  showAuthScreen("loginScreen", loginButton);
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");

  if (!modal) return;

  modal.classList.add("hidden");
}

function showAuthScreen(screenId, clickedButton) {
  const screens = document.querySelectorAll(".auth-screen");
  const tabs = document.querySelectorAll(".auth-tab");

  screens.forEach((screen) => {
    screen.classList.remove("active");
  });

  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  document.getElementById(screenId).classList.add("active");
  clickedButton.classList.add("active");
}
function switchToSignupScreen() {
  const signupButton = document.querySelectorAll(".auth-tab")[1];
  showAuthScreen("signupScreen", signupButton);
}

function switchToLoginScreen() {
  const loginButton = document.querySelectorAll(".auth-tab")[0];
  showAuthScreen("loginScreen", loginButton);
}

function showResetPasswordScreen() {
  const authTabs = document.querySelectorAll(".auth-tab");

  authTabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  document.querySelectorAll(".auth-screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  document.getElementById("resetScreen").classList.add("active");
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

    allAnnouncements = result.data.announcements || [];
    currentAnnouncementPage = 1;

    renderAnnouncements();
  } catch (error) {
    announcementsList.innerHTML = `<p>Unable to load announcements: ${error.message}</p>`;
  }
}

function renderAnnouncements() {
  const announcementsList = document.getElementById("announcementsList");
  const pagination = document.getElementById("announcementsPagination");

  if (!announcementsList || !pagination) return;

  if (allAnnouncements.length === 0) {
    announcementsList.innerHTML = "<p>No announcements available at the moment.</p>";
    pagination.innerHTML = "";
    return;
  }

  const sortedAnnouncements = [...allAnnouncements].sort((a, b) => {
    return new Date(b.postedAt) - new Date(a.postedAt);
  });

  const totalPages = Math.ceil(sortedAnnouncements.length / ITEMS_PER_PAGE);
  const startIndex = (currentAnnouncementPage - 1) * ITEMS_PER_PAGE;
  const visibleItems = sortedAnnouncements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  announcementsList.innerHTML = visibleItems.map((announcement) => {
    return `
      <article class="announcement-card">
        <span class="announcement-category">${announcement.category || "General"}</span>
        <h3>${announcement.title || "Untitled Announcement"}</h3>
        <p>${announcement.content || ""}</p>
        <small>Posted on ${formatDisplayDate(announcement.postedAt)}</small>
      </article>
    `;
  }).join("");

  renderPagination(
    pagination,
    currentAnnouncementPage,
    totalPages,
    "changeAnnouncementPage"
  );
}

function changeAnnouncementPage(page) {
  currentAnnouncementPage = page;
  renderAnnouncements();
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

    allApprovedEvents = result.data.events || [];
    currentEventPage = 1;

    renderApprovedEvents();
  } catch (error) {
    eventsList.innerHTML = `<p>Unable to load events: ${error.message}</p>`;
  }
}
function openOfferModal(event) {
  const modal = document.getElementById("offerModal");

  if (!modal) return;

  document.getElementById("offerModalTitle").textContent =
    event.residentOfferTitle || "Special Offer for Residents";

  document.getElementById("offerModalDescription").textContent =
    event.residentOfferDescription || "No offer description provided.";

  document.getElementById("offerModalNormalPrice").textContent =
    event.normalPrice || "-";

  document.getElementById("offerModalResidentPrice").textContent =
    event.residentPrice || "-";

  document.getElementById("offerModalPromoCode").textContent = event.promoCode
    ? `Promo Code: ${event.promoCode}`
    : "No promo code required.";

  document.getElementById("offerModalExpiry").textContent = event.offerExpiryDate
    ? `Offer valid until ${formatDisplayDate(event.offerExpiryDate)}`
    : "";

  modal.classList.remove("hidden");
}

function closeOfferModal() {
  const modal = document.getElementById("offerModal");

  if (!modal) return;

  modal.classList.add("hidden");
}
function normalizeExternalLink(url) {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  if (!trimmedUrl) return "";

  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }

  return "https://" + trimmedUrl;
}
function renderApprovedEvents() {
  const eventsList = document.getElementById("approvedEventsList");
  const pagination = document.getElementById("eventsPagination");

  if (!eventsList || !pagination) return;

  if (allApprovedEvents.length === 0) {
    eventsList.innerHTML = "<p>No approved events available at the moment.</p>";
    pagination.innerHTML = "";
    return;
  }

  const sortedEvents = [...allApprovedEvents].sort((a, b) => {
    return new Date(b.publishedAt || b.eventDate) - new Date(a.publishedAt || a.eventDate);
  });

  const totalPages = Math.ceil(sortedEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentEventPage - 1) * ITEMS_PER_PAGE;
  const visibleItems = sortedEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  eventsList.innerHTML = visibleItems.map((event) => {
    const offerBadge = event.residentOfferAvailable === "Yes"
      ? ``
      : "";

    const poster = event.eventPosterUrl
      ? `<img src="${event.eventPosterUrl}" alt="${event.eventTitle}" class="event-poster" />`
      : "";

    const registrationUrl = normalizeExternalLink(event.registrationLink);

const registrationButton = registrationUrl
  ? `<a href="${registrationUrl}" target="_blank" rel="noopener noreferrer" class="event-link">Register / Contact</a>`
  : "";

    const offerButton = event.residentOfferAvailable === "Yes"
  ? `
    <button 
      type="button" 
      class="ticket-offer-button"
      onclick='openOfferModal(${JSON.stringify(event).replace(/'/g, "&apos;")})'
    >
      View Offer
    </button>
  `
  : "";

    return `
  <article class="event-card ticket-card">
    <div class="ticket-main ${poster ? "" : "no-poster"}">
      ${poster ? `<div class="ticket-poster-wrap">${poster}</div>` : ""}

      <div class="event-content ticket-content">
        ${offerBadge}
        <h3>${event.eventTitle || "Untitled Event"}</h3>
        <p>${event.eventDescription || ""}</p>

        <div class="ticket-meta">
          <p><b>Date</b><span>${formatDisplayDate(event.eventDate)}</span></p>
          <p><b>Time</b><span>${formatDisplayTime(event.eventTime)}</span></p>
          <p><b>Location</b><span>${event.eventLocation || "-"}</span></p>
        </div>
      </div>
    </div>

    <div class="ticket-stub">
      <p class="ticket-label">Entry Ticket</p>
      ${offerButton}
      ${registrationButton}
    </div>
  </article>
`;
  }).join("");

  renderPagination(
    pagination,
    currentEventPage,
    totalPages,
    "changeEventPage"
  );
}

function changeEventPage(page) {
  currentEventPage = page;
  renderApprovedEvents();
}

function renderPagination(container, currentPage, totalPages, functionName) {
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let buttons = "";

  for (let page = 1; page <= totalPages; page++) {
    buttons += `
      <button 
        type="button" 
        class="page-button ${page === currentPage ? "active" : ""}" 
        onclick="${functionName}(${page})"
      >
        ${page}
      </button>
    `;
  }

  container.innerHTML = buttons;
}

function previousBanner() {
  currentBannerIndex--;

  if (currentBannerIndex < 0) {
    currentBannerIndex = bannerImages.length - 1;
  }

  updateBannerImage();
}

function nextBanner() {
  currentBannerIndex++;

  if (currentBannerIndex >= bannerImages.length) {
    currentBannerIndex = 0;
  }

  updateBannerImage();
}

function updateBannerImage() {
  const bannerImage = document.getElementById("bannerImage");

  if (!bannerImage) return;

  bannerImage.src = bannerImages[currentBannerIndex];
}
function startBannerCarousel() {
  if (bannerInterval) {
    clearInterval(bannerInterval);
  }

  bannerInterval = setInterval(() => {
    nextBanner();
  }, 3000);
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
async function loadEventPricingSettings() {
  try {
    const response = await fetch(`${API_URL}?action=getEventPricingSettings`);
    const result = await response.json();

    if (result.success && result.data) {
      eventPricingSettings = result.data;
      calculateEventFeePreview();
    }
  } catch (error) {
    console.log("Unable to load event pricing settings:", error.message);
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

if (duration === 7) websiteFee = Number(eventPricingSettings.eventWebsiteFee7Days || 0);
if (duration === 14) websiteFee = Number(eventPricingSettings.eventWebsiteFee14Days || 0);
if (duration === 30) websiteFee = Number(eventPricingSettings.eventWebsiteFee30Days || 0);

const whatsappFee = blastCount * Number(eventPricingSettings.eventWhatsappBlastFee || 0);
let totalFee = websiteFee + whatsappFee;

if (organiserType === "Resident / Member") {
  const discountPercent = Number(eventPricingSettings.eventResidentDiscountPercent || 0);
  totalFee = totalFee * ((100 - discountPercent) / 100);
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
      calculateEventFeePreview();
      toggleResidentOfferFields();
    } else {
      statusBox.textContent = "Submission failed: " + result.message;
    }
  } catch (error) {
    statusBox.textContent = "Submission failed: " + error.message;
  }
}
function parseJsonArray(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function openProfileUpdateModal() {
  const modal = document.getElementById("profileUpdateModal");
  const form = document.getElementById("profileUpdateForm");

  if (!modal || !form || !currentLoggedInResident) return;

  form.updateFullName.value = currentLoggedInResident.fullName || "";
  form.updatePhone.value = currentLoggedInResident.phone || "";
  form.updateUnitNo.value = currentLoggedInResident.unitNo || "";
  form.updateResidentType.value = currentLoggedInResident.residentType || "";

  document.getElementById("profileTransportRows").innerHTML = "";
  document.getElementById("profileFamilyRows").innerHTML = "";

  const transportDetails = parseJsonArray(currentLoggedInResident.transportDetails);
  const familyMembers = parseJsonArray(currentLoggedInResident.familyMembers);

  transportDetails.forEach((item) => {
    addProfileTransportRow(item.type, item.registration);
  });

  familyMembers.forEach((item) => {
    addProfileFamilyRow(item.name, item.relationship);
  });

  document.getElementById("profileUpdateStatus").textContent = "";

  modal.classList.remove("hidden");
}

function closeProfileUpdateModal() {
  const modal = document.getElementById("profileUpdateModal");

  if (!modal) return;

  modal.classList.add("hidden");
}

function addProfileTransportRow(type = "", registration = "") {
  const transportRows = document.getElementById("profileTransportRows");

  const row = document.createElement("div");
  row.className = "repeat-row";

  row.innerHTML = `
    <label>
      Transport / Vehicle Type
      <select name="profileTransportType[]">
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
      <input type="text" name="profileTransportRegistration[]" placeholder="Example: VAB1234" />
    </label>

    <button type="button" class="remove-button" onclick="removeRow(this)">
      Remove
    </button>
  `;

  transportRows.appendChild(row);

  row.querySelector('[name="profileTransportType[]"]').value = type || "";
  row.querySelector('[name="profileTransportRegistration[]"]').value = registration || "";
}

function addProfileFamilyRow(name = "", relationship = "") {
  const familyRows = document.getElementById("profileFamilyRows");

  const row = document.createElement("div");
  row.className = "repeat-row family-row";

  row.innerHTML = `
    <label>
      Family Member Name
      <input type="text" name="profileFamilyMemberName[]" />
    </label>

    <label>
      Relationship with Owner
      <input type="text" name="profileFamilyMemberRelationship[]" placeholder="Example: Spouse, Child, Parent" />
    </label>

    <button type="button" class="remove-button" onclick="removeRow(this)">
      Remove
    </button>
  `;

  familyRows.appendChild(row);

  row.querySelector('[name="profileFamilyMemberName[]"]').value = name || "";
  row.querySelector('[name="profileFamilyMemberRelationship[]"]').value = relationship || "";
}
function collectProfileTransportDetails(form) {
  const types = getFormValuesByName(form, "profileTransportType[]");
  const registrations = getFormValuesByName(form, "profileTransportRegistration[]");

  return types.map((type, index) => ({
    type: type,
    registration: registrations[index] || "",
  }));
}

function collectProfileFamilyMembers(form) {
  const names = getFormValuesByName(form, "profileFamilyMemberName[]");
  const relationships = getFormValuesByName(form, "profileFamilyMemberRelationship[]");

  return names.map((name, index) => ({
    name: name,
    relationship: relationships[index] || "",
  }));
}

async function submitProfileUpdateForm(event) {
  event.preventDefault();

  const form = event.target;
  const statusBox = document.getElementById("profileUpdateStatus");

  if (!currentLoggedInResident) {
    statusBox.textContent = "Please log in again before updating your profile.";
    return;
  }

  statusBox.textContent = "Saving profile changes...";

  const formData = new FormData(form);

  const payload = {
  action: "updateResidentProfile",
  residentId: currentLoggedInResident.residentId,
  email: currentLoggedInResident.email,
  password: currentResidentPassword,
  fullName: formData.get("updateFullName"),
  phone: formData.get("updatePhone"),
  unitNo: formData.get("updateUnitNo"),
  residentType: formData.get("updateResidentType"),
  transportDetails: collectProfileTransportDetails(form),
  familyMembers: collectProfileFamilyMembers(form),
};

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.success) {
      statusBox.textContent = "Profile update failed: " + result.message;
      return;
    }

    currentLoggedInResident = result.data.resident;
    statusBox.textContent = "Profile updated successfully.";

    renderBillingDetails();
  } catch (error) {
    statusBox.textContent = "Profile update failed: " + error.message;
  }
}
function renderBillingDetails(totalDueValue = null) {
  const resultBox = document.getElementById("paymentResult");

  if (!resultBox || !currentLoggedInResident) return;

  const totalDue = totalDueValue !== null
    ? Number(totalDueValue || 0)
    : currentPayments
        .filter((payment) => payment.status === "Due" || payment.status === "Overdue")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const totalPages = Math.ceil(currentPayments.length / BILLING_ITEMS_PER_PAGE) || 1;
  const startIndex = (currentBillingPage - 1) * BILLING_ITEMS_PER_PAGE;
  const visiblePayments = currentPayments.slice(startIndex, startIndex + BILLING_ITEMS_PER_PAGE);

  const paymentRows = visiblePayments.length
  ? visiblePayments.map((payment) => {
      const canPay = payment.status === "Due" || payment.status === "Overdue";

      return `
        <tr>
          <td>
            ${
              canPay
                ? `<input type="checkbox" class="bill-checkbox" value="${payment.paymentId}" onchange="updateSelectedBillSummary()" />`
                : ""
            }
          </td>
          <td>${formatPaymentPeriod(payment.paymentPeriod)}</td>
          <td>${payment.paymentType || "-"}</td>
          <td>RM${Number(payment.amount || 0).toFixed(2)}</td>
          <td>${payment.status || "-"}</td>
          <td>${formatDisplayDate(payment.paidAt)}</td>
          <td>${payment.receiptNo || "-"}</td>
          <td>
            ${
              canPay
                ? `<button type="button" class="small-button" onclick="payMaintenance('${payment.paymentId}', '${currentLoggedInResident.email}', this)">Pay Now</button>`
                : "-"
            }
          </td>
        </tr>
      `;
    }).join("")
  : `
      <tr>
        <td colspan="8">No payment records found.</td>
      </tr>
    `;

  resultBox.innerHTML = `
    <div class="profile-summary">
      <div>
        <h3>${currentLoggedInResident.fullName}</h3>
        <p><b>Email:</b> ${currentLoggedInResident.email}</p>
        <p><b>Phone:</b> ${currentLoggedInResident.phone || "-"}</p>
        <p><b>Unit:</b> ${currentLoggedInResident.unitNo}</p>
        <p><b>Resident Type:</b> ${currentLoggedInResident.residentType || "-"}</p>
        <p><b>Total Due:</b> RM${totalDue.toFixed(2)}</p>
      </div>

      <button type="button" class="secondary-button" onclick="openProfileUpdateModal()">
        Update Profile
      </button>
    </div>
<div class="selected-bills-bar">
  <span id="selectedBillSummary">No bills selected.</span>

  <button type="button" id="paySelectedButton" class="text-pay-button hidden" onclick="paySelectedBills(this)">
  Pay Selected
</button>
</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
  <th>Select</th>
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

    <div id="billingPagination" class="pagination"></div>
  `;

  const billingPagination = document.getElementById("billingPagination");

  if (billingPagination) {
    renderPagination(
      billingPagination,
      currentBillingPage,
      totalPages,
      "changeBillingPage"
    );
  }
}

function changeBillingPage(page) {
  currentBillingPage = page;
  renderBillingDetails();
}
function getSelectedBillIds() {
  return Array.from(document.querySelectorAll(".bill-checkbox:checked"))
    .map((checkbox) => checkbox.value);
}

function updateSelectedBillSummary() {
  const selectedIds = getSelectedBillIds();
  const summaryBox = document.getElementById("selectedBillSummary");
  const paySelectedButton = document.getElementById("paySelectedButton");

  if (!summaryBox || !paySelectedButton) return;

  const selectedPayments = currentPayments.filter((payment) => {
    return selectedIds.includes(payment.paymentId);
  });

  const totalSelected = selectedPayments.reduce((sum, payment) => {
    return sum + Number(payment.amount || 0);
  }, 0);

  if (selectedIds.length === 0) {
  summaryBox.textContent = "No bills selected.";
  paySelectedButton.classList.add("hidden");
  paySelectedButton.disabled = true;
  return;
}

  summaryBox.textContent =
  `${selectedIds.length} bill(s) selected · Total RM${totalSelected.toFixed(2)}`;

paySelectedButton.classList.remove("hidden");
paySelectedButton.disabled = false;
}

async function paySelectedBills(buttonElement) {
  const selectedIds = getSelectedBillIds();

  if (selectedIds.length === 0) {
    alert("Please select at least one unpaid bill.");
    return;
  }

  const originalText = buttonElement ? buttonElement.textContent : "Pay Selected";

  if (buttonElement) {
    buttonElement.disabled = true;
    buttonElement.textContent = "Loading...";
    buttonElement.classList.add("loading-button");
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "createMultipleMaintenanceCheckout",
        paymentIds: selectedIds,
        email: currentLoggedInResident.email,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      alert("Unable to create checkout: " + result.message);

      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
        buttonElement.classList.remove("loading-button");
      }

      return;
    }

    window.location.href = result.data.checkoutUrl;
  } catch (error) {
    alert("Unable to create checkout: " + error.message);

    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.textContent = originalText;
      buttonElement.classList.remove("loading-button");
    }
  }
}
async function payMaintenance(paymentId, email, buttonElement) {
  const originalText = buttonElement ? buttonElement.textContent : "Pay Now";

  if (buttonElement) {
    buttonElement.disabled = true;
    buttonElement.textContent = "Loading...";
    buttonElement.classList.add("loading-button");
  }

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

      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
        buttonElement.classList.remove("loading-button");
      }

      return;
    }

    window.location.href = result.data.checkoutUrl;
  } catch (error) {
    alert("Unable to create payment checkout: " + error.message);

    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.textContent = originalText;
      buttonElement.classList.remove("loading-button");
    }
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

currentLoggedInResident = resident;
currentResidentPassword = password;
currentPayments = payments;
currentTotalDue = totalDue;
currentBillingPage = 1;

saveLoginSession();
updateLoggedInUi();

    statusBox.textContent = "Login successful. Payment status loaded.";
    closeAuthModal();
    showBillingPage();
    renderBillingDetails(currentTotalDue);
resultBox.classList.remove("hidden");
  } catch (error) {
    statusBox.textContent = "Unable to check payment status: " + error.message;
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
      statusBox.textContent = "Password reset successfully. You can now use your new password to log in.";
      form.reset();
    } else {
      statusBox.textContent = "Password reset failed: " + result.message;
    }
  } catch (error) {
    statusBox.textContent = "Password reset failed: " + error.message;
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

  if (textValue === "One-Time") {
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
function saveLoginSession() {
  if (!currentLoggedInResident || !currentResidentPassword) return;

  localStorage.setItem("springhillResident", JSON.stringify(currentLoggedInResident));
  localStorage.setItem("springhillResidentPassword", currentResidentPassword);
  localStorage.setItem("springhillPayments", JSON.stringify(currentPayments));
  localStorage.setItem("springhillTotalDue", String(currentTotalDue));
}

function loadLoginSession() {
  const savedResident = localStorage.getItem("springhillResident");
  const savedPassword = localStorage.getItem("springhillResidentPassword");
  const savedPayments = localStorage.getItem("springhillPayments");
  const savedTotalDue = localStorage.getItem("springhillTotalDue");

  if (!savedResident || !savedPassword) return;

  try {
    currentLoggedInResident = JSON.parse(savedResident);
currentResidentPassword = savedPassword;
currentPayments = savedPayments ? JSON.parse(savedPayments) : [];
currentTotalDue = Number(savedTotalDue || 0);

updateLoggedInUi();
renderBillingDetails(currentTotalDue);

const paymentResult = document.getElementById("paymentResult");

if (paymentResult) {
  paymentResult.classList.remove("hidden");
}

refreshLoggedInBillingData();
  } catch (error) {
    clearLoginSession();
  }
}

function clearLoginSession() {
  localStorage.removeItem("springhillResident");
  localStorage.removeItem("springhillResidentPassword");
  localStorage.removeItem("springhillPayments");
  localStorage.removeItem("springhillTotalDue");

  currentLoggedInResident = null;
  currentResidentPassword = "";
  currentPayments = [];
  currentTotalDue = 0;
  currentBillingPage = 1;
}

function updateLoggedInUi() {
  const loginSignupButton = document.getElementById("loginSignupButton");
  const logoutButton = document.getElementById("logoutButton");
  const announcementsTabButton = document.getElementById("announcementsTabButton");
  const eventsTabButton = document.getElementById("eventsTabButton");
  const profileTabButton = document.getElementById("profileTabButton");
  const homeGreeting = document.getElementById("homeGreeting");

  if (currentLoggedInResident) {
    if (homeGreeting) {
      homeGreeting.textContent = `Welcome to Bandar Springhill E5, ${currentLoggedInResident.fullName}`;
    }

    loginSignupButton?.classList.add("hidden");
    logoutButton?.classList.remove("hidden");

    announcementsTabButton?.classList.remove("hidden");
    eventsTabButton?.classList.remove("hidden");
    profileTabButton?.classList.remove("hidden");
  } else {
    if (homeGreeting) {
      homeGreeting.textContent = "Welcome to Bandar Springhill E5";
    }

    loginSignupButton?.classList.remove("hidden");
    logoutButton?.classList.add("hidden");

    announcementsTabButton?.classList.add("hidden");
    eventsTabButton?.classList.add("hidden");
    profileTabButton?.classList.add("hidden");
  }
}
function showHomeTab() {
  const homeTab = document.getElementById("homeTab");
  const homeTabButton = document.getElementById("homeTabButton");

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active");
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active");
  });

  if (homeTab) {
    homeTab.classList.add("active");
  }

  if (homeTabButton) {
    homeTabButton.classList.add("active");
  }
}
function logoutResident() {
  clearLoginSession();
  updateLoggedInUi();
  showHomeTab();
}
async function refreshLoggedInBillingData() {
  if (!currentLoggedInResident || !currentResidentPassword) return;

  try {
    const response = await fetch(
      `${API_URL}?action=getResidentPayments&email=${encodeURIComponent(currentLoggedInResident.email)}&password=${encodeURIComponent(currentResidentPassword)}`
    );

    const result = await response.json();

    if (!result.success) {
      clearLoginSession();
      updateLoggedInUi();
      return;
    }

    currentLoggedInResident = result.data.resident;
    currentPayments = result.data.payments || [];
    currentTotalDue = Number(result.data.totalDue || 0);
    currentBillingPage = 1;

    saveLoginSession();
    updateLoggedInUi();
    renderBillingDetails(currentTotalDue);

    const paymentResult = document.getElementById("paymentResult");

    if (paymentResult) {
      paymentResult.classList.remove("hidden");
    }
  } catch (error) {
    console.log("Unable to refresh billing data:", error.message);
  }
}
function showBillingPage() {
  const tabPanels = document.querySelectorAll(".tab-panel");
  const tabButtons = document.querySelectorAll(".tab-button");

  tabPanels.forEach((panel) => {
    panel.classList.remove("active");
  });

  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  const billingPage = document.getElementById("billingPage");

  if (billingPage) {
    billingPage.classList.add("active");
    billingPage.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function goBackToAnnouncements() {
  const announcementsTab = document.getElementById("announcementsTab");
  const tabButtons = document.querySelectorAll(".tab-button");

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active");
  });

  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  if (announcementsTab) {
    announcementsTab.classList.add("active");
  }

  if (tabButtons[0]) {
    tabButtons[0].classList.add("active");
  }
}
function setupModalOutsideClickClose() {
  const modals = document.querySelectorAll(".auth-modal");

  modals.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.add("hidden");
      }
    });
  });
}
document.addEventListener("DOMContentLoaded", () => {
  showPaymentRedirectStatus();
  loadPostedAnnouncements();
  loadApprovedEvents();
  loadEventPricingSettings();
  loadLoginSession();
  setupModalOutsideClickClose();

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
  const profileUpdateForm = document.getElementById("profileUpdateForm");

if (profileUpdateForm) {
  profileUpdateForm.addEventListener("submit", submitProfileUpdateForm);
}
});