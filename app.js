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
  
  // Initial setup: date + starter rows
  (function init() {
    const d = new Date();
    const formatted = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    document.getElementById("invoiceDate").textContent = formatted;
  
    for (let i = 0; i < 5; i++) addRow();
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
    amtTd.textContent = "0";
    row.appendChild(amtTd);
  
    // Action (Delete)
    const actionTd = document.createElement("td");
    actionTd.className = "action-cell";
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Delete";
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
    amtTd.textContent = amount ? amount.toFixed(0) : "0";
    updateGrandTotal();
  }
  
  function updateGrandTotal() {
    let total = 0;
    billBody.querySelectorAll("tr").forEach(tr => {
      const amt = parseFloat(tr.children[6].textContent) || 0;
      total += amt;
    });
    grandTotalEl.textContent = total.toFixed(0);
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
  