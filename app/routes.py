"""Routes for the investment calculator."""
from flask import Blueprint, render_template, request
from decimal import Decimal

from app.forms import MainForm
from app.services.calculator import parse_investors, compute_distribution, compute_role_counts
from app.services.models import RoleBonuses, Project

bp = Blueprint('main', __name__)


@bp.route("/", methods=["GET", "POST"])
def index():
    """Main calculator page."""
    form = MainForm()
    errors = []
    warnings = []
    info = None
    results = []
    meta = {}
    role_counts = {'developer': 0, 'constructor': 0, 'investor': 0}
    role_bonuses_per_person = {'developer': 0, 'constructor': 0, 'investor': 0}
    
    if request.method == 'POST':
        form = MainForm()
        
        # Always preserve form data, even if validation fails
        if not form.validate():
            # Populate form with submitted data to preserve inputs
            form = MainForm(formdata=request.form)
        
        if form.validate():
            try:
                # Parse form data
                project = Project(
                    project_cost=Decimal(str(form.project_cost.data)),
                    sale_price=Decimal(str(form.sale_price.data)),
                    property_value=Decimal(str(form.property_value.data or 0)),
                    property_owner=form.property_owner.data or "",
                    property_profit_share=Decimal(str(form.property_profit_share.data or 0))
                )
                
                role_bonuses = RoleBonuses(
                    developer=Decimal(str(form.developer_bonus.data)),
                    constructor=Decimal(str(form.constructor_bonus.data)),
                    investor=Decimal(str(form.investor_bonus.data)),
                    property_base_share=Decimal(str(form.property_share.data or 0)),
                    property_profit_share=Decimal(str(form.property_profit_share.data or 0))
                )
                
                # Parse investors
                investors = parse_investors(request.form)
                
                # Get property model (default to "A")
                property_model = (request.form.get('property_model') or 'A').upper()
                if property_model not in ['A', 'B']:
                    property_model = 'A'
                
                # Get Model B parameters
                property_weight = None
                property_profit_min_pct = None
                property_profit_max_pct = None
                
                if property_model == 'B':
                    property_weight = Decimal(str(request.form.get('property_weight') or 1.0))
                    if request.form.get('property_profit_min_pct'):
                        property_profit_min_pct = Decimal(str(request.form.get('property_profit_min_pct')))
                    if request.form.get('property_profit_max_pct'):
                        property_profit_max_pct = Decimal(str(request.form.get('property_profit_max_pct')))
                
                # Compute distribution (includes validation)
                results, meta, calc_errors, calc_warnings = compute_distribution(
                    investors, role_bonuses, project, property_model,
                    property_weight, property_profit_min_pct, property_profit_max_pct
                )
                
                errors.extend(calc_errors)
                warnings.extend(calc_warnings)
                
                # Check investment vs project cost (only if no blocking errors)
                if not errors and meta:
                    cash_total = meta.get('cash_total', Decimal("0"))
                    if cash_total < project.project_cost:
                        missing = project.project_cost - cash_total
                        warnings.append(
                            f"Cash investments (€{cash_total:.2f}) are less than "
                            f"the project cost (€{project.project_cost:.2f}). "
                            f"Need €{missing:.2f} more."
                        )
                
                # Compute role counts for display (from investors only, property owner added in compute_distribution)
                role_counts = compute_role_counts(investors)
                if project.property_owner and project.property_value > 0:
                    role_counts['property_owner'] = 1
                
                # Calculate per-person bonuses for display
                if role_counts['developer'] > 0:
                    role_bonuses_per_person['developer'] = float(
                        role_bonuses.developer / Decimal(str(role_counts['developer']))
                    )
                if role_counts['constructor'] > 0:
                    role_bonuses_per_person['constructor'] = float(
                        role_bonuses.constructor / Decimal(str(role_counts['constructor']))
                    )
                if role_counts['investor'] > 0:
                    role_bonuses_per_person['investor'] = float(
                        role_bonuses.investor / Decimal(str(role_counts['investor']))
                    )
                    
            except ValueError as e:
                errors.append(str(e))
            except Exception as e:
                errors.append(f"An unexpected error occurred: {str(e)}")
        else:
            errors.append("Please correct the form errors.")
    
    # Convert errors/warnings to single strings for template compatibility
    error = errors[0] if errors else None
    warning = warnings[0] if warnings else None
    
    return render_template(
        'index.html',
        form=form,
        results=results,
        meta=meta,
        error=error,
        warning=warning,
        info=info,
        role_counts=role_counts,
        role_bonuses_per_person=role_bonuses_per_person
    )


@bp.route("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}, 200

