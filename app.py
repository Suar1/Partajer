from flask import Flask, request, render_template_string
from collections import defaultdict

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Investment Share Calculator</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            background-color: #f5f5f5;
        }
        h1 { margin-bottom: 30px; }
        .summary-info {
            background-color: #e9ecef;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            line-height: 1.6;
        }
        .warning { 
            background-color: #fff3cd; 
            color: #856404; 
            padding: 12px; 
            margin: 20px 0;
            border-radius: 4px;
        }
        .role-section {
            background-color: #f8f9fa;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .role-info {
            color: #666;
            font-style: italic;
            margin: 10px 0 20px 0;
        }
        label {
            display: inline-block;
            width: 180px;
        }
        input[type="text"],
        input[type="number"],
        select {
            width: 200px;
            padding: 4px 8px;
            margin: 2px 0;
            border: 1px solid #ddd;
            border-radius: 3px;
        }
        .investor-box {
            background: white;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .button {
            background-color: #4CAF50;
            color: white;
            padding: 6px 12px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            margin-right: 10px;
            font-size: 14px;
        }
        .button:hover {
            background-color: #45a049;
        }
        .export-button {
            background-color: #2196F3;
        }
        .export-button:hover {
            background-color: #1976D2;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
        }
        .current-split {
            color: #666;
            font-style: italic;
            margin-left: 180px;
            font-size: 0.9em;
        }
        .hidden {
            display: none !important;
        }
        .field-row {
            margin: 8px 0;
        }
        #investors {
            margin: 20px 0;
        }
        .role-distribution {
            background-color: #e3f2fd;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border-left: 4px solid #1976d2;
        }
        .role-stat {
            margin: 5px 0;
            color: #333;
        }
        #live-distribution {
            transition: all 0.3s ease;
        }
        .property-section {
            background-color: #e8f5e9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border-left: 4px solid #43a047;
        }
        .optional-label {
            color: #666;
            font-size: 0.9em;
            margin-left: 5px;
        }
        .property-info {
            color: #666;
            font-style: italic;
            margin: 5px 0 15px 180px;
            font-size: 0.9em;
        }
        .load-button {
            background-color: #7e57c2;
        }
        .load-button:hover {
    </style>
</head>
<body>
    <h1>Investment Share Calculator</h1>

    <div id="live-distribution" class="role-distribution" style="display: none;">
        <h3 style="margin-top: 0;">Current Role Distribution</h3>
        <div class="role-stat">
            <strong>Developers:</strong> <span id="dev-count">0</span> person(s)
            - Each gets <span id="dev-bonus">0.00</span>% bonus
        </div>
        <div class="role-stat">
            <strong>Constructors:</strong> <span id="const-count">0</span> person(s)
            - Each gets <span id="const-bonus">0.00</span>% bonus
        </div>
        <div class="role-stat">
            <strong>Investors:</strong> <span id="inv-count">0</span> person(s)
            - Each gets <span id="inv-bonus">0.00</span>% bonus
        </div>
        <div class="role-stat" style="margin-top: 10px;">
            <strong>Total Investment:</strong> €<span id="total-investment">0.00</span>
        </div>
    </div>

    {% if investment_warning %}
    <div class="warning">
        {{ investment_warning }}
    </div>
    {% endif %}

    <form method="POST">
        <div class="role-section">
            <h2>Role Total Bonus Percentages</h2>
            <p class="role-info">Note: Each role's bonus percentage will be divided equally among all members with that role.</p>

            <div class="field-row">
                <label>Total Developer Bonus (%):</label>
                <input type="number" name="developer_bonus" value="{{ request.form.get('developer_bonus', '40') }}" required>
                {% if developer_count %}
                <div class="current-split">Current split: {{ "%.2f"|format(developer_bonus_per_person) }}% per developer ({{ developer_count }} developers)</div>
                {% endif %}
            </div>

            <div class="field-row">
                <label>Total Constructor Bonus (%):</label>
                <input type="number" name="constructor_bonus" value="{{ request.form.get('constructor_bonus', '8') }}" required>
                {% if constructor_count %}
                <div class="current-split">Current split: {{ "%.2f"|format(constructor_bonus_per_person) }}% per constructor ({{ constructor_count }} constructors)</div>
                {% endif %}
            </div>

            <div class="field-row">
                <label>Total Investor Bonus (%):</label>
                <input type="number" name="investor_bonus" value="{{ request.form.get('investor_bonus', '40') }}" required>
                {% if investor_count %}
                <div class="current-split">Current split: {{ "%.2f"|format(investor_bonus_per_person) }}% per investor ({{ investor_count }} investors)</div>
                {% endif %}
            </div>
        </div>

        <div class="property-section">
            <h3 style="margin-top: 0;">Property Owner Contribution <span class="optional-label">(Optional)</span></h3>
            <p class="property-info">Fill this section only if there is a property owner contributing land or property to the project.</p>
            <div class="field-row">
                <label>Property Value (€):</label>
                <input type="number" name="property_value" value="{{ request.form.get('property_value', '') }}" min="0">
            </div>
            <div class="field-row">
                <label>Property Owner Name:</label>
                <input type="text" name="property_owner" value="{{ request.form.get('property_owner', '') }}">
            </div>
            <div class="field-row">
                <label>Base Share (%):</label>
                <input type="number" name="property_share" value="{{ request.form.get('property_share', '10') }}" min="0" max="100">
                <div class="role-info">Base share from property value contribution</div>
            </div>
            <div class="field-row">
                <label>Profit Share (%):</label>
                <input type="number" name="property_profit_share" value="{{ request.form.get('property_profit_share', '5') }}" min="0" max="100">
                <div class="role-info">Additional share from project profits</div>
            </div>
        </div>

        <div class="field-row">
            <label>Project Cost (€):</label>
            <input type="number" name="project_cost" value="{{ request.form.get('project_cost', '') }}" required>
        </div>

        <div class="field-row">
            <label>Project Sale Price (€):</label>
            <input type="number" name="sale_price" value="{{ request.form.get('sale_price', '') }}" required>
        </div>

        <div id="investors">
            {% for i in range(1, (request.form|length - 4) // 3 + 1) if request.form.get('name' ~ i) %}
            <div class="investor-box">
                <div class="field-row">
                    <label>Name:</label>
                    <input type="text" name="name{{ i }}" value="{{ request.form.get('name' ~ i) }}" required>
                </div>
                <div class="field-row">
                    <label>Role:</label>
                    <select name="role{{ i }}" onchange="togglePaymentField({{ i }})" required>
                        <option value="">Select Role</option>
                        <option value="Developer" {% if request.form.get('role' ~ i) == 'Developer' %}selected{% endif %}>Developer</option>
                        <option value="Constructor" {% if request.form.get('role' ~ i) == 'Constructor' %}selected{% endif %}>Constructor</option>
                        <option value="Investor" {% if request.form.get('role' ~ i) == 'Investor' %}selected{% endif %}>Investor</option>
                    </select>
                </div>
                <div id="payment-group{{ i }}" class="field-row {% if request.form.get('role' ~ i) == 'Developer' %}hidden{% endif %}">
                    <label>Payment (€):</label>
                    <input type="number" name="paid{{ i }}" value="{{ request.form.get('paid' ~ i, '0') }}" min="0">
                </div>
            </div>
            {% endfor %}

            {% if not request.form %}
            <div class="investor-box">
                <div class="field-row">
                    <label>Name:</label>
                    <input type="text" name="name1" required>
                </div>
                <div class="field-row">
                    <label>Role:</label>
                    <select name="role1" onchange="togglePaymentField(1)" required>
                        <option value="">Select Role</option>
                        <option value="Developer">Developer</option>
                        <option value="Constructor">Constructor</option>
                        <option value="Investor">Investor</option>
                    </select>
                </div>
                <div id="payment-group1" class="field-row">
                    <label>Payment (€):</label>
                    <input type="number" name="paid1" min="0">
                </div>
            </div>
            {% endif %}
        </div>

        <button type="button" class="button" onclick="addInvestor()">Add Investor</button>
        <button type="submit" class="button">Calculate</button>
        <button type="button" class="button" style="background-color: #ff9800;" onclick="resetForm()">New Calculation</button>
    </form>

    {% if results %}
    <h2>Results</h2>
    <div style="margin-bottom: 20px;">
        <button onclick="exportToPDF()" class="button export-button">Export as PDF</button>
    </div>
    <div id="results-section">
        <div class="summary-info" style="margin-bottom: 20px;"
             data-project-cost="{{ project_cost }}"
             data-sale-price="{{ request.form.get('sale_price') }}"
             data-developer-bonus="{{ request.form.get('developer_bonus') }}"
             data-constructor-bonus="{{ request.form.get('constructor_bonus') }}"
             data-investor-bonus="{{ request.form.get('investor_bonus') }}"
             data-property-value="{{ property_value }}"
             data-property-owner="{{ property_owner }}"
             data-property-share="{{ property_share }}">
            <strong>Project Cost:</strong> €{{ "%.2f"|format(project_cost) }}<br>
            <strong>Project Sale Price:</strong> €{{ "%.2f"|format(request.form.get('sale_price')|float) }}<br>
            <strong>Total Profit:</strong> €{{ "%.2f"|format(request.form.get('sale_price')|float - project_cost) }}<br>
            <strong>Total Investment:</strong> €{{ "%.2f"|format(total_investment) }}<br>
            {% if property_value > 0 %}
            <strong>Property Contribution:</strong> €{{ "%.2f"|format(property_value) }}<br>
            <strong>Property Base Share:</strong> {{ "%.2f"|format(property_share) }}%<br>
            <strong>Property Profit Share:</strong> {{ "%.2f"|format(request.form.get('property_profit_share', '5')|float) }}%<br>
            {% endif %}
            <strong>Developer Bonus:</strong> {{ request.form.get('developer_bonus', '40') }}%<br>
            <strong>Constructor Bonus:</strong> {{ request.form.get('constructor_bonus', '8') }}%<br>
            <strong>Investor Bonus:</strong> {{ request.form.get('investor_bonus', '40') }}%
        </div>
        <table>
            <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Payment (€)</th>
                <th>Base Share (%)</th>
                <th>Role Bonus (%)</th>
                <th>Profit Share (%)</th>
                <th>Total Share (%)</th>
                <th>Final Share Value (€)</th>
                <th>Profit Value (€)</th>
            </tr>
            {% for result in results %}
            <tr>
                <td>{{ result.name }}</td>
                <td>{{ result.role }}</td>
                <td>{{ "%.2f"|format(result.payment) }}</td>
                <td>{{ "%.2f"|format(result.share) }}</td>
                <td>{{ "%.2f"|format(result.bonus) }}</td>
                <td>{{ "%.2f"|format(result.profit_bonus) }}</td>
                <td>{{ "%.2f"|format(result.total_share) }}</td>
                <td>{{ "%.2f"|format(request.form.get('sale_price')|float * result.total_share / 100) }}</td>
                <td>{{ "%.2f"|format((request.form.get('sale_price')|float - project_cost) * result.total_share / 100) }}</td>
            </tr>
            {% endfor %}
            <tr style="font-weight: bold; background-color: #f8f9fa;">
                <td colspan="2">Totals</td>
                <td>{{ "%.2f"|format(total_investment) }}</td>
                <td>100.00</td>
                <td>{{ "%.2f"|format((request.form.get('developer_bonus', '40')|float) + 
                    (request.form.get('constructor_bonus', '8')|float) + 
                    (request.form.get('investor_bonus', '40')|float) + 
                    (property_share if property_value > 0 else 0)) }}</td>
                <td>{{ "%.2f"|format(property_profit_share if property_value > 0 else 0) }}</td>
                <td>{{ "%.2f"|format(results|sum(attribute='total_share')) }}</td>
                <td>{{ "%.2f"|format(request.form.get('sale_price')|float) }}</td>
                <td>{{ "%.2f"|format(request.form.get('sale_price')|float - project_cost) }}</td>
            </tr>
        </table>
    </div>
    {% endif %}

    <script>
        let investorCount = {{ (request.form|length - 4) // 3 if request.form else 1 }};
        const maxInvestors = 10;

        function togglePaymentField(index) {
            const role = document.querySelector(`select[name="role${index}"]`).value;
            const paymentGroup = document.getElementById(`payment-group${index}`);
            const paymentInput = paymentGroup.querySelector('input[type="number"]');
            
            if (role === 'Developer') {
                paymentGroup.classList.add('hidden');
                paymentInput.value = '0';
                paymentInput.required = false;
            } else {
                paymentGroup.classList.remove('hidden');
                paymentInput.required = true;
                if (paymentInput.value === '0') {
                    paymentInput.value = '';
                }
            }
        }

        function addInvestor() {
            if (investorCount >= maxInvestors) {
                alert('Maximum number of investors reached!');
                return;
            }

            investorCount++;
            const investorsDiv = document.getElementById('investors');
            
            const newInvestorBox = document.createElement('div');
            newInvestorBox.className = 'investor-box';
            newInvestorBox.innerHTML = `
                <div class="field-row">
                    <label>Name:</label>
                    <input type="text" name="name${investorCount}" required>
                </div>
                <div class="field-row">
                    <label>Role:</label>
                    <select name="role${investorCount}" onchange="togglePaymentField(${investorCount})" required>
                        <option value="">Select Role</option>
                        <option value="Developer">Developer</option>
                        <option value="Constructor">Constructor</option>
                        <option value="Investor">Investor</option>
                    </select>
                </div>
                <div id="payment-group${investorCount}" class="field-row">
                    <label>Payment (€):</label>
                    <input type="number" name="paid${investorCount}" min="0">
                </div>
            `;
            
            investorsDiv.appendChild(newInvestorBox);
        }

        // Initialize payment fields visibility
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('select[name^="role"]').forEach((select) => {
                const index = select.name.replace('role', '');
                togglePaymentField(index);
            });
        });

        function updateDistribution() {
            let devCount = 0;
            let constCount = 0;
            let invCount = 0;
            let totalInvestment = 0;

            // Count roles and calculate total investment
            document.querySelectorAll('select[name^="role"]').forEach((select, index) => {
                const role = select.value;
                if (role === 'Developer') devCount++;
                if (role === 'Constructor') constCount++;
                if (role === 'Investor') invCount++;

                // Add to total investment if not Developer
                if (role && role !== 'Developer') {
                    const payment = parseFloat(document.querySelector(`input[name="paid${index + 1}"]`)?.value || 0);
                    if (!isNaN(payment)) totalInvestment += payment;
                }
            });

            // Get bonus percentages
            const devBonus = parseFloat(document.querySelector('input[name="developer_bonus"]').value || 0);
            const constBonus = parseFloat(document.querySelector('input[name="constructor_bonus"]').value || 0);
            const invBonus = parseFloat(document.querySelector('input[name="investor_bonus"]').value || 0);

            // Update the display
            document.getElementById('dev-count').textContent = devCount;
            document.getElementById('const-count').textContent = constCount;
            document.getElementById('inv-count').textContent = invCount;
            
            document.getElementById('dev-bonus').textContent = devCount ? (devBonus / devCount).toFixed(2) : "0.00";
            document.getElementById('const-bonus').textContent = constCount ? (constBonus / constCount).toFixed(2) : "0.00";
            document.getElementById('inv-bonus').textContent = invCount ? (invBonus / invCount).toFixed(2) : "0.00";
            
            document.getElementById('total-investment').textContent = totalInvestment.toFixed(2);
            document.getElementById('live-distribution').style.display = 
                (devCount + constCount + invCount > 0) ? 'block' : 'none';
        }

        // Add event listeners for live updates
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.querySelector('form');
            form.addEventListener('input', updateDistribution);
            updateDistribution(); // Initial update
        });

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
                <div class="investor-box">
                    <div class="field-row">
                        <label>Name:</label>
                        <input type="text" name="name1" required>
                    </div>
                    <div class="field-row">
                        <label>Role:</label>
                        <select name="role1" onchange="togglePaymentField(1)" required>
                            <option value="">Select Role</option>
                            <option value="Developer">Developer</option>
                            <option value="Constructor">Constructor</option>
                            <option value="Investor">Investor</option>
                        </select>
                    </div>
                    <div id="payment-group1" class="field-row">
                        <label>Payment (€):</label>
                        <input type="number" name="paid1" min="0">
                    </div>
                </div>
            `;
            
            // Reset investor count
            investorCount = 1;
            
            // Reset live distribution
            document.getElementById('live-distribution').style.display = 'none';
            
            // Scroll to top of form
            document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
        }

        function exportToPDF() {
            const content = document.getElementById('results-section').cloneNode(true);
            const date = new Date().toLocaleDateString();
            
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
                        ${Array.from(content.querySelectorAll('table tr:not(:first-child):not(:last-child)')).map(row => {
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
            content.appendChild(signatureSection);

            const style = `
                <style>
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
                        ${content.outerHTML}
                    </body>
                </html>
            `);
            win.document.close();
            win.print();
        }
    </script>
</body>
</html>
"""

@app.route("/", methods=["GET", "POST"])
def calculate():
    # Initialize default values
    total_investment = 0
    investors = []
    error = None
    investment_warning = None
    developer_count = 0
    constructor_count = 0
    investor_count = 0
    developer_bonus_per_person = 0
    constructor_bonus_per_person = 0
    investor_bonus_per_person = 0
    results = []
    project_cost = 0
    sale_price = 0
    property_value = 0
    property_owner = ""
    property_share = 0
    property_profit_share = 0
    
    if request.method == 'POST':
        try:
            # Get project cost and sale price
            project_cost = float(request.form.get('project_cost', 0))
            sale_price = float(request.form.get('sale_price', 0))
            
            # Get property contribution details if provided
            property_value = float(request.form.get('property_value', 0) or 0)
            property_owner = request.form.get('property_owner', '').strip()
            property_share = float(request.form.get('property_share', 0) or 0)
            property_profit_share = float(request.form.get('property_profit_share', 0) or 0)
            
            # Calculate project profit
            project_profit = max(0, sale_price - project_cost)
            
            # Validate sale price
            if sale_price <= project_cost:
                investment_warning = "Warning: Sale price should be higher than the project cost for profit."
            
            # Get role bonuses
            developer_bonus = float(request.form.get('developer_bonus', 40))
            constructor_bonus = float(request.form.get('constructor_bonus', 8))
            investor_bonus = float(request.form.get('investor_bonus', 40))

            # Process each investor's data
            i = 1
            while f'name{i}' in request.form:
                name = request.form[f'name{i}'].strip()
                role = request.form[f'role{i}']
                
                if name and role:  # Only process if both name and role are provided
                    # Handle payment amount based on role
                    if role == 'Developer':
                        payment = 0
                        developer_count += 1
                    elif role == 'Constructor':
                        payment = float(request.form.get(f'paid{i}', 0) or 0)
                        constructor_count += 1
                    elif role == 'Investor':
                        payment = float(request.form.get(f'paid{i}', 0) or 0)
                        investor_count += 1
                    
                    investors.append({
                        'name': name,
                        'role': role,
                        'payment': payment
                    })
                    total_investment += payment
                i += 1

            # Add property owner as an investor if provided
            if property_owner and property_value > 0:
                investors.append({
                    'name': property_owner,
                    'role': 'Property Owner',
                    'payment': property_value,
                    'profit_share': property_profit_share
                })
                total_investment += property_value

            if not investors:
                raise ValueError("Please add at least one investor.")

            # Calculate per-person bonuses
            developer_bonus_per_person = developer_bonus / developer_count if developer_count > 0 else 0
            constructor_bonus_per_person = constructor_bonus / constructor_count if constructor_count > 0 else 0
            investor_bonus_per_person = investor_bonus / investor_count if investor_count > 0 else 0
            
            # Calculate shares and bonuses
            for investor in investors:
                share = 0
                bonus = 0
                profit_bonus = 0
                
                if investor['role'] == 'Developer':
                    bonus = developer_bonus_per_person
                elif investor['role'] == 'Constructor':
                    bonus = constructor_bonus_per_person
                elif investor['role'] == 'Investor':
                    bonus = investor_bonus_per_person
                elif investor['role'] == 'Property Owner':
                    bonus = property_share
                    profit_bonus = property_profit_share
                
                # Calculate base share
                if total_investment > 0:
                    share = (investor['payment'] / total_investment) * 100
                
                # Calculate final share including profit share for property owner
                total_share = share + bonus
                if investor['role'] == 'Property Owner' and project_profit > 0:
                    total_share += profit_bonus
                
                results.append({
                    'name': investor['name'],
                    'role': investor['role'],
                    'payment': investor['payment'],
                    'share': share,
                    'bonus': bonus,
                    'profit_bonus': profit_bonus if investor['role'] == 'Property Owner' else 0,
                    'total_share': total_share
                })

            # Check if total investment meets project cost
            if project_cost > 0 and total_investment < project_cost:
                investment_warning = f"Total investments (€{total_investment:.2f}) are less than the project cost (€{project_cost:.2f}). Need €{(project_cost - total_investment):.2f} more in investments."

        except ValueError as e:
            error = str(e)
        except Exception as e:
            error = f"An unexpected error occurred: {str(e)}"
    
    return render_template_string(
        HTML_TEMPLATE,
        results=results,
        total_investment=total_investment,
        project_cost=project_cost,
        error=error,
        investment_warning=investment_warning,
        developer_count=developer_count,
        constructor_count=constructor_count,
        investor_count=investor_count,
        developer_bonus_per_person=developer_bonus_per_person,
        constructor_bonus_per_person=constructor_bonus_per_person,
        investor_bonus_per_person=investor_bonus_per_person,
        property_value=property_value,
        property_owner=property_owner,
        property_share=property_share,
        property_profit_share=property_profit_share
    )

if __name__ == "__main__":
    app.run(debug=True) 