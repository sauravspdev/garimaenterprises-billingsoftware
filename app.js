// Dropdown data – extend as needed
const ITEM_OPTIONS = [
  "PLYBARRY",
  "ROYAL",
  "MAYURI",
  "MT GOLD",
  "CENTURY",
  "GREENPLY",
  "KITPLY"
];

const MM_OPTIONS = [
  "6MM",
  "9MM",
  "10MM",
  "12MM",
  "16MM",
  "18MM",
  "19MM",
  "25MM"
];

const SIZE_OPTIONS = [
  "8x4",
  "8x3",
  "7x4",
  "7x3",
  "6x4",
  "6x3",
  "5x4"
];

const billBody = document.getElementById("billBody");
const grandTotalEl = document.getElementById("grandTotal");
const baseTotalEl = document.getElementById("baseTotal");

// GST / transport elements
const includeGstEl = document.getElementById("includeGst");
const includeTransportEl = document.getElementById("includeTransport");
const gstCardEl = document.getElementById("gstCard");
const transportCardEl = document.getElementById("transportCard");

const gstTypeEl = document.getElementById("gstType");
const gstRateEl = document.getElementById("gstRate");
const igstRateLabel = document.getElementById("igstRateLabel");
const cgstRateLabel = document.getElementById("cgstRateLabel");
const sgstRateLabel = document.getElementById("sgstRateLabel");
const igstAmountEl = document.getElementById("igstAmount");
const cgstAmountEl = document.getElementById("cgstAmount");
const sgstAmountEl = document.getElementById("sgstAmount");
const totalTaxEl = document.getElementById("totalTax");

const transportAmountEl = document.getElementById("transportAmount");

const invoiceInWordsEl = document.getElementById("invoiceInWords");
const finalTotalEl = document.getElementById("finalTotal");

// Initial setup: date + starter rows + listeners
(function init() {
  const d = new Date();
  const formatted = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  document.getElementById("invoiceDate").textContent = formatted;

  for (let i = 0; i < 5; i++) addRow();

  includeGstEl.addEventListener("change", () => {
    if (includeGstEl.checked) {
      gstCardEl.classList.remove("hidden");
    } else {
      gstCardEl.classList.add("hidden");
    }
    updateTotalsPipeline();
  });

  includeTransportEl.addEventListener("change", () => {
    if (includeTransportEl.checked) {
      transportCardEl.classList.remove("hidden");
    } else {
      transportCardEl.classList.add("hidden");
    }
    updateTotalsPipeline();
  });

  gstTypeEl.addEventListener("change", updateTotalsPipeline);
  gstRateEl.addEventListener("input", updateTotalsPipeline);
  transportAmountEl.addEventListener("input", updateTotalsPipeline);
})();

function createSelect(options) {
  const sel = document.createElement("select");
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "-- Select --";
  sel.appendChild(empty);

  options.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
  return sel;
}

function addRow(defaults = {}) {
  const row = document.createElement("tr");

  // Serial number
  const snTd = document.createElement("td");
  snTd.className = "text-right";
  row.appendChild(snTd);

  // Item
  const itemTd = document.createElement("td");
  const itemSelect = createSelect(ITEM_OPTIONS);
  itemSelect.value = defaults.item || "";
  itemTd.appendChild(itemSelect);
  row.appendChild(itemTd);

  // MM
  const mmTd = document.createElement("td");
  const mmSelect = createSelect(MM_OPTIONS);
  mmSelect.value = defaults.mm || "";
  mmTd.appendChild(mmSelect);
  row.appendChild(mmTd);

  // Size
  const sizeTd = document.createElement("td");
  const sizeSelect = createSelect(SIZE_OPTIONS);
  sizeSelect.value = defaults.size || "";
  sizeTd.appendChild(sizeSelect);
  row.appendChild(sizeTd);

  // Qty
  const qtyTd = document.createElement("td");
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = "0";
  qtyInput.step = "1";
  qtyInput.value = defaults.qty || "";
  qtyTd.appendChild(qtyInput);
  row.appendChild(qtyTd);

  // Rate
  const rateTd = document.createElement("td");
  const rateInput = document.createElement("input");
  rateInput.type = "number";
  rateInput.min = "0";
  rateInput.step = "0.01";
  rateInput.value = defaults.rate || "";
  rateTd.appendChild(rateInput);
  row.appendChild(rateTd);

  // Amount
  const amtTd = document.createElement("td");
  amtTd.className = "text-right amount";
  amtTd.textContent = "0.00";
  row.appendChild(amtTd);

  // Action (Recycle bin icon)
  const actionTd = document.createElement("td");
  actionTd.className = "action-cell";
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.innerText = "🗑"; // Unicode wastebasket icon
  delBtn.className = "row-delete-btn";
  delBtn.addEventListener("click", () => deleteRow(row));
  actionTd.appendChild(delBtn);
  row.appendChild(actionTd);

  // Events for calculations
  [sizeSelect, qtyInput, rateInput].forEach(el => {
    el.addEventListener("input", () => updateRowAmount(row));
    el.addEventListener("change", () => updateRowAmount(row));
  });

  billBody.appendChild(row);
  refreshSerialNumbers();
  updateRowAmount(row);
}

function parseSize(sizeStr) {
  if (!sizeStr) return { l: 0, w: 0 };
  const parts = sizeStr.toLowerCase().split("x");
  const l = parseFloat(parts[0]) || 0;
  const w = parseFloat(parts[1]) || 0;
  return { l, w };
}

function updateRowAmount(row) {
  const sizeSelect = row.children[3].querySelector("select");
  const qtyInput = row.children[4].querySelector("input");
  const rateInput = row.children[5].querySelector("input");
  const amtTd = row.children[6];

  const { l, w } = parseSize(sizeSelect.value);
  const qty = parseFloat(qtyInput.value) || 0;
  const rate = parseFloat(rateInput.value) || 0;

  const amount = l * w * qty * rate;
  amtTd.textContent = amount ? amount.toFixed(2) : "0.00";
  updateGrandTotal();
}

function updateGrandTotal() {
  let total = 0;
  billBody.querySelectorAll("tr").forEach(tr => {
    const amt = parseFloat(tr.children[6].textContent) || 0;
    total += amt;
  });
  grandTotalEl.textContent = total.toFixed(2);
  baseTotalEl.textContent = total.toFixed(2);
  updateTotalsPipeline();
}

/* Pipeline: base -> GST -> transport -> final total + words */
function updateTotalsPipeline() {
  const base = parseFloat(baseTotalEl.textContent) || 0;

  const gstData = calculateGst(base);
  const gstTotal = gstData.totalGst;

  totalTaxEl.textContent = gstTotal.toFixed(2);
  igstRateLabel.textContent = gstData.igstRateLabel;
  cgstRateLabel.textContent = gstData.cgstRateLabel;
  sgstRateLabel.textContent = gstData.sgstRateLabel;
  igstAmountEl.textContent = gstData.igst.toFixed(2);
  cgstAmountEl.textContent = gstData.cgst.toFixed(2);
  sgstAmountEl.textContent = gstData.sgst.toFixed(2);

  const transport = includeTransportEl.checked
    ? parseFloat(transportAmountEl.value) || 0
    : 0;
  if (!includeTransportEl.checked) {
    transportAmountEl.value = transportAmountEl.value; // no-op
  }

  const finalTotal = base + gstTotal + transport;
  finalTotalEl.textContent = finalTotal.toFixed(2);
  invoiceInWordsEl.textContent = numberToIndianCurrencyWords(finalTotal);
}

function calculateGst(base) {
  let igst = 0, cgst = 0, sgst = 0;
  let igstRateLabel = "0%";
  let cgstRateLabel = "0%";
  let sgstRateLabel = "0%";

  if (includeGstEl.checked) {
    const rate = parseFloat(gstRateEl.value) || 0;
    const type = gstTypeEl.value;

    if (base && rate && type) {
      const totalGst = (base * rate) / 100;

      if (type === "IGST") {
        igst = totalGst;
        igstRateLabel = `${rate}%`;
      } else if (type === "CGST_SGST") {
        cgst = totalGst / 2;
        sgst = totalGst / 2;
        cgstRateLabel = `${(rate / 2).toFixed(2)}%`;
        sgstRateLabel = `${(rate / 2).toFixed(2)}%`;
      }
    }
  }

  return {
    igst,
    cgst,
    sgst,
    totalGst: igst + cgst + sgst,
    igstRateLabel,
    cgstRateLabel,
    sgstRateLabel
  };
}

function refreshSerialNumbers() {
  billBody.querySelectorAll("tr").forEach((tr, index) => {
    tr.children[0].textContent = index + 1;
  });
}

function deleteRow(row) {
  row.remove();
  refreshSerialNumbers();
  updateGrandTotal();
}

/* ------- Number to words (Indian rupees) -------- */
const ones = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen"
];

const tens = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
];

function twoDigitsToWords(num) {
  if (num === 0) return "";
  if (num < 20) return ones[num];
  const t = Math.floor(num / 10);
  const o = num % 10;
  return tens[t] + (o ? " " + ones[o] : "");
}

function threeDigitsToWords(num) {
  let word = "";
  const h = Math.floor(num / 100);
  const rest = num % 100;
  if (h) word += ones[h] + " hundred";
  if (rest) word += (word ? " " : "") + twoDigitsToWords(rest);
  return word;
}

function numberToIndianCurrencyWords(num) {
  num = Math.round(num);
  if (num === 0) return "Zero rupees only";

  let word = "";

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const hundreds = num;

  if (crores) word += threeDigitsToWords(crores) + " crore";
  if (lakhs) word += (word ? " " : "") + threeDigitsToWords(lakhs) + " lakh";
  if (thousands) word += (word ? " " : "") + threeDigitsToWords(thousands) + " thousand";
  if (hundreds) word += (word ? " " : "") + threeDigitsToWords(hundreds);

  word = word.charAt(0).toUpperCase() + word.slice(1);
  return word + " rupees only";
}
