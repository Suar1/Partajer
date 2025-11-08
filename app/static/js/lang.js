/** Complete i18n dictionary for Investment Share Calculator */
window.i18n = {
    en: {
        title: "Investment Share Calculator",
        currentDist: "Current Role Distribution",
        dev: "Developers",
        const: "Constructors",
        inv: "Investors",
        liveEachGets: "Each gets",
        bonus: "bonus",
        person: "person(s)",
        cashInvest: "Cash Investment (excl. property)",
        roleTotals: "Role Total Bonus Percentages",
        roleNote: "Note: Each role's bonus percentage will be divided equally among all members in that role.",
        propertySection: "Property Owner Contribution",
        propertyOptional: "(Optional)",
        propertyNote: "Fill this section only if there is a property owner contributing land or property to the project.",
        propertyModel: "Property Model:",
        modelA: "Negotiated % (fixed share) — Property Equity/Profit Pool (%) enabled; Property Value is informational.",
        modelB: "Valued contribution (cash-equivalent) — Use Property Value in base pool; hide Property Equity/Profit Pool (%).",
        modelBInfo: "Property value participates in base pool like cash. No extra property pools.",
        propValue: "Property Value (€)",
        propName: "Property Owner Name",
        propEquityPool: "Property Equity Pool (%)",
        propProfitPool: "Property Profit Pool (%)",
        propWeight: "Property Weight (×)",
        propMin: "Property Profit Min (%)",
        propMax: "Property Profit Max (%)",
        projectCost: "Project Cost (€)",
        salePrice: "Project Sale Price (€)",
        addInvestor: "Add Investor",
        calculate: "Calculate",
        newCalc: "New Calculation",
        results: "Results",
        exportPdf: "Export as PDF",
        exportCsv: "Export as CSV",
        summary: "Share Budget Breakdown",
        basePool: "Base Pool:",
        rolePools: "Role Pools:",
        propertyPool: "Property Pool:",
        total: "Total:",
        totalsRow: "Totals",
        thName: "Name",
        thRole: "Role",
        thPayment: "Payment (€)",
        thBaseShare: "Base Share (%)",
        thRoleBonus: "Role Bonus (%)",
        thPropShare: "Property Share (%)",
        thEquityShare: "Equity Share (%)",
        thProfitShare: "Profit Share (%)",
        thFinalValue: "Final Share Value (€)",
        thProfitValue: "Profit Value (€)",
        projectCostLbl: "Project Cost:",
        salePriceLbl: "Project Sale Price:",
        totalProfitLbl: "Total Profit:",
        cashInvestLbl: "Cash Investment (excl. property):",
        propertyContribLbl: "Property Contribution:",
        propertyEquityLbl: "Property Equity Pool:",
        propertyProfitLbl: "Property Profit Pool:",
        devBonusLabel: "Total Developer Bonus (%)",
        constBonusLabel: "Total Constructor Bonus (%)",
        invBonusLabel: "Total Investor Bonus (%)",
        warnOverBudget: "Note: Total must equal 100%. Adjust highlighted fields to fix.",
        errShareExceeded: "Share budget exceeds 100%. Reduce role/property percentages.",
        warnNoCashBase: "No cash contributors; base pool cannot be distributed.",
        footerPrefix: "Services by",
        // Tooltips
        ttPerDeveloperTitle: "Per-developer bonus",
        ttPerDeveloperBody: "Total Developer Bonus ÷ developer count.",
        ttPerConstructorTitle: "Per-constructor bonus",
        ttPerConstructorBody: "Total Constructor Bonus ÷ constructor count.",
        ttPerInvestorTitle: "Per-investor bonus",
        ttPerInvestorBody: "Total Investor Bonus ÷ investor count.",
        ttRolePools: "Role bonuses are a fixed % budget split equally among members of each role.",
        ttPropEquityPool: "Fixed % allocated to the property owner (Model A).",
        ttPropProfitPool: "Additional % from profits only if the project is profitable (Model A).",
        ttPropWeight: "Scales the property value used in the base pool (Model B). 1.00 = face value.",
        ttPropMin: "Optional lower bound for property owner profit share (Model B).",
        ttPropMax: "Optional upper bound for property owner profit share (Model B).",
        // Additional labels
        nameLabel: "Name:",
        roleLabel: "Role:",
        paymentLabel: "Payment (€):",
        budgetBarLegend: "Base / Role / Property",
        currentSplit: "Current split:",
        perDeveloper: "per developer",
        perConstructor: "per constructor",
        perInvestor: "per investor",
        developers: "developers",
        constructors: "constructors",
        investors: "investors",
        closeToLimit: "close to limit",
        devBonusLbl: "Developer Bonus:",
        constBonusLbl: "Constructor Bonus:",
        invBonusLbl: "Investor Bonus:",
        ttPropEquityPoolDesc: "Equity share from property contribution (Model A only).",
        ttPropProfitPoolDesc: "Additional share from project profits (Model A only).",
        // Role dropdown options
        selectRole: "Select Role",
        roleDeveloper: "Developer",
        roleConstructor: "Constructor",
        roleInvestor: "Investor",
        rolePropertyOwner: "Property Owner",
        sum: "sum"
    },
    ar: {
        title: "حاسبة توزيع الاستثمار",
        currentDist: "توزيع الأدوار الحالي",
        dev: "المطوّرون",
        const: "المنفّذون",
        inv: "المستثمرون",
        liveEachGets: "يحصل كل واحد على",
        bonus: "مكافأة",
        person: "شخص(أشخاص)",
        cashInvest: "الاستثمار النقدي (باستثناء العقار)",
        roleTotals: "نسب المكافآت الإجمالية للأدوار",
        roleNote: "ملاحظة: يتم تقسيم نسبة مكافأة كل دور بالتساوي بين جميع الأعضاء في ذلك الدور.",
        propertySection: "مساهمة مالك العقار",
        propertyOptional: "(اختياري)",
        propertyNote: "املأ هذا القسم فقط إذا كان هناك مالك عقار يساهم بأرض أو عقار في المشروع.",
        propertyModel: "نموذج احتساب العقار:",
        modelA: "نسبة متفق عليها (حصة ثابتة) — تمكين نسب العقار للملكية/الأرباح (%). قيمة العقار للعرض فقط.",
        modelB: "مساهمة مُقوَّمة بالقيمة — تُستخدم قيمة العقار ضمن حوض الأساس؛ تُخفى نسب العقار للملكية/الأرباح (%).",
        modelBInfo: "قيمة العقار تُعامل كالنقد ضمن حوض الأساس. لا توجد نسب إضافية للعقار.",
        propValue: "قيمة العقار (€)",
        propName: "اسم مالك العقار",
        propEquityPool: "نسبة العقار من الملكية (%)",
        propProfitPool: "نسبة العقار من الأرباح (%)",
        propWeight: "وزن العقار (×)",
        propMin: "حد أدنى لربح المالك (%)",
        propMax: "حد أقصى لربح المالك (%)",
        projectCost: "تكلفة المشروع (€)",
        salePrice: "سعر بيع المشروع (€)",
        addInvestor: "إضافة مستثمر",
        calculate: "احسب",
        newCalc: "عملية جديدة",
        results: "النتائج",
        exportPdf: "تصدير إلى PDF",
        exportCsv: "تصدير إلى CSV",
        summary: "تفصيل ميزانية الأسهم",
        basePool: "مجموعة الأساس:",
        rolePools: "مجموعات الأدوار:",
        propertyPool: "مجموعة العقار:",
        total: "الإجمالي:",
        totalsRow: "الإجماليات",
        thName: "الاسم",
        thRole: "الدور",
        thPayment: "الدفع (€)",
        thBaseShare: "حصة الأساس (%)",
        thRoleBonus: "مكافأة الدور (%)",
        thPropShare: "حصة العقار (%)",
        thEquityShare: "حصة الملكية (%)",
        thProfitShare: "حصة الأرباح (%)",
        thFinalValue: "قيمة الحصة النهائية (€)",
        thProfitValue: "قيمة الربح (€)",
        projectCostLbl: "تكلفة المشروع:",
        salePriceLbl: "سعر بيع المشروع:",
        totalProfitLbl: "إجمالي الربح:",
        cashInvestLbl: "الاستثمار النقدي (باستثناء العقار):",
        propertyContribLbl: "مساهمة العقار:",
        propertyEquityLbl: "نسبة العقار من الملكية:",
        propertyProfitLbl: "نسبة العقار من الأرباح:",
        devBonusLabel: "إجمالي مكافأة المطوّرين (%)",
        constBonusLabel: "إجمالي مكافأة المنفّذين (%)",
        invBonusLabel: "إجمالي مكافأة المستثمرين (%)",
        warnOverBudget: "ملاحظة: يجب أن يكون الإجمالي 100%. رجاءً عدّل القيم المظلّلة.",
        errShareExceeded: "ميزانية النِسَب تجاوزت 100%. خفّض نسب الأدوار/العقار.",
        warnNoCashBase: "لا يوجد مساهمون نقديّون؛ لا يمكن توزيع مجموعة الأساس.",
        footerPrefix: "خدمات من",
        // Tooltips
        ttPerDeveloperTitle: "مكافأة كل مطوّر",
        ttPerDeveloperBody: "إجمالي مكافأة المطوّرين ÷ عدد المطوّرين.",
        ttPerConstructorTitle: "مكافأة كل منفّذ",
        ttPerConstructorBody: "إجمالي مكافأة المنفّذين ÷ عدد المنفّذين.",
        ttPerInvestorTitle: "مكافأة كل مستثمر",
        ttPerInvestorBody: "إجمالي مكافأة المستثمرين ÷ عدد المستثمرين.",
        ttRolePools: "مكافآت الأدوار هي نسبة ثابتة تُقسَّم بالتساوي على أعضاء كل دور.",
        ttPropEquityPool: "نسبة ثابتة تُخصّص لمالك العقار (النموذج أ).",
        ttPropProfitPool: "نسبة إضافية من الأرباح فقط إذا كان المشروع رابحًا (النموذج أ).",
        ttPropWeight: "يضاعف/يخفّض قيمة العقار المُستخدمة في حوض الأساس (النموذج ب). 1.00 = القيمة الاسمية.",
        ttPropMin: "حد أدنى اختياري لنسبة ربح مالك العقار (النموذج ب).",
        ttPropMax: "حد أقصى اختياري لنسبة ربح مالك العقار (النموذج ب).",
        // Additional labels
        nameLabel: "الاسم:",
        roleLabel: "الدور:",
        paymentLabel: "الدفع (€):",
        budgetBarLegend: "الأساس / الدور / العقار",
        currentSplit: "التقسيم الحالي:",
        perDeveloper: "لكل مطوّر",
        perConstructor: "لكل منفّذ",
        perInvestor: "لكل مستثمر",
        developers: "مطوّرين",
        constructors: "منفّذين",
        investors: "مستثمرين",
        closeToLimit: "قريب من الحد",
        devBonusLbl: "مكافأة المطوّرين:",
        constBonusLbl: "مكافأة المنفّذين:",
        invBonusLbl: "مكافأة المستثمرين:",
        ttPropEquityPoolDesc: "حصة الملكية من مساهمة العقار (النموذج أ فقط).",
        ttPropProfitPoolDesc: "حصة إضافية من أرباح المشروع (النموذج أ فقط).",
        // Role dropdown options
        selectRole: "اختر الدور",
        roleDeveloper: "مطوّر",
        roleConstructor: "منفّذ",
        roleInvestor: "مستثمر",
        rolePropertyOwner: "مالك العقار",
        sum: "المجموع"
    }
};

let currentLang = 'en';

// Helper function to translate role names
function translateRole(role) {
    if (!role) return role;
    const dict = (window.i18n && window.i18n[currentLang]) || {};
    const roleMap = {
        'Developer': dict.roleDeveloper || 'Developer',
        'Constructor': dict.roleConstructor || 'Constructor',
        'Investor': dict.roleInvestor || 'Investor',
        'Property Owner': dict.rolePropertyOwner || 'Property Owner'
    };
    return roleMap[role] || role;
}

// Number formatting helpers (optional, for display cells only)
function fmtCurrency(v) {
    try {
        return new Intl.NumberFormat(currentLang === 'ar' ? 'ar' : undefined, {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 2
        }).format(Number(v || 0));
    } catch {
        return Number(v || 0).toFixed(2);
    }
}

function fmtPercent(v) {
    try {
        return new Intl.NumberFormat(currentLang === 'ar' ? 'ar' : undefined, {
            style: 'percent',
            maximumFractionDigits: 2
        }).format(Number(v || 0) / 100);
    } catch {
        return Number(v || 0).toFixed(2) + '%';
    }
}

// Generic translation applier using data-i18n attributes
function applyTranslations(lang) {
    currentLang = lang;
    const dict = (window.i18n && window.i18n[lang]) || {};
    
    // Set document direction
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    
    // Set font family for Arabic
    if (lang === 'ar') {
        document.body.style.fontFamily = "'Cairo', 'Arial', sans-serif";
    } else {
        document.body.style.fontFamily = "'Arial', sans-serif";
    }
    
    // Text nodes with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            // For labels, replace only the first text node to preserve help icons
            if (el.tagName === 'LABEL') {
                // Find the first text node (which contains the form label from Jinja)
                const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
                const firstTextNode = walker.nextNode();
                if (firstTextNode) {
                    firstTextNode.textContent = dict[key];
                } else {
                    // If no text node found, prepend the translation before first element
                    const firstElement = el.querySelector('span, div, input, select');
                    if (firstElement) {
                        el.insertBefore(document.createTextNode(dict[key] + ' '), firstElement);
                    } else {
                        // Fallback: replace all text content
                        el.textContent = dict[key];
                    }
                }
            } else {
                el.textContent = dict[key];
            }
        }
    });
    
    // Titles for tooltips (data-i18n-title)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dict[key]) {
            el.setAttribute('title', dict[key]);
        }
    });
    
    // Tooltip inner text blocks (data-i18n on .tooltip)
    document.querySelectorAll('.tooltip[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });
    
    // Update "Current split" text dynamically
    document.querySelectorAll('.current-split').forEach(el => {
        const prefix = el.getAttribute('data-i18n-prefix');
        const per = el.getAttribute('data-i18n-per');
        const plural = el.getAttribute('data-i18n-plural');
        const textSpan = el.querySelector('.current-split-text');
        if (textSpan && prefix && per && plural) {
            // Extract the percentage and count from the existing text
            const match = textSpan.textContent.match(/([\d.]+)%\s+per\s+\w+\s+\((\d+)\s+\w+\)/);
            if (match) {
                const pct = match[1];
                const count = match[2];
                textSpan.textContent = `${dict[prefix] || 'Current split:'} ${pct}% ${dict[per] || 'per'} (${count} ${dict[plural] || ''})`;
            }
        }
    });
    
    // Update select option elements with data-i18n
    document.querySelectorAll('option[data-i18n]').forEach(option => {
        const key = option.getAttribute('data-i18n');
        if (dict[key]) {
            option.textContent = dict[key];
        }
    });
    
    // Footer brand text
    const footer = document.getElementById('app-footer');
    if (footer) {
        const prefix = dict.footerPrefix || (lang === 'ar' ? 'خدمات من' : 'Services by');
        footer.innerHTML = `${prefix} <a href="https://suar.services" target="_blank" rel="noopener">https://suar.services</a>`;
    }
    
    // Update page title
    const titleKey = document.querySelector('#page-title')?.getAttribute('data-i18n');
    if (titleKey && dict[titleKey]) {
        document.title = dict[titleKey];
    }
    
    // Translate role names in results table (both server-rendered and dynamically created)
    document.querySelectorAll('table tbody td.role-cell, table tbody td:nth-child(2)').forEach(td => {
        const roleAttr = td.getAttribute('data-role');
        const roleText = roleAttr || td.textContent.trim();
        if (roleText) {
            const translated = translateRole(roleText);
            if (translated !== roleText) {
                td.textContent = translated;
            }
        }
    });
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('language-select');
    if (sel) {
        sel.addEventListener('change', e => {
            currentLang = e.target.value || 'en';
            applyTranslations(currentLang);
            // Trigger live recalculation to update dynamic content if needed
            if (typeof updateResultsLive === 'function') {
                updateResultsLive();
            }
        });
    }
    // Set default language after DOM is ready
    setTimeout(() => {
        applyTranslations(currentLang);
    }, 100);
});
