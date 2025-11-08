"""JSON API routes for live calculation."""
from flask import Blueprint, request, jsonify
from decimal import Decimal

from app.services.calculator import compute_distribution, parse_investors
from app.services.models import RoleBonuses, Project, Investor

api = Blueprint('api', __name__)


def D(x):
    """Safe Decimal conversion."""
    return Decimal(str(x or 0))


@api.post("/api/calculate")
def api_calculate():
    """Calculate investment shares via JSON API."""
    data = request.get_json(force=True, silent=True) or {}
    
    try:
        # Extract project inputs
        project_cost = D(data.get("project_cost"))
        sale_price = D(data.get("sale_price"))
        developer_bonus = D(data.get("developer_bonus"))
        constructor_bonus = D(data.get("constructor_bonus"))
        investor_bonus = D(data.get("investor_bonus"))
        property_value = D(data.get("property_value"))
        property_owner = (data.get("property_owner") or "").strip()
        property_base_share = D(data.get("property_base_share"))
        property_profit_share = D(data.get("property_profit_share"))
        property_model = (data.get("property_model") or "A").upper()
        if property_model not in ["A", "B"]:
            property_model = "A"
        
        # In Model B, property pools must be 0
        property_weight = None
        property_profit_min_pct = None
        property_profit_max_pct = None
        
        if property_model == "B":
            property_base_share = Decimal("0")
            property_profit_share = Decimal("0")
            property_weight = D(data.get("property_weight") or 1.0)
            if data.get("property_profit_min_pct") is not None and data.get("property_profit_min_pct") != "":
                property_profit_min_pct = D(data.get("property_profit_min_pct"))
            if data.get("property_profit_max_pct") is not None and data.get("property_profit_max_pct") != "":
                property_profit_max_pct = D(data.get("property_profit_max_pct"))
        
        # Parse participants (regular investors, excluding property owner)
        investors = []
        for p in data.get("participants", []):
            # Skip property owner from participants list (handled separately)
            if p.get("is_property_owner", False):
                continue
            name = (p.get("name") or "").strip()
            role = p.get("role")
            payment = D(p.get("payment") or 0)
            if name and role:
                investors.append(Investor(
                    name=name,
                    role=role,
                    payment=payment
                ))
        
        # Create project and role bonuses models
        project = Project(
            project_cost=project_cost,
            sale_price=sale_price,
            property_value=property_value,
            property_owner=property_owner,
            property_profit_share=property_profit_share
        )
        
        role_bonuses = RoleBonuses(
            developer=developer_bonus,
            constructor=constructor_bonus,
            investor=investor_bonus,
            property_base_share=property_base_share,
            property_profit_share=property_profit_share
        )
        
        # Compute distribution
        results, meta, errors, warnings = compute_distribution(
            investors, role_bonuses, project, property_model,
            property_weight, property_profit_min_pct, property_profit_max_pct
        )
        
        # Format results for JSON
        results_json = []
        for r in results:
            # Use profit_share if available (Model B), otherwise use total_share (Model A)
            profit_pct = r.profit_share if r.profit_share is not None else r.total_share
            results_json.append({
                "name": r.name,
                "role": r.role,
                "payment": str(r.payment),
                "share_base_pct": str(r.share),
                "share_role_pct": str(r.bonus),
                "share_property_pct": str(r.profit_bonus),
                "total_equity_pct": str(r.total_share),  # Equity percentage
                "total_profit_pct": str(profit_pct),  # Profit percentage
                "total_share_pct": str(r.total_share),  # Legacy field (equity)
                "final_value": str((r.total_share / Decimal("100")) * project.sale_price),
                "profit_value": str((profit_pct / Decimal("100")) * meta.get("project_profit", Decimal("0")))
            })
        
        # Build pools detail
        pools_detail = {
            "base_pool": str(meta.get("base_pool", Decimal("0"))),
            "role_pool": str(meta.get("role_pool", Decimal("0"))),
            "property_pool": str(meta.get("property_pool", Decimal("0"))),
            "dev": str(meta.get("developer_bonus", Decimal("0"))),
            "const": str(meta.get("constructor_bonus", Decimal("0"))),
            "inv": str(meta.get("investor_bonus", Decimal("0"))),
            "prop_base": str(meta.get("property_base_share", Decimal("0"))),
            "prop_profit_effective": str(meta.get("property_profit_share_effective", Decimal("0")))
        }
        
        # Build totals
        totals_json = {
            "cash_total": str(meta.get("cash_total", Decimal("0"))),
            "project_cost": str(project_cost),
            "sale_price": str(sale_price),
            "profit": str(meta.get("project_profit", Decimal("0"))),
            "total_pct_sum": str(meta.get("total_pct_sum", Decimal("0")))
        }
        
        payload = {
            "results": results_json,
            "totals": totals_json,
            "pools": pools_detail,
            "banners": {
                "errors": errors,
                "warnings": warnings
            }
        }
        
        return jsonify(payload), 200
        
    except Exception as e:
        return jsonify({"error": "calculation_failed", "detail": str(e)}), 400

