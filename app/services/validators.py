"""Validation functions for investment calculator."""
from decimal import Decimal
from typing import List, Tuple, Optional
from werkzeug.exceptions import BadRequest

from app.services.models import Investor, RoleBonuses, Project


def validate_positive_numbers(**kwargs) -> None:
    """Validate that all provided numbers are positive."""
    for key, value in kwargs.items():
        if value is not None and value < 0:
            raise ValueError(f"{key} must be non-negative")


def validate_profit(sale_price: Decimal, project_cost: Decimal) -> Tuple[bool, Optional[str]]:
    """
    Validate that sale price is greater than project cost.
    
    Returns:
        Tuple of (is_valid, warning_message)
    """
    if sale_price <= project_cost:
        return False, "Project not profitable; profit-based bonuses will be zero."
    return True, None


def validate_share_budget(
    investors: List[Investor],
    role_bonuses: RoleBonuses,
    project: Project,
    total_investment: Decimal
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate that total shares do not exceed 100%.
    
    Returns:
        Tuple of (is_valid, error_message, warning_message)
    """
    # Calculate base shares (excluding property owner - they get fixed property shares instead)
    # Calculate investment without property value for base share calculation
    investment_without_property = total_investment - (project.property_value if project.property_value > 0 else Decimal("0"))
    
    if investment_without_property > 0:
        # Only count base shares from regular investors, not property owner
        base_shares = sum((inv.payment / investment_without_property * Decimal("100")) for inv in investors)
    else:
        base_shares = Decimal("0")
    
    # Property owner gets fixed property base share (not calculated from investment)
    # This is separate from base shares calculation
    
    # Calculate role bonus pools
    role_pools = (
        role_bonuses.developer +
        role_bonuses.constructor +
        role_bonuses.investor
    )
    
    # Property shares (base + profit) - separate from investment-based base shares
    property_base_share = role_bonuses.property_base_share if project.property_value > 0 else Decimal("0")
    project_profit = max(Decimal("0"), project.sale_price - project.project_cost)
    property_profit_share = project.property_profit_share if (project.property_value > 0 and project_profit > 0) else Decimal("0")
    property_total_share = property_base_share + property_profit_share
    
    total_budget = base_shares + role_pools + property_total_share
    
    if total_budget > 100:
        return False, f"Total share budget ({total_budget:.2f}%) exceeds 100%. Please adjust.", None
    
    if 95 <= total_budget <= 100:
        return True, None, f"Total share budget is {total_budget:.2f}% (close to 100%)."
    
    return True, None, None


def guard_zero_division(total_investment: Decimal) -> Decimal:
    """Guard against division by zero when calculating base shares."""
    if total_investment == 0:
        return Decimal("0")
    return total_investment

