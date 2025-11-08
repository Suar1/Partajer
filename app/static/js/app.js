let investorCount = 1;
const maxInvestors = 20;

function togglePaymentField(boxElement) {
    const roleSelect = boxElement.querySelector('select[name^="role"]');
    const paymentGroup = boxElement.querySelector('[id^="payment-group"]');
    const paymentInput = paymentGroup ? paymentGroup.querySelector('input[type="number"]') : null;
    const label = paymentGroup ? paymentGroup.querySelector('label') : null;
    
    if (!roleSelect || !paymentGroup || !paymentInput) return;
    
    const role = roleSelect.value;
    
    if (role === 'Developer') {
        paymentGroup.classList.add('hidden');
        paymentInput.value = '0';
        paymentInput.required = false;
    } else if (role === 'Constructor') {
        // Constructor payment is optional
        paymentGroup.classList.remove('hidden');
        paymentInput.required = false;
        paymentInput.placeholder = 'Optional';
        // Update label to show (Optional)
        if (label) {
            if (!label.innerHTML.includes('(Optional)')) {
                label.innerHTML = label.innerHTML.replace('Payment (€):', 'Payment (€): <span style="font-size:0.85em;color:#666;font-weight:normal;">(Optional)</span>');
            }
        }
        if (paymentInput.value === '0') {
            paymentInput.value = '';
        }
    } else {
        // Investor payment is required
        paymentGroup.classList.remove('hidden');
        paymentInput.required = true;
        paymentInput.placeholder = '';
        // Remove (Optional) from label if present
        if (label) {
            label.innerHTML = label.innerHTML.replace(/<span[^>]*>\(Optional\)<\/span>/g, '');
        }
        if (paymentInput.value === '0') {
            paymentInput.value = '';
        }
    }
}

function addInvestor() {
    console.log('addInvestor called');
    const investorsDiv = document.getElementById('investors');
    if (!investorsDiv) {
        console.error('Investors container not found');
        alert('Error: Investors container not found. Please refresh the page.');
        return;
    }
    
    // Recalculate investor count from existing boxes
    const existingBoxes = document.querySelectorAll('.investor-box');
    investorCount = existingBoxes.length;
    console.log('Current investor count:', investorCount);
    
    if (investorCount >= maxInvestors) {
        alert('Maximum number of investors reached!');
        return;
    }

    investorCount++;
    console.log('New investor count:', investorCount);
    const newInvestorBox = document.createElement('div');
    newInvestorBox.className = 'investor-box';
    newInvestorBox.setAttribute('data-investor-index', investorCount);
    newInvestorBox.innerHTML = `
        <div class="field-row">
            <label>Name:</label>
            <input type="text" name="name${investorCount}" required>
        </div>
        <div class="field-row">
            <label>Role:</label>
            <select name="role${investorCount}" required>
                <option value="">Select Role</option>
                <option value="Developer">Developer</option>
                <option value="Constructor">Constructor</option>
                <option value="Investor">Investor</option>
            </select>
        </div>
        <div id="payment-group${investorCount}" class="field-row">
            <label>Payment (€):</label>
            <input type="number" name="paid${investorCount}" min="0" placeholder="Optional for Constructor">
        </div>
    `;
    
    investorsDiv.appendChild(newInvestorBox);
    
    // Add event listener for role change
    const roleSelect = newInvestorBox.querySelector(`select[name="role${investorCount}"]`);
    if (roleSelect) {
        roleSelect.addEventListener('change', () => {
            togglePaymentField(newInvestorBox);
            updateDistribution();
            updateCalculationPanel();
        });
    }
    
    // Add event listener for payment input
    const paymentInput = newInvestorBox.querySelector(`input[name="paid${investorCount}"]`);
    if (paymentInput) {
        // Attach sanitizers
        paymentInput.addEventListener('input', () => {
            sanitizeNumberInput(paymentInput);
            debounce(() => {
                updateDistribution();
                updateCalculationPanel();
                updateBudgetBar();
                gateCalculate();
            }, 150);
        });
        paymentInput.addEventListener('blur', () => clampMoney(paymentInput));
    }
    
    // Initialize payment field visibility
    togglePaymentField(newInvestorBox);
    
    // Update distribution and calculation panel
    updateDistribution();
    updateCalculationPanel();
}

// Warning threshold constant (red warning at 50%)
const WARN_PER_PERSON_THRESHOLD = 50; // %

// Helper function to set warning state on help icons
function setWarnIcon(el, isWarn) {
    if (!el) return;
    if (isWarn) {
        el.classList.add('warn');
    } else {
        el.classList.remove('warn');
    }
}

function updateDistribution() {
    let devCount = 0;
    let constCount = 0;
    let invCount = 0;
    let totalInvestment = 0;

    // Count roles and calculate total investment using data attributes
    document.querySelectorAll('.investor-box').forEach((box) => {
        const roleSelect = box.querySelector('select[name^="role"]');
        const paymentInput = box.querySelector('input[name^="paid"]');
        
        if (!roleSelect) return;
        
        const role = roleSelect.value;
        if (role === 'Developer') devCount++;
        if (role === 'Constructor') constCount++;
        if (role === 'Investor') invCount++;

        // Add to total investment if not Developer
        if (role && role !== 'Developer' && paymentInput) {
            const payment = parseFloat(paymentInput.value || 0);
            if (!isNaN(payment)) totalInvestment += payment;
        }
    });

    // Get bonus percentages
    const devBonus = parseFloat(document.querySelector('input[name="developer_bonus"]')?.value || 0);
    const constBonus = parseFloat(document.querySelector('input[name="constructor_bonus"]')?.value || 0);
    const invBonus = parseFloat(document.querySelector('input[name="investor_bonus"]')?.value || 0);

    // Calculate per-person bonuses
    const perDev = devCount ? (devBonus / devCount) : 0;
    const perConst = constCount ? (constBonus / constCount) : 0;
    const perInv = invCount ? (invBonus / invCount) : 0;

    // Update the display
    const liveDist = document.getElementById('live-distribution');
    if (liveDist) {
        document.getElementById('dev-count').textContent = devCount;
        document.getElementById('const-count').textContent = constCount;
        document.getElementById('inv-count').textContent = invCount;
        
        document.getElementById('dev-bonus').textContent = perDev.toFixed(2);
        document.getElementById('const-bonus').textContent = perConst.toFixed(2);
        document.getElementById('inv-bonus').textContent = perInv.toFixed(2);
        
        document.getElementById('total-investment').textContent = totalInvestment.toFixed(2);
        liveDist.style.display = (devCount + constCount + invCount > 0) ? 'block' : 'none';
    }

    // Set warning icons for per-person bonuses exceeding threshold (50%)
    setWarnIcon(document.getElementById('dev-bonus-help'), perDev > WARN_PER_PERSON_THRESHOLD);
    setWarnIcon(document.getElementById('const-bonus-help'), perConst > WARN_PER_PERSON_THRESHOLD);
    setWarnIcon(document.getElementById('inv-bonus-help'), perInv > WARN_PER_PERSON_THRESHOLD);
    
    // Show inline warning notes for per-person > 50%
    const devHelp = document.getElementById('dev-bonus-help');
    const constHelp = document.getElementById('const-bonus-help');
    const invHelp = document.getElementById('inv-bonus-help');
    
    // Remove existing warning notes
    document.querySelectorAll('.per-person-warning').forEach(el => el.remove());
    
    if (perDev > WARN_PER_PERSON_THRESHOLD && devHelp) {
        const warning = document.createElement('div');
        warning.className = 'per-person-warning';
        warning.style.cssText = 'font-size:0.85em;color:#b91c1c;margin-top:4px;';
        warning.textContent = `⚠ High per-person share: ${perDev.toFixed(2)}%`;
        devHelp.parentElement.appendChild(warning);
    }
    if (perConst > WARN_PER_PERSON_THRESHOLD && constHelp) {
        const warning = document.createElement('div');
        warning.className = 'per-person-warning';
        warning.style.cssText = 'font-size:0.85em;color:#b91c1c;margin-top:4px;';
        warning.textContent = `⚠ High per-person share: ${perConst.toFixed(2)}%`;
        constHelp.parentElement.appendChild(warning);
    }
    if (perInv > WARN_PER_PERSON_THRESHOLD && invHelp) {
        const warning = document.createElement('div');
        warning.className = 'per-person-warning';
        warning.style.cssText = 'font-size:0.85em;color:#b91c1c;margin-top:4px;';
        warning.textContent = `⚠ High per-person share: ${perInv.toFixed(2)}%`;
        invHelp.parentElement.appendChild(warning);
    }
}

function resetForm() {
    if (document.getElementById('results-section')) {
        if (confirm('Would you like to download the current calculation as PDF before starting a new one?')) {
            exportToPDF();
        }
    }

    // Store current results
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        const oldResults = resultsSection.cloneNode(true);
        oldResults.id = 'previous-results';
        oldResults.style.opacity = '0.8';
        
        // Add timestamp to old results
        const timestamp = document.createElement('div');
        timestamp.style.textAlign = 'right';
        timestamp.style.fontSize = '0.9em';
        timestamp.style.color = '#666';
        timestamp.innerHTML = 'Calculated at: ' + new Date().toLocaleString();
        oldResults.insertBefore(timestamp, oldResults.firstChild);
        
        // Add separator
        const separator = document.createElement('hr');
        separator.style.margin = '30px 0';
        separator.style.border = '1px solid #ddd';
        
        // Insert old results before the form
        const form = document.querySelector('form');
        form.parentNode.insertBefore(separator, form);
        form.parentNode.insertBefore(oldResults, separator);
    }

    // Reset form fields
    document.querySelector('form').reset();
    
    // Reset to single investor
    const investorsDiv = document.getElementById('investors');
    investorsDiv.innerHTML = `
        <div class="investor-box" data-investor-index="1">
            <div class="field-row">
                <label>Name:</label>
                <input type="text" name="name1" required>
            </div>
            <div class="field-row">
                <label>Role:</label>
                <select name="role1" required>
                    <option value="">Select Role</option>
                    <option value="Developer">Developer</option>
                    <option value="Constructor">Constructor</option>
                    <option value="Investor">Investor</option>
                </select>
            </div>
            <div id="payment-group1" class="field-row">
                <label>Payment (€):</label>
                <input type="number" name="paid1" min="0" placeholder="Optional for Constructor">
            </div>
        </div>
    `;
    
    // Reset investor count
    investorCount = 1;
    
    // Re-initialize event listeners
    document.querySelectorAll('.investor-box').forEach((box) => {
        const roleSelect = box.querySelector('select[name^="role"]');
        if (roleSelect) {
            roleSelect.addEventListener('change', () => togglePaymentField(box));
            togglePaymentField(box);
        }
    });
    
    // Reset live distribution
    const liveDist = document.getElementById('live-distribution');
    if (liveDist) {
        liveDist.style.display = 'none';
    }
    
    // Scroll to top of form
    document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
    
    updateDistribution();
}

function exportToPDF() {
    const content = document.getElementById('results-section');
    if (!content) {
        alert('No results to export.');
        return;
    }
    
    const clonedContent = content.cloneNode(true);
    const date = new Date().toLocaleString();
    
    // Add header
    const header = document.createElement('header');
    header.style.cssText = 'margin-bottom:10px;border-bottom:1px solid #ddd;padding-bottom:6px;';
    header.innerHTML = `
        <h2 style="margin:0;">Investment Share Calculator — Results</h2>
        <div style="font-size:12px;color:#555;">Generated: ${date}</div>
    `;
    clonedContent.insertBefore(header, clonedContent.firstChild);
    
    // Create signature section
    const signatureSection = document.createElement('div');
    signatureSection.innerHTML = `
        <div style="margin-top: 50px; page-break-inside: avoid;">
            <h3>Signatures</h3>
            <p>Date: ${date}</p>
            <table style="width: 100%; margin-top: 20px;">
                <tr>
                    <th style="width: 200px;">Name</th>
                    <th style="width: 100px;">Role</th>
                    <th>Signature</th>
                    <th style="width: 150px;">Date</th>
                </tr>
                ${Array.from(clonedContent.querySelectorAll('table tr:not(:first-child):not(:last-child)')).map(row => {
                    const name = row.cells[0].textContent;
                    const role = row.cells[1].textContent;
                    return `
                        <tr>
                            <td>${name}</td>
                            <td>${role}</td>
                            <td style="height: 40px; border-bottom: 1px solid #000;"></td>
                            <td style="height: 40px; border-bottom: 1px solid #000;"></td>
                        </tr>
                    `;
                }).join('')}
            </table>
        </div>
    `;
    clonedContent.appendChild(signatureSection);
    
    // Create footer
    const footer = document.createElement('footer');
    footer.id = 'app-footer';
    footer.style.cssText = 'margin-top:40px;padding-top:16px;border-top:1px solid #ddd;color:#555;font-size:0.95em;text-align:center;';
    footer.innerHTML = 'Services by <a href="https://suar.services" rel="noopener" target="_blank" style="text-decoration:none;">https://suar.services</a>';
    clonedContent.appendChild(footer);

    const style = `
        <style>
            @media print {
                header { position: relative; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                h1, h2, h3 { page-break-after: avoid; }
            }
            body { 
                font-family: Arial, sans-serif;
                padding: 20px;
            }
            .summary-info {
                background-color: #e9ecef;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
                line-height: 1.6;
            }
            table { 
                border-collapse: collapse; 
                width: 100%;
                margin-top: 20px;
                page-break-inside: auto;
            }
            tr { 
                page-break-inside: avoid; 
                page-break-after: auto;
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
            }
            th { background-color: #f5f5f5; }
            tr:last-child { background-color: #f8f9fa; }
            #app-footer {
                margin-top: 40px;
                padding-top: 16px;
                border-top: 1px solid #ddd;
                color: #555;
                font-size: 0.95em;
                text-align: center;
            }
            #app-footer a {
                text-decoration: none;
            }
            #app-footer a:hover {
                text-decoration: underline;
            }
            @media print {
                .summary-info {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                th {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        </style>
    `;
    
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
            <head>
                <title>Investment Share Calculator Results</title>
                ${style}
            </head>
            <body>
                <h1>Investment Share Calculator Results</h1>
                ${clonedContent.outerHTML}
            </body>
        </html>
    `);
    win.document.close();
    win.print();
}

// CSV Export Functions
function tableToCSV(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    const esc = (val) => {
        const s = (val ?? '').toString();
        const needsQuotes = /[",\n\r]/.test(s);
        const escaped = s.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
    };
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th,td')).map(td => esc(td.textContent.trim()));
        return cells.join(',');
    }).join('\r\n');
}

function downloadCSV(csv, filename = 'investment-results.csv') {
    // Prepend BOM for Excel UTF-8
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function exportTableToCSV() {
    const section = document.getElementById('results-section');
    if (!section) {
        alert('No results to export.');
        return;
    }
    const meta = document.querySelector('.summary-info');
    const table = section.querySelector('table');
    if (!table) {
        alert('Results table not found.');
        return;
    }
    
    const csvBody = tableToCSV(table);
    const now = new Date().toISOString();
    
    // Get meta data from data attributes or compute
    let base = '0';
    let role = '0';
    let prop = '0';
    let cash = '';
    
    if (meta) {
        base = meta.dataset.basePool || '0';
        role = meta.dataset.rolePool || '0';
        prop = meta.dataset.propertyPool || '0';
        cash = meta.dataset.cashTotal || '';
    }
    
    const metaLines = [
        `# Investment Share Calculator`,
        `# Generated: ${now}`,
        `# Pools: base=${base}%, role=${role}%, property=${prop}%`,
        cash ? `# Cash Investment (excl. property): €${cash}` : `#`
    ].join('\r\n');
    
    const csv = metaLines + '\r\n' + csvBody;
    downloadCSV(csv);
}

// Input hardening and validation
const NUM_FIELDS = [
    'developer_bonus', 'constructor_bonus', 'investor_bonus',
    'property_value', 'property_share', 'property_profit_share',
    'property_weight', 'property_profit_min_pct', 'property_profit_max_pct',
    'project_cost', 'sale_price'
];

function sanitizeNumberInput(el) {
    if (!el) return;
    // Remove non-numeric characters except dots, commas, and minus
    el.value = el.value.replace(/[^\d.,-]/g, '').replace(/,/g, '.');
    // Only allow one decimal point
    const parts = el.value.split('.');
    if (parts.length > 2) {
        el.value = parts[0] + '.' + parts.slice(1).join('');
    }
}

function clampPercent(el) {
    const v = parseFloat(el.value || '0');
    if (isNaN(v) || v < 0) el.value = '0';
    if (v > 100) el.value = '100';
}

function clampMoney(el) {
    const v = parseFloat(el.value || '0');
    if (isNaN(v) || v < 0) el.value = '0';
}

function attachNumericSanitizers() {
    const form = document.getElementById('calc-form') || document.querySelector('form');
    if (!form) return;
    
    NUM_FIELDS.forEach(name => {
        const el = form.querySelector(`[name="${name}"]`);
        if (!el) return;
        
        el.addEventListener('input', () => sanitizeNumberInput(el));
        
        if (name.endsWith('_bonus') || name.includes('share') || (name.includes('profit') && name.includes('pct'))) {
            el.addEventListener('blur', () => clampPercent(el));
        }
        if (['property_value', 'project_cost', 'sale_price'].includes(name)) {
            el.addEventListener('blur', () => clampMoney(el));
        }
        if (name === 'property_weight') {
            el.addEventListener('blur', () => {
                const v = parseFloat(el.value || '0');
                if (isNaN(v) || v < 0) el.value = '0';
            });
        }
    });
    
    // Also handle payment fields
    document.querySelectorAll('input[name^="paid"]').forEach(el => {
        el.addEventListener('input', () => sanitizeNumberInput(el));
        el.addEventListener('blur', () => clampMoney(el));
    });
}

// Debounce utility
let debounceTimer = null;
function debounce(fn, ms = 150) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, ms);
}

// AbortController for live calculation requests
let liveCtrl = null;

// Human-friendly formatting
const fmtEUR = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
});

const fmtPct = new Intl.NumberFormat(undefined, {
    style: 'percent',
    maximumFractionDigits: 2
});

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// Serialize form to JSON payload for API
function serializeFormToPayload() {
    const form = document.getElementById('calc-form');
    if (!form) return {};
    
    const val = name => (form.querySelector(`[name="${name}"]`)?.value ?? '').trim();
    
    const participants = [];
    
    // Dynamic investors/roles/payments
    document.querySelectorAll('#investors .investor-box').forEach(box => {
        const nameEl = box.querySelector('input[name^="name"]');
        const roleEl = box.querySelector('select[name^="role"]');
        const payEl = box.querySelector('input[name^="paid"]');
        
        const name = nameEl?.value?.trim();
        const role = roleEl?.value;
        const payment = payEl?.value || '0';
        
        if (name && role) {
            participants.push({
                name,
                role,
                payment,
                is_property_owner: false
            });
        }
    });
    
    // Property owner (if any) - handled separately in backend
    const propName = val('property_owner');
    const propValue = val('property_value');
    
    // Get property model
    const propertyModel = document.querySelector('input[name="property_model"]:checked')?.value || 'A';
    
    // In Model B, property pools must be 0
    const propertyBaseShare = propertyModel === 'B' ? '0' : val('property_share');
    const propertyProfitShare = propertyModel === 'B' ? '0' : val('property_profit_share');
    
    // Model B specific fields
    const propertyWeight = propertyModel === 'B' ? val('property_weight') || '1.0' : undefined;
    const propertyProfitMin = propertyModel === 'B' ? (val('property_profit_min_pct') || undefined) : undefined;
    const propertyProfitMax = propertyModel === 'B' ? (val('property_profit_max_pct') || undefined) : undefined;
    
    const payload = {
        project_cost: val('project_cost'),
        sale_price: val('sale_price'),
        developer_bonus: val('developer_bonus'),
        constructor_bonus: val('constructor_bonus'),
        investor_bonus: val('investor_bonus'),
        property_value: propValue,
        property_owner: propName,
        property_base_share: propertyBaseShare,
        property_profit_share: propertyProfitShare,
        property_model: propertyModel,
        participants: participants
    };
    
    // Add Model B fields if applicable
    if (propertyModel === 'B') {
        payload.property_weight = propertyWeight;
        if (propertyProfitMin !== undefined && propertyProfitMin !== '') {
            payload.property_profit_min_pct = propertyProfitMin;
        }
        if (propertyProfitMax !== undefined && propertyProfitMax !== '') {
            payload.property_profit_max_pct = propertyProfitMax;
        }
    }
    
    return payload;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize payment fields visibility
    document.querySelectorAll('.investor-box').forEach((box) => {
        const roleSelect = box.querySelector('select[name^="role"]');
        if (roleSelect) {
            roleSelect.addEventListener('change', () => togglePaymentField(box));
            togglePaymentField(box);
        }
    });
    
    // Attach numeric sanitizers
    attachNumericSanitizers();
    
    // Handle property model toggle
    const propertyModelRadios = document.querySelectorAll('input[name="property_model"]');
    const propertyEquityRow = document.getElementById('property-equity-row');
    const propertyProfitRow = document.getElementById('property-profit-row');
    const propertyModelBNote = document.getElementById('property-model-b-note');
    const propertyModelHelp = document.getElementById('property-model-help');
    
    function updatePropertyModelUI() {
        const selectedModel = document.querySelector('input[name="property_model"]:checked')?.value || 'A';
        const propertyWeightRow = document.getElementById('property-weight-row');
        const propertyProfitMinRow = document.getElementById('property-profit-min-row');
        const propertyProfitMaxRow = document.getElementById('property-profit-max-row');
        
        if (selectedModel === 'B') {
            // Model B: hide/disable property pools, show weight and profit bounds
            if (propertyEquityRow) {
                propertyEquityRow.style.display = 'none';
                const equityInput = propertyEquityRow.querySelector('input');
                if (equityInput) equityInput.value = '0';
            }
            if (propertyProfitRow) {
                propertyProfitRow.style.display = 'none';
                const profitInput = propertyProfitRow.querySelector('input');
                if (profitInput) profitInput.value = '0';
            }
            if (propertyWeightRow) propertyWeightRow.style.display = '';
            if (propertyProfitMinRow) propertyProfitMinRow.style.display = '';
            if (propertyProfitMaxRow) propertyProfitMaxRow.style.display = '';
            if (propertyModelBNote) propertyModelBNote.style.display = 'block';
            
            // Update tooltip
            if (propertyModelHelp) {
                propertyModelHelp.title = "Value-based: the property's market value participates in the base pool like cash. You can adjust the weight and set profit bounds.";
                const tooltip = propertyModelHelp.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.innerHTML = '<b>Property Model B (Valued contribution)</b>: The property\'s market value participates in the base pool like cash. You can scale its influence with weight and set optional profit bounds.';
                }
            }
        } else {
            // Model A: show/enable property pools, hide weight and profit bounds
            if (propertyEquityRow) propertyEquityRow.style.display = '';
            if (propertyProfitRow) propertyProfitRow.style.display = '';
            if (propertyWeightRow) propertyWeightRow.style.display = 'none';
            if (propertyProfitMinRow) propertyProfitMinRow.style.display = 'none';
            if (propertyProfitMaxRow) propertyProfitMaxRow.style.display = 'none';
            if (propertyModelBNote) propertyModelBNote.style.display = 'none';
            
            // Update tooltip
            if (propertyModelHelp) {
                propertyModelHelp.title = "Negotiated fixed share: the property owner receives a fixed % of total equity and (optionally) profit. The property value is shown for reference only and does not affect the percentage.";
                const tooltip = propertyModelHelp.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.innerHTML = '<b>Property Model A (Negotiated %)</b>: The property owner receives a fixed % of total equity and (optionally) profit. The property value is shown for reference only and does not affect the percentage.';
                }
            }
        }
        
        // Trigger live recalculation
        debounce(() => {
            updateDistribution();
            updateCalculationPanel();
            updateBudgetWarning();
            updateBudgetBar();
            gateCalculate();
            updateResultsLive();
        }, 150);
    }
    
    propertyModelRadios.forEach(radio => {
        radio.addEventListener('change', updatePropertyModelUI);
    });
    
    // Initial UI update
    updatePropertyModelUI();
    
    // Add validation for property profit min/max in Model B
    const propertyProfitMinInput = document.querySelector('input[name="property_profit_min_pct"]');
    const propertyProfitMaxInput = document.querySelector('input[name="property_profit_max_pct"]');
    
    function validatePropertyProfitBounds() {
        const selectedModel = document.querySelector('input[name="property_model"]:checked')?.value || 'A';
        if (selectedModel === 'B' && propertyProfitMinInput && propertyProfitMaxInput) {
            const minVal = parseFloat(propertyProfitMinInput.value || 0);
            const maxVal = parseFloat(propertyProfitMaxInput.value || 0);
            
            if (propertyProfitMinInput.value && propertyProfitMaxInput.value) {
                if (minVal > maxVal) {
                    propertyProfitMinInput.style.borderColor = '#f44336';
                    propertyProfitMaxInput.style.borderColor = '#f44336';
                    return false;
                } else {
                    propertyProfitMinInput.style.borderColor = '';
                    propertyProfitMaxInput.style.borderColor = '';
                }
            }
        }
        return true;
    }
    
    if (propertyProfitMinInput) {
        propertyProfitMinInput.addEventListener('input', () => {
            validatePropertyProfitBounds();
            gateCalculate();
        });
    }
    if (propertyProfitMaxInput) {
        propertyProfitMaxInput.addEventListener('input', () => {
            validatePropertyProfitBounds();
            gateCalculate();
        });
    }
    
    // Add event listeners for live updates with debounce
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('input', () => {
            debounce(() => {
                updateDistribution();
                updateCalculationPanel();
                updateBudgetWarning();
                updateBudgetBar();
                gateCalculate();
                updateResultsLive(); // Live recalc via API
            }, 250);
        });
        form.addEventListener('change', () => {
            updateDistribution();
            updateCalculationPanel();
            updateBudgetWarning();
            updateBudgetBar();
            gateCalculate();
        });
        updateDistribution(); // Initial update
        updateCalculationPanel(); // Initial calculation panel update
        updateBudgetWarning(); // Initial budget warning check
        updateBudgetBar(); // Initial budget bar
        gateCalculate(); // Initial gate check
    }
    
    // Set initial investor count from existing boxes
    const existingBoxes = document.querySelectorAll('.investor-box');
    if (existingBoxes.length > 0) {
        investorCount = existingBoxes.length;
    } else {
        investorCount = 1;
    }
    
    // Wire up Add Investor button
    const addInvestorBtn = document.getElementById('add-investor-btn');
    if (addInvestorBtn) {
        addInvestorBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Add Investor button clicked');
            addInvestor();
        });
        console.log('Add Investor button wired up');
    } else {
        console.error('Add Investor button not found!');
    }
    
    // Wire up Reset Form button
    const resetFormBtn = document.getElementById('reset-form-btn');
    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', resetForm);
    }
    
    // Make sure functions are accessible globally (for backwards compatibility)
    window.addInvestor = addInvestor;
    window.resetForm = resetForm;
    window.exportToPDF = exportToPDF;
    
    // Wire up CSV export button
    const csvBtn = document.getElementById('export-csv');
    if (csvBtn) {
        csvBtn.addEventListener('click', exportTableToCSV);
    }
    
    // Wire up PDF export button (may not exist on page load if no results)
    function wireUpPDFButton() {
        const pdfBtn = document.getElementById('export-pdf');
        if (pdfBtn && !pdfBtn.hasAttribute('data-wired')) {
            pdfBtn.addEventListener('click', exportToPDF);
            pdfBtn.setAttribute('data-wired', 'true');
        }
    }
    wireUpPDFButton();
    
    // Guard export buttons - enable/disable based on results
    function updateExportButtons() {
        const resultsSection = document.getElementById('results-section');
        const hasResults = resultsSection !== null && resultsSection.querySelector('table') !== null;
        const pdfBtn = document.getElementById('export-pdf');
        const csvBtn = document.getElementById('export-csv');
        
        if (pdfBtn) {
            pdfBtn.disabled = !hasResults;
            pdfBtn.style.opacity = hasResults ? '1' : '0.5';
            pdfBtn.style.cursor = hasResults ? 'pointer' : 'not-allowed';
        }
        if (csvBtn) {
            csvBtn.disabled = !hasResults;
            csvBtn.style.opacity = hasResults ? '1' : '0.5';
            csvBtn.style.cursor = hasResults ? 'pointer' : 'not-allowed';
        }
    }
    
    // Update buttons on page load
    updateExportButtons();
    
    // Watch for results section changes (MutationObserver for dynamic content)
    const observer = new MutationObserver(() => {
        updateExportButtons();
        wireUpPDFButton();
    });
    const targetNode = document.body;
    if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
    }
    
    // Initialize calculation panel
    updateCalculationPanel();
    
    // Improve accessibility for help icons
    document.querySelectorAll('.help-ico').forEach(btn => {
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        btn.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                const tip = btn.querySelector('.tooltip');
                if (tip) tip.style.display = 'none';
                btn.blur();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Toggle tooltip visibility
                const tip = btn.querySelector('.tooltip');
                if (tip) {
                    tip.style.display = tip.style.display === 'block' ? 'none' : 'block';
                }
            }
        });
    });
    
    // Wire up calculation panel visibility checkbox (completely hide/show)
    const calcVisibilityCheckbox = document.getElementById('calc-visibility-checkbox');
    const calcShowBtn = document.getElementById('calc-show-btn');
    if (calcVisibilityCheckbox) {
        calcVisibilityCheckbox.addEventListener('change', function() {
            const panel = document.getElementById('calculation-panel');
            if (panel) {
                if (this.checked) {
                    // Show panel
                    panel.classList.remove('hidden');
                    if (calcShowBtn) calcShowBtn.style.display = 'none';
                    // If panel was shown, make sure it's visible
                    const hasValues = panel.style.display !== 'none' && panel.style.display !== '';
                    if (hasValues) {
                        panel.style.display = 'block';
                    }
                } else {
                    // Completely hide panel
                    panel.classList.add('hidden');
                    if (calcShowBtn) calcShowBtn.style.display = 'flex';
                }
            }
        });
    }
    
    // Wire up floating show button
    if (calcShowBtn) {
        calcShowBtn.addEventListener('click', function() {
            const panel = document.getElementById('calculation-panel');
            const checkbox = document.getElementById('calc-visibility-checkbox');
            if (panel && checkbox) {
                checkbox.checked = true;
                panel.classList.remove('hidden');
                this.style.display = 'none';
                // Trigger change event to update panel visibility
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    }
    
    // Wire up calculation panel toggle button (minimize/expand)
    const calcToggleBtn = document.getElementById('calc-toggle-btn');
    if (calcToggleBtn) {
        calcToggleBtn.addEventListener('click', function() {
            const panel = document.getElementById('calculation-panel');
            if (panel && !panel.classList.contains('hidden')) {
                panel.classList.toggle('collapsed');
                // Mark as user-collapsed so we don't auto-expand it
                if (panel.classList.contains('collapsed')) {
                    panel.classList.add('user-collapsed');
                } else {
                    panel.classList.remove('user-collapsed');
                }
                // Update icon text
                const icon = calcToggleBtn.querySelector('.calc-toggle-icon');
                if (icon) {
                    icon.textContent = panel.classList.contains('collapsed') ? '+' : '−';
                }
            }
        });
    }
});

// Calculate and display share budget (100% budget approach)
function updateCalculationPanel() {
    const panel = document.getElementById('calculation-panel');
    if (!panel) return;
    
    // Get form values
    const devBonus = parseFloat(document.querySelector('input[name="developer_bonus"]')?.value || 0);
    const constBonus = parseFloat(document.querySelector('input[name="constructor_bonus"]')?.value || 0);
    const invBonus = parseFloat(document.querySelector('input[name="investor_bonus"]')?.value || 0);
    const propertyValue = parseFloat(document.querySelector('input[name="property_value"]')?.value || 0);
    const propertyModel = document.querySelector('input[name="property_model"]:checked')?.value || 'A';
    const salePrice = parseFloat(document.querySelector('input[name="sale_price"]')?.value || 0);
    const projectCost = parseFloat(document.querySelector('input[name="project_cost"]')?.value || 0);
    
    // Calculate pools using 100% budget approach
    const rolePool = devBonus + constBonus + invBonus;
    
    let propertyPool = 0;
    let basePool = 0;
    let propertyShare = 0;
    let propertyProfitShare = 0;
    let propertyProfitShareEffective = 0;
    
    if (propertyModel === 'A') {
        propertyShare = parseFloat(document.querySelector('input[name="property_share"]')?.value || 0);
        propertyProfitShare = parseFloat(document.querySelector('input[name="property_profit_share"]')?.value || 0);
        const projectProfit = salePrice - projectCost;
        propertyProfitShareEffective = (propertyValue > 0 && projectProfit > 0) ? propertyProfitShare : 0;
        propertyPool = propertyShare + propertyProfitShareEffective;
        basePool = 100 - rolePool - propertyPool;
    } else {
        // Model B: no property pool
        propertyPool = 0;
        basePool = 100 - rolePool;
    }
    
    // Calculate cash total (Model A: exclude property, Model B: include property)
    let cashTotal = 0;
    document.querySelectorAll('.investor-box').forEach((box) => {
        const roleSelect = box.querySelector('select[name^="role"]');
        const paymentInput = box.querySelector('input[name^="paid"]');
        if (roleSelect && paymentInput && roleSelect.value && roleSelect.value !== 'Developer') {
            const payment = parseFloat(paymentInput.value || 0);
            if (!isNaN(payment) && payment > 0) {
                cashTotal += payment;
            }
        }
    });
    
    // In Model B, include property value in cash total
    if (propertyModel === 'B' && propertyValue > 0) {
        cashTotal += propertyValue;
    }
    
    // Base pool breakdown (how it would be distributed)
    let baseBreakdown = [];
    if (cashTotal > 0 && basePool > 0) {
        document.querySelectorAll('.investor-box').forEach((box) => {
            const roleSelect = box.querySelector('select[name^="role"]');
            const paymentInput = box.querySelector('input[name^="paid"]');
            if (roleSelect && paymentInput && roleSelect.value && roleSelect.value !== 'Developer') {
                const payment = parseFloat(paymentInput.value || 0);
                if (!isNaN(payment) && payment > 0) {
                    const share = (payment / cashTotal) * basePool;
                    baseBreakdown.push(`${payment.toFixed(2)}€ → ${share.toFixed(2)}%`);
                }
            }
        });
    }
    
    // Role pool breakdown
    const roleBreakdown = [];
    if (devBonus > 0) roleBreakdown.push(`Dev ${devBonus.toFixed(2)}%`);
    if (constBonus > 0) roleBreakdown.push(`Const ${constBonus.toFixed(2)}%`);
    if (invBonus > 0) roleBreakdown.push(`Inv ${invBonus.toFixed(2)}%`);
    
    // Property pool breakdown (Model A only)
    let propertyBreakdown = [];
    if (propertyModel === 'A' && propertyValue > 0) {
        propertyBreakdown.push(`Base ${propertyShare.toFixed(2)}%`);
        if (propertyProfitShareEffective > 0) {
            propertyBreakdown.push(`Profit ${propertyProfitShareEffective.toFixed(2)}%`);
        }
    }
    
    // In Model B, add property owner to base breakdown
    if (propertyModel === 'B' && propertyValue > 0 && cashTotal > 0 && basePool > 0) {
        const propName = document.querySelector('input[name="property_owner"]')?.value?.trim() || 'Property Owner';
        const share = (propertyValue / cashTotal) * basePool;
        baseBreakdown.push(`${propName}: ${propertyValue.toFixed(2)}€ → ${share.toFixed(2)}%`);
    }
    
    // Update display
    const basePoolEl = document.getElementById('calc-base-pool');
    if (basePoolEl) {
        basePoolEl.textContent = basePool.toFixed(2) + '%';
    }
    const baseBreakdownEl = document.getElementById('calc-base-breakdown');
    if (baseBreakdownEl) {
        baseBreakdownEl.textContent = baseBreakdown.length > 0 ? baseBreakdown.join(', ') : (basePool > 0 ? 'No cash contributors' : 'N/A');
    }
    
    const rolePoolsEl = document.getElementById('calc-role-pools');
    if (rolePoolsEl) {
        rolePoolsEl.textContent = rolePool.toFixed(2) + '%';
    }
    const roleBreakdownEl = document.getElementById('calc-role-breakdown');
    if (roleBreakdownEl) {
        roleBreakdownEl.textContent = roleBreakdown.length > 0 ? roleBreakdown.join(', ') : 'No bonuses';
    }
    
    // Show property pool only in Model A and if property value > 0
    if (propertyModel === 'A' && propertyValue > 0 && propertyPool > 0) {
        const propertyItem = document.getElementById('calc-property-item');
        if (propertyItem) propertyItem.style.display = 'block';
        const propertyPoolEl = document.getElementById('calc-property-pool');
        if (propertyPoolEl) propertyPoolEl.textContent = propertyPool.toFixed(2) + '%';
        const propertyBreakdownEl = document.getElementById('calc-property-breakdown');
        if (propertyBreakdownEl) propertyBreakdownEl.textContent = propertyBreakdown.join(' + ');
    } else {
        const propertyItem = document.getElementById('calc-property-item');
        if (propertyItem) propertyItem.style.display = 'none';
    }
    
    const totalEl = document.getElementById('calc-total');
    if (totalEl) {
        totalEl.textContent = '100.00%';
    }
    
    // Determine status and highlight fields
    const totalItem = document.getElementById('calc-total-item');
    const statusDiv = document.getElementById('calc-total-status');
    
    // Remove all highlight classes
    document.querySelectorAll('input[name="developer_bonus"], input[name="constructor_bonus"], input[name="investor_bonus"], input[name="property_share"], input[name="property_profit_share"]').forEach(el => {
        el.classList.remove('field-highlight-error', 'field-highlight-warning');
    });
    
    if (basePool < 0) {
        if (totalItem) totalItem.className = 'calc-item error';
        if (statusDiv) {
            statusDiv.textContent = `Exceeds 100% by ${Math.abs(basePool).toFixed(2)}%`;
            statusDiv.style.color = '#f44336';
        }
        
        // Highlight all contributing fields
        if (devBonus > 0) {
            const el = document.querySelector('input[name="developer_bonus"]');
            if (el) el.classList.add('field-highlight-error');
        }
        if (constBonus > 0) {
            const el = document.querySelector('input[name="constructor_bonus"]');
            if (el) el.classList.add('field-highlight-error');
        }
        if (invBonus > 0) {
            const el = document.querySelector('input[name="investor_bonus"]');
            if (el) el.classList.add('field-highlight-error');
        }
            if (propertyModel === 'A') {
            if (propertyShare > 0) {
                const el = document.querySelector('input[name="property_share"]');
                if (el) el.classList.add('field-highlight-error');
            }
            if (propertyProfitShareEffective > 0) {
                const el = document.querySelector('input[name="property_profit_share"]');
                if (el) el.classList.add('field-highlight-error');
            }
        }
    } else if (basePool >= 0 && basePool <= 5) {
        if (totalItem) totalItem.className = 'calc-item warning';
        if (statusDiv) {
            statusDiv.textContent = `Base pool: ${basePool.toFixed(2)}% (close to limit)`;
            statusDiv.style.color = '#ff9800';
        }
    } else {
        if (totalItem) totalItem.className = 'calc-item success';
        if (statusDiv) {
            statusDiv.textContent = `Base pool: ${basePool.toFixed(2)}%`;
            statusDiv.style.color = '#4caf50';
        }
    }
    
    // Show panel if there are any values (but respect visibility checkbox)
    const hasValues = devBonus > 0 || constBonus > 0 || invBonus > 0 || propertyValue > 0 || cashTotal > 0;
    const visibilityCheckbox = document.getElementById('calc-visibility-checkbox');
    const isVisible = visibilityCheckbox ? visibilityCheckbox.checked : true;
    
    if (panel) {
        if (hasValues && isVisible) {
            panel.style.display = 'block';
            panel.classList.remove('hidden');
            // Ensure panel is expanded when shown (unless user has collapsed it)
            if (!panel.classList.contains('user-collapsed')) {
                panel.classList.remove('collapsed');
                const icon = document.querySelector('#calc-toggle-btn .calc-toggle-icon');
                if (icon) {
                    icon.textContent = '−';
                }
            }
        } else if (!isVisible) {
            // User has unchecked the visibility checkbox
            panel.classList.add('hidden');
            const showBtn = document.getElementById('calc-show-btn');
            if (showBtn) showBtn.style.display = 'flex';
        } else {
            // No values, hide panel
            panel.style.display = 'none';
            const showBtn = document.getElementById('calc-show-btn');
            if (showBtn && !isVisible) showBtn.style.display = 'flex';
        }
    }
}

// Update budget bar visualization
function updateBudgetBar() {
    const container = document.getElementById('budget-bar');
    if (!container) return;
    
    // Get values from calculation panel or compute them
    const devBonus = parseFloat(document.querySelector('input[name="developer_bonus"]')?.value || 0);
    const constBonus = parseFloat(document.querySelector('input[name="constructor_bonus"]')?.value || 0);
    const invBonus = parseFloat(document.querySelector('input[name="investor_bonus"]')?.value || 0);
    const propertyValue = parseFloat(document.querySelector('input[name="property_value"]')?.value || 0);
    const propertyModel = document.querySelector('input[name="property_model"]:checked')?.value || 'A';
    const salePrice = parseFloat(document.querySelector('input[name="sale_price"]')?.value || 0);
    const projectCost = parseFloat(document.querySelector('input[name="project_cost"]')?.value || 0);
    
    const rolePool = devBonus + constBonus + invBonus;
    const projectProfit = salePrice - projectCost;
    
    let propertyPool = 0;
    let basePool = 0;
    
    if (propertyModel === 'A') {
        const propertyShare = parseFloat(document.querySelector('input[name="property_share"]')?.value || 0);
        const propertyProfitShare = parseFloat(document.querySelector('input[name="property_profit_share"]')?.value || 0);
        const propertyProfitShareEffective = (propertyValue > 0 && projectProfit > 0) ? propertyProfitShare : 0;
        propertyPool = propertyShare + propertyProfitShareEffective;
        basePool = 100 - rolePool - propertyPool;
    } else {
        // Model B: no property pool
        propertyPool = 0;
        basePool = 100 - rolePool;
    }
    
    const baseEl = document.getElementById('bar-base');
    const roleEl = document.getElementById('bar-role');
    const propEl = document.getElementById('bar-prop');
    
    const clamp = v => Math.max(0, Math.min(100, v));
    
    if (baseEl) baseEl.style.width = clamp(basePool) + '%';
    if (roleEl) roleEl.style.width = clamp(rolePool) + '%';
    if (propEl) propEl.style.width = clamp(propertyPool) + '%';
    
    // Danger state when over-allocated
    const over = (rolePool + propertyPool) > 100;
    if (container) {
        container.style.boxShadow = over ? '0 0 0 2px #ef4444 inset' : 'none';
        container.style.border = over ? '1px solid #ef4444' : 'none';
    }
}

// Gate Calculate button when budget exceeds 100%
function gateCalculate() {
    const btn = document.querySelector('button[type="submit"]');
    if (!btn) return;
    
    const devBonus = parseFloat(document.querySelector('input[name="developer_bonus"]')?.value || 0);
    const constBonus = parseFloat(document.querySelector('input[name="constructor_bonus"]')?.value || 0);
    const invBonus = parseFloat(document.querySelector('input[name="investor_bonus"]')?.value || 0);
    const propertyValue = parseFloat(document.querySelector('input[name="property_value"]')?.value || 0);
    const propertyModel = document.querySelector('input[name="property_model"]:checked')?.value || 'A';
    const salePrice = parseFloat(document.querySelector('input[name="sale_price"]')?.value || 0);
    const projectCost = parseFloat(document.querySelector('input[name="project_cost"]')?.value || 0);
    
    const rolePool = devBonus + constBonus + invBonus;
    const projectProfit = salePrice - projectCost;
    
    let over = false;
    let errorMsg = '';
    
    if (propertyModel === 'A') {
        const propertyShare = parseFloat(document.querySelector('input[name="property_share"]')?.value || 0);
        const propertyProfitShare = parseFloat(document.querySelector('input[name="property_profit_share"]')?.value || 0);
        const propertyProfitShareEffective = (propertyValue > 0 && projectProfit > 0) ? propertyProfitShare : 0;
        const propertyPool = propertyShare + propertyProfitShareEffective;
        over = (rolePool + propertyPool) > 100;
        if (over) errorMsg = 'Reduce role/property pools to ≤ 100% total.';
    } else {
        // Model B: check role pool and profit bounds
        over = rolePool > 100;
        if (over) {
            errorMsg = 'Reduce role pools to ≤ 100%.';
        } else {
            // Check profit min/max bounds
            const minVal = parseFloat(document.querySelector('input[name="property_profit_min_pct"]')?.value || 0);
            const maxVal = parseFloat(document.querySelector('input[name="property_profit_max_pct"]')?.value || 0);
            if (document.querySelector('input[name="property_profit_min_pct"]')?.value && 
                document.querySelector('input[name="property_profit_max_pct"]')?.value) {
                if (minVal > maxVal) {
                    over = true;
                    errorMsg = 'Property profit min cannot be greater than max.';
                }
            }
        }
    }
    
    btn.disabled = over;
    btn.title = over ? errorMsg : '';
    if (over) {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    } else {
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
}

// Render results from JSON API response
function renderResultsJSON(data) {
    // Rebuild the results table
    const section = document.getElementById('results-section');
    if (!section) return;
    
    // Show results section
    section.style.display = 'block';
    
    // Add heading if it doesn't exist
    let heading = section.querySelector('h2');
    if (!heading) {
        heading = document.createElement('h2');
        heading.textContent = 'Results';
        section.insertBefore(heading, section.firstChild);
    }
    
    // Create summary-info if it doesn't exist
    let summaryInfo = section.querySelector('.summary-info');
    if (!summaryInfo) {
        summaryInfo = document.createElement('div');
        summaryInfo.className = 'summary-info';
        summaryInfo.style.cssText = 'margin-bottom: 20px;';
        section.insertBefore(summaryInfo, heading.nextSibling);
    }
    
    // Update summary info content
    const totalsData = data.totals || {};
    const poolsData = data.pools || {};
    summaryInfo.innerHTML = `
        <strong>Project Cost:</strong> €${Number(totalsData.project_cost || 0).toFixed(2)}<br>
        <strong>Project Sale Price:</strong> €${Number(totalsData.sale_price || 0).toFixed(2)}<br>
        <strong>Total Profit:</strong> €${Number(totalsData.profit || 0).toFixed(2)}<br>
        <strong>Cash Investment (excl. property):</strong> €${Number(totalsData.cash_total || 0).toFixed(2)}<br>
        <strong>Developer Bonus:</strong> ${Number(poolsData.dev || 0).toFixed(2)}%<br>
        <strong>Constructor Bonus:</strong> ${Number(poolsData.const || 0).toFixed(2)}%<br>
        <strong>Investor Bonus:</strong> ${Number(poolsData.inv || 0).toFixed(2)}%
    `;
    
    // Update data attributes for budget bar and guards
    summaryInfo.dataset.basePool = (poolsData.base_pool ?? '0');
    summaryInfo.dataset.rolePool = (poolsData.role_pool ?? '0');
    summaryInfo.dataset.propertyPool = (poolsData.property_pool ?? '0');
    summaryInfo.dataset.cashTotal = (totalsData.cash_total ?? '0');
    
    let table = section.querySelector('table');
    if (!table) {
        // Create table if it doesn't exist
        table = document.createElement('table');
        section.appendChild(table);
    }
    
    // Create/update header
    let thead = table.querySelector('thead');
    if (!thead) {
        thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Payment (€)</th>
                <th>Base Share (%)</th>
                <th>Role Bonus (%)</th>
                <th>Property Share (%)</th>
                <th>Total Share (%)</th>
                <th>Final Share Value (€)</th>
                <th>Profit Value (€)</th>
            </tr>
        `;
        table.appendChild(thead);
    }
    
    // Create tbody
    const tbody = document.createElement('tbody');
    
    // Fill rows
    (data.results || []).forEach(r => {
        const tr = document.createElement('tr');
        const equityPct = Number(r.total_equity_pct || r.total_share_pct || 0);
        const profitPct = Number(r.total_profit_pct || r.total_share_pct || 0);
        tr.innerHTML = `
            <td>${r.name}</td>
            <td>${r.role}</td>
            <td>${Number(r.payment).toFixed(2)}</td>
            <td>${Number(r.share_base_pct || 0).toFixed(2)}</td>
            <td>${Number(r.share_role_pct || 0).toFixed(2)}</td>
            <td>${Number(r.share_property_pct || 0).toFixed(2)}</td>
            <td>${equityPct.toFixed(2)}</td>
            <td>${profitPct.toFixed(2)}</td>
            <td>${Number(r.final_value || 0).toFixed(2)}</td>
            <td>${Number(r.profit_value || 0).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Totals row (reuse poolsData and totalsData from above)
    const trTot = document.createElement('tr');
    trTot.style.fontWeight = 'bold';
    trTot.style.backgroundColor = '#f8f9fa';
    const totalEquityPct = Number(totalsData.total_pct_sum_equity || totalsData.total_pct_sum || 0);
    const totalProfitPct = Number(totalsData.total_pct_sum_profit || totalsData.total_pct_sum || 0);
    trTot.innerHTML = `
        <td colspan="2">Totals</td>
        <td>${Number(totalsData.cash_total || 0).toFixed(2)}</td>
        <td>${Number(poolsData.base_pool || 0).toFixed(2)}</td>
        <td>${Number(poolsData.role_pool || 0).toFixed(2)}</td>
        <td>${Number(poolsData.property_pool || 0).toFixed(2)}</td>
        <td>${totalEquityPct.toFixed(2)}</td>
        <td>${totalProfitPct.toFixed(2)}</td>
        <td>${Number(totalsData.sale_price || 0).toFixed(2)}</td>
        <td>${Number(totalsData.profit || 0).toFixed(2)}</td>
    `;
    tbody.appendChild(trTot);
    
    // Replace old tbody
    const oldTbody = table.querySelector('tbody');
    if (oldTbody) {
        oldTbody.replaceWith(tbody);
    } else {
        table.appendChild(tbody);
    }
    
    // Render banners (errors/warnings)
    const bannerHost = document.querySelector('#live-banners') || section.parentElement || section;
    
    // Clear previous live banners
    bannerHost.querySelectorAll('.banner-live').forEach(el => el.remove());
    
    const hasErrors = data.banners?.errors && data.banners.errors.length > 0;
    const hasWarnings = data.banners?.warnings && data.banners.warnings.length > 0;
    
    // Add error banners
    (data.banners?.errors || []).forEach(msg => {
        const div = document.createElement('div');
        div.className = 'error banner-live';
        div.innerHTML = `<strong>Error:</strong> ${msg}`;
        bannerHost.insertBefore(div, bannerHost.firstChild);
    });
    
    // Add warning banners
    (data.banners?.warnings || []).forEach(msg => {
        const div = document.createElement('div');
        div.className = 'warning banner-live';
        div.innerHTML = `<strong>Warning:</strong> ${msg}`;
        bannerHost.insertBefore(div, bannerHost.firstChild);
    });
    
    // Hide table if errors exist, show with overlay if warnings
    if (hasErrors) {
        section.style.display = 'none';
    } else {
        section.style.display = 'block';
        if (table) {
            if (hasWarnings) {
                table.style.opacity = '0.8';
            } else {
                table.style.opacity = '1';
            }
            table.style.pointerEvents = 'auto';
        }
    }
    
    // Add export buttons if they don't exist
    const exportButtons = section.querySelector('.export-buttons-container');
    if (!exportButtons && section.querySelector('table')) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'export-buttons-container';
        buttonsDiv.style.cssText = 'margin-bottom: 20px;';
        buttonsDiv.innerHTML = `
            <button class="button export-button" type="button" id="export-pdf">Export as PDF</button>
            <button id="export-csv" class="button export-button" type="button" style="background-color:#00bcd4;">Export as CSV</button>
        `;
        section.insertBefore(buttonsDiv, section.firstChild);
        
        // Wire up export buttons
        const pdfBtn = document.getElementById('export-pdf');
        const csvBtn = document.getElementById('export-csv');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', exportToPDF);
        }
        if (csvBtn) {
            csvBtn.addEventListener('click', exportTableToCSV);
        }
    }
    
    // Refresh budget bar & gates
    updateBudgetBar();
    gateCalculate();
}

// Live calculation via API
function updateResultsLive() {
    const form = document.getElementById('calc-form');
    if (!form) return;
    
    const payload = serializeFormToPayload();
    
    // Check if we have minimal inputs
    if (!payload.project_cost || !payload.sale_price || !payload.participants || payload.participants.length === 0) {
        // Hide results section if no data
        const section = document.getElementById('results-section');
        if (section) {
            section.style.display = 'none';
        }
        return; // Don't call API with empty inputs
    }
    
    // Abort prior request
    if (liveCtrl) {
        liveCtrl.abort();
    }
    liveCtrl = new AbortController();
    
    fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: liveCtrl.signal
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        renderResultsJSON(data);
    })
    .catch(err => {
        if (err.name === 'AbortError') {
            return; // Expected on rapid edits
        }
        console.warn('Live calc failed', err);
        // Optionally show a transient error message
    });
}

// Update budget warning for role pools header
function updateBudgetWarning() {
    // Get form values
    const devBonus = parseFloat(document.querySelector('input[name="developer_bonus"]')?.value || 0);
    const constBonus = parseFloat(document.querySelector('input[name="constructor_bonus"]')?.value || 0);
    const invBonus = parseFloat(document.querySelector('input[name="investor_bonus"]')?.value || 0);
    const propertyValue = parseFloat(document.querySelector('input[name="property_value"]')?.value || 0);
    const propertyModel = document.querySelector('input[name="property_model"]:checked')?.value || 'A';
    const salePrice = parseFloat(document.querySelector('input[name="sale_price"]')?.value || 0);
    const projectCost = parseFloat(document.querySelector('input[name="project_cost"]')?.value || 0);

    // Calculate pools using 100% budget approach
    const rolePool = devBonus + constBonus + invBonus;
    
    let over = false;
    if (propertyModel === 'A') {
        const propertyShare = parseFloat(document.querySelector('input[name="property_share"]')?.value || 0);
        const propertyProfitShare = parseFloat(document.querySelector('input[name="property_profit_share"]')?.value || 0);
        const projectProfit = salePrice - projectCost;
        const propertyProfitShareEffective = (propertyValue > 0 && projectProfit > 0) ? propertyProfitShare : 0;
        const propertyPool = propertyShare + propertyProfitShareEffective;
        over = (rolePool + propertyPool) > 100;
    } else {
        // Model B: only check role pool
        over = rolePool > 100;
    }
    
    // Set warning on role pools help icon
    setWarnIcon(document.getElementById('role-pools-help'), over);
}

