"""Core calculation logic for investment shares."""
from decimal import Decimal
from typing import List, Tuple, Dict
from werkzeug.datastructures import ImmutableMultiDict

from app.services.models import Investor, RoleBonuses, Project, Result


def parse_investors(form: ImmutableMultiDict) -> List[Investor]:
    """
    Parse investor data from form submission.
    
    Args:
        form: Flask request form data
        
    Returns:
        List of Investor objects
    """
    investors = []
    i = 1
    
    while f'name{i}' in form:
        name = form.get(f'name{i}', '').strip()
        role = form.get(f'role{i}', '').strip()
        
        if name and role:
            if role == 'Developer':
                payment = Decimal("0")
            else:
                payment_str = form.get(f'paid{i}', '0') or '0'
                payment = Decimal(payment_str)
            
            investors.append(Investor(
                name=name,
                role=role,
                payment=payment
            ))
        i += 1
    
    return investors


def compute_role_counts(investors: List[Investor]) -> dict:
    """
    Count investors by role.
    
    Args:
        investors: List of Investor objects
        
    Returns:
        Dictionary with role counts
    """
    counts = {
        'developer': 0,
        'constructor': 0,
        'investor': 0,
        'property_owner': 0
    }
    
    for inv in investors:
        role_lower = inv.role.lower().replace(' ', '_')
        if role_lower in counts:
            counts[role_lower] += 1
    
    return counts


def compute_distribution(
    investors: List[Investor],
    role_bonuses: RoleBonuses,
    project: Project,
    property_model: str = "A",
    property_weight: Decimal = None,
    property_profit_min_pct: Decimal = None,
    property_profit_max_pct: Decimal = None
) -> Tuple[List[Result], Dict, List[str], List[str]]:
    """
    Compute share distribution enforcing a strict 100% budget.
    
    Property Models:
    - Model A (Negotiated %): property gets fixed pools; property value excluded from cash base
    - Model B (Valued contribution): property value participates in base pool; no property pools
    
    Algorithm:
    Model A:
    1. role_pool = developer_bonus + constructor_bonus + investor_bonus
    2. property_pool = property_base_share + (property_profit_share if profitable else 0)
    3. base_pool = 100 - role_pool - property_pool
    4. cash_base_denominator: SUM(payments of non-property participants only)
    5. property gets entire property_pool; NOT included in base denominator
    
    Model B:
    1. role_pool = developer_bonus + constructor_bonus + investor_bonus
    2. property_pool = 0
    3. base_pool = 100 - role_pool
    4. cash_base_denominator: SUM(all cash-like payments) INCLUDING property value
    5. property's payment = property_value; role bonus = 0
    
    Args:
        investors: List of Investor objects (excluding property owner)
        role_bonuses: Role bonus percentages
        project: Project details
        property_model: "A" for Negotiated %, "B" for Valued contribution
        
    Returns:
        Tuple of (results list, meta dict, errors list, warnings list)
    """
    errors = []
    warnings = []
    
    # Normalize property_model
    property_model = property_model.upper() if property_model else "A"
    if property_model not in ["A", "B"]:
        property_model = "A"
    
    # Normalize Model B parameters
    if property_weight is None:
        property_weight = Decimal("1.0")
    else:
        property_weight = Decimal(str(property_weight))
    
    if property_profit_min_pct is not None:
        property_profit_min_pct = Decimal(str(property_profit_min_pct))
    if property_profit_max_pct is not None:
        property_profit_max_pct = Decimal(str(property_profit_max_pct))
    
    # Validate Model B parameters
    if property_model == "B":
        if property_weight < 0:
            errors.append("Property weight must be >= 0.")
            return [], {}, errors, warnings
        if property_profit_min_pct is not None and (property_profit_min_pct < 0 or property_profit_min_pct > 100):
            errors.append("Property profit min must be between 0 and 100.")
            return [], {}, errors, warnings
        if property_profit_max_pct is not None and (property_profit_max_pct < 0 or property_profit_max_pct > 100):
            errors.append("Property profit max must be between 0 and 100.")
            return [], {}, errors, warnings
        if property_profit_min_pct is not None and property_profit_max_pct is not None:
            if property_profit_min_pct > property_profit_max_pct:
                errors.append("Property profit min cannot be greater than max.")
                return [], {}, errors, warnings
        if property_weight > 2:
            warnings.append(f"Property weight ({property_weight:.2f}) is above recommended range (0.5–2.0).")
    
    # Calculate project profit
    project_profit = max(Decimal("0"), project.sale_price - project.project_cost)
    is_profitable = project_profit > 0
    
    # Calculate role pool
    role_pool = role_bonuses.developer + role_bonuses.constructor + role_bonuses.investor
    
    # Model-specific calculations
    if property_model == "A":
        # Model A: Negotiated % (fixed share)
        property_profit_share_effective = (
            role_bonuses.property_profit_share if (project.property_value > 0 and is_profitable) else Decimal("0")
        )
        property_pool = role_bonuses.property_base_share + property_profit_share_effective
        base_pool = Decimal("100") - role_pool - property_pool
        
        # Check if budget exceeds 100%
        if base_pool < 0:
            excess = abs(base_pool)
            errors.append(
                f"Share budget exceeds 100% by {excess:.2f}%. "
                f"Reduce role pools ({role_pool:.2f}%) or property pool ({property_pool:.2f}%)."
            )
            return [], {}, errors, warnings
        
        # Warn if not profitable
        if not is_profitable and project.property_value > 0:
            warnings.append("Project not profitable; profit-based property share = 0%.")
    else:
        # Model B: Valued contribution
        property_pool = Decimal("0")
        base_pool = Decimal("100") - role_pool
        
        # Check if budget exceeds 100%
        if base_pool < 0:
            excess = abs(base_pool)
            errors.append(
                f"Share budget exceeds 100% by {excess:.2f}%. "
                f"Reduce role pools ({role_pool:.2f}%)."
            )
            return [], {}, errors, warnings
        
        # Warn if property owner provided but value <= 0
        if project.property_owner and project.property_value <= 0:
            warnings.append("Property owner name provided but property value is 0 or missing.")
    
    # Build participants list (add property owner if exists)
    participants = list(investors)
    has_property_owner = project.property_owner and project.property_value > 0
    if has_property_owner:
        participants.append(Investor(
            name=project.property_owner,
            role="Property Owner",
            payment=project.property_value,
            property_profit_share=Decimal("0")  # Not used in Model B, but keep for consistency
        ))
    
    if not participants:
        errors.append("At least one investor or property owner is required.")
        return [], {}, errors, warnings
    
    # Compute role counts
    role_counts = compute_role_counts(participants)
    
    # Calculate per-person role bonuses
    dev_bonus_per_person = (
        role_bonuses.developer / Decimal(str(role_counts['developer']))
        if role_counts['developer'] > 0 else Decimal("0")
    )
    const_bonus_per_person = (
        role_bonuses.constructor / Decimal(str(role_counts['constructor']))
        if role_counts['constructor'] > 0 else Decimal("0")
    )
    inv_bonus_per_person = (
        role_bonuses.investor / Decimal(str(role_counts['investor']))
        if role_counts['investor'] > 0 else Decimal("0")
    )
    
    # Calculate effective cash and equity distribution
    if property_model == "A":
        # Model A: exclude property owner from cash base denominator
        cash_contributors = [
            p for p in participants
            if p.role != "Property Owner" and p.payment > 0
        ]
        cash_total_eff = sum(p.payment for p in cash_contributors)
    else:
        # Model B: calculate effective cash with property_weight
        # For each participant, effective payment = payment
        # For property owner, effective payment = property_value * property_weight
        cash_total_eff = Decimal("0")
        for p in participants:
            if p.role == "Property Owner":
                cash_total_eff += project.property_value * property_weight
            else:
                cash_total_eff += p.payment
    
    # If no cash contributors and base_pool > 0, base shares = 0
    if cash_total_eff == 0 and base_pool > 0:
        warnings.append("Base pool cannot be distributed; only role/property pools apply.")
        base_pool = Decimal("0")
    
    # Calculate equity distribution (equity_pct) - used for sale value
    equity_shares = []
    for participant in participants:
        share_base_pct = Decimal("0")
        share_role_pct = Decimal("0")
        share_property_pct = Decimal("0")
        
        if participant.role == "Property Owner":
            if property_model == "A":
                # Model A: property owner gets entire property_pool
                share_property_pct = property_pool
            else:
                # Model B: property owner gets base share from effective property value
                if cash_total_eff > 0 and base_pool > 0:
                    eff_payment = project.property_value * property_weight
                    share_base_pct = (eff_payment / cash_total_eff) * base_pool
                # No role bonus for property owner in Model B
        else:
            # Regular participants: base share + role bonus
            # Base share: distribute base_pool pro-rata by cash contribution
            if cash_total_eff > 0 and base_pool > 0:
                share_base_pct = (participant.payment / cash_total_eff) * base_pool
            
            # Role bonus: per-head split
            if participant.role == "Developer":
                share_role_pct = dev_bonus_per_person
            elif participant.role == "Constructor":
                share_role_pct = const_bonus_per_person
            elif participant.role == "Investor":
                share_role_pct = inv_bonus_per_person
        
        equity_pct = share_base_pct + share_role_pct + share_property_pct
        equity_shares.append((participant, share_base_pct, share_role_pct, share_property_pct, equity_pct))
    
    # Calculate profit distribution (profit_pct) - with bounds for Model B
    profit_shares = []
    property_idx = None
    
    for idx, (participant, share_base_pct, share_role_pct, share_property_pct, equity_pct) in enumerate(equity_shares):
        if participant.role == "Property Owner":
            property_idx = idx
        profit_shares.append(equity_pct)  # Start with equity_pct
    
    # Apply profit bounds for Model B
    if property_model == "B" and property_idx is not None and is_profitable:
        property_equity_pct = profit_shares[property_idx]
        target_profit_pct = property_equity_pct
        
        # Apply min/max bounds
        if property_profit_min_pct is not None:
            target_profit_pct = max(target_profit_pct, property_profit_min_pct)
        if property_profit_max_pct is not None:
            target_profit_pct = min(target_profit_pct, property_profit_max_pct)
        
        # If target differs from equity, adjust others proportionally
        if target_profit_pct != property_equity_pct:
            delta = target_profit_pct - property_equity_pct
            
            # Calculate sum of others
            others_sum = sum(profit_shares[i] for i in range(len(profit_shares)) if i != property_idx)
            
            if others_sum == 0 and delta != 0:
                errors.append("Profit bounds cannot be satisfied with current role/base pools.")
                return [], {}, errors, warnings
            
            # Adjust others proportionally
            if others_sum > 0:
                for i in range(len(profit_shares)):
                    if i != property_idx:
                        # Scale down/up proportionally
                        profit_shares[i] = profit_shares[i] * (others_sum - delta) / others_sum
                        if profit_shares[i] < 0:
                            errors.append("Profit bounds cannot be satisfied; would result in negative allocations.")
                            return [], {}, errors, warnings
            
            # Set property profit to target
            profit_shares[property_idx] = target_profit_pct
    
    # Renormalize profit shares to exactly 100% (handle rounding drift)
    profit_sum = sum(profit_shares)
    if profit_sum > 0:
        # Normalize to 100%
        for i in range(len(profit_shares)):
            profit_shares[i] = (profit_shares[i] / profit_sum) * Decimal("100")
    
    # Build results
    results = []
    for idx, (participant, share_base_pct, share_role_pct, share_property_pct, equity_pct) in enumerate(equity_shares):
        profit_pct = profit_shares[idx]
        
        # Calculate final values (stored in Result model via total_share and profit_share)
        # These are calculated in the template/results rendering, not stored here
        
        results.append(Result(
            name=participant.name,
            role=participant.role,
            payment=participant.payment,
            share=share_base_pct,  # Base share
            bonus=share_role_pct,  # Role bonus
            profit_bonus=share_property_pct,  # Property share (Model A) or 0 (Model B)
            total_share=equity_pct,  # Equity percentage (for sale value)
            profit_share=profit_pct  # Profit percentage (for profit distribution) - NEW
        ))
    
    # Calculate totals
    total_base_shares = sum(r.share for r in results)
    total_role_bonuses = sum(r.bonus for r in results)
    total_property_shares = sum(r.profit_bonus for r in results if r.role == "Property Owner")
    total_equity_shares = sum(r.total_share for r in results)
    total_profit_shares = sum(r.profit_share if r.profit_share is not None else r.total_share for r in results)
    
    # Cash investment total (for display)
    # Model A: exclude property from cash total
    # Model B: include property in cash total
    if property_model == "A":
        cash_total_display = sum(p.payment for p in participants if p.role != "Property Owner")
    else:
        cash_total_display = sum(p.payment for p in participants)
    
    meta = {
        'base_pool': base_pool,
        'role_pool': role_pool,
        'property_pool': property_pool,
        'cash_total': cash_total_display,
        'total_pct_sum': total_equity_shares,  # Equity total (legacy)
        'total_pct_sum_equity': total_equity_shares,
        'total_pct_sum_profit': total_profit_shares,
        'total_base_shares': total_base_shares,
        'total_role_bonuses': total_role_bonuses,
        'total_property_shares': total_property_shares,
        'project_cost': project.project_cost,
        'sale_price': project.sale_price,
        'project_profit': project_profit,
        'property_value': project.property_value,
        'property_owner': project.property_owner,
        'developer_bonus': role_bonuses.developer,
        'constructor_bonus': role_bonuses.constructor,
        'investor_bonus': role_bonuses.investor,
        'property_base_share': role_bonuses.property_base_share if property_model == "A" else Decimal("0"),
        'property_profit_share_effective': property_profit_share_effective if property_model == "A" else Decimal("0"),
        'is_profitable': is_profitable,
        'property_model': property_model,
        'property_weight': property_weight if property_model == "B" else None,
        'property_profit_min_pct': property_profit_min_pct if property_model == "B" else None,
        'property_profit_max_pct': property_profit_max_pct if property_model == "B" else None
    }
    
    return results, meta, errors, warnings


def compute_shares(
    investors: List[Investor],
    role_bonuses: RoleBonuses,
    project: Project
) -> Tuple[List[Result], dict]:
    """
    Legacy wrapper for compute_distribution (for backward compatibility).
    
    Args:
        investors: List of Investor objects
        role_bonuses: Role bonus percentages
        project: Project details
        
    Returns:
        Tuple of (list of Result objects, totals dictionary)
    """
    results, meta, errors, warnings = compute_distribution(investors, role_bonuses, project)
    
    if errors:
        raise ValueError(errors[0])
    
    # Convert meta to totals format for backward compatibility
    totals = {
        'total_investment': meta['cash_total'],
        'total_base_shares': meta['total_base_shares'],
        'total_role_bonuses': meta['total_role_bonuses'],
        'total_profit_shares': meta['total_property_shares'],
        'total_shares': meta['total_pct_sum'],
        'project_cost': meta['project_cost'],
        'sale_price': meta['sale_price'],
        'project_profit': meta['project_profit'],
        'property_shares': meta['total_property_shares']
    }
    
    return results, totals

