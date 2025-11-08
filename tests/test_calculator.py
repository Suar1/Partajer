"""Tests for calculator service."""
import pytest
from decimal import Decimal

from app.services.calculator import (
    parse_investors,
    compute_role_counts,
    compute_shares
)
from app.services.models import Investor, RoleBonuses, Project
from werkzeug.datastructures import ImmutableMultiDict


class TestParseInvestors:
    """Test investor parsing."""
    
    def test_parse_single_investor(self):
        form = ImmutableMultiDict([
            ('name1', 'John Doe'),
            ('role1', 'Investor'),
            ('paid1', '1000')
        ])
        investors = parse_investors(form)
        assert len(investors) == 1
        assert investors[0].name == 'John Doe'
        assert investors[0].role == 'Investor'
        assert investors[0].payment == Decimal('1000')
    
    def test_parse_developer(self):
        form = ImmutableMultiDict([
            ('name1', 'Jane Dev'),
            ('role1', 'Developer'),
            ('paid1', '0')
        ])
        investors = parse_investors(form)
        assert len(investors) == 1
        assert investors[0].role == 'Developer'
        assert investors[0].payment == Decimal('0')
    
    def test_parse_multiple_investors(self):
        form = ImmutableMultiDict([
            ('name1', 'Investor 1'),
            ('role1', 'Investor'),
            ('paid1', '1000'),
            ('name2', 'Investor 2'),
            ('role2', 'Constructor'),
            ('paid2', '2000')
        ])
        investors = parse_investors(form)
        assert len(investors) == 2


class TestComputeRoleCounts:
    """Test role counting."""
    
    def test_count_roles(self):
        investors = [
            Investor(name='Dev1', role='Developer', payment=Decimal('0')),
            Investor(name='Dev2', role='Developer', payment=Decimal('0')),
            Investor(name='Const1', role='Constructor', payment=Decimal('1000')),
            Investor(name='Inv1', role='Investor', payment=Decimal('2000'))
        ]
        counts = compute_role_counts(investors)
        assert counts['developer'] == 2
        assert counts['constructor'] == 1
        assert counts['investor'] == 1


class TestComputeShares:
    """Test share computation."""
    
    def test_zero_investors_raises_error(self):
        investors = []
        role_bonuses = RoleBonuses(
            developer=Decimal('40'),
            constructor=Decimal('8'),
            investor=Decimal('40')
        )
        project = Project(
            project_cost=Decimal('10000'),
            sale_price=Decimal('15000')
        )
        
        with pytest.raises(ValueError, match="at least one investor"):
            compute_shares(investors, role_bonuses, project)
    
    def test_only_developers(self):
        investors = [
            Investor(name='Dev1', role='Developer', payment=Decimal('0')),
            Investor(name='Dev2', role='Developer', payment=Decimal('0'))
        ]
        role_bonuses = RoleBonuses(
            developer=Decimal('40'),
            constructor=Decimal('0'),
            investor=Decimal('0')
        )
        project = Project(
            project_cost=Decimal('10000'),
            sale_price=Decimal('15000')
        )
        
        results, totals = compute_shares(investors, role_bonuses, project)
        
        assert len(results) == 2
        # Each developer should get 20% (40% / 2)
        assert results[0].bonus == Decimal('20')
        assert results[1].bonus == Decimal('20')
        # Base shares should be 0 since no payments
        assert results[0].share == Decimal('0')
        assert results[1].share == Decimal('0')
    
    def test_property_owner_with_profit(self):
        investors = [
            Investor(name='Inv1', role='Investor', payment=Decimal('10000'))
        ]
        role_bonuses = RoleBonuses(
            developer=Decimal('0'),
            constructor=Decimal('0'),
            investor=Decimal('40'),
            property_base_share=Decimal('10'),
            property_profit_share=Decimal('5')
        )
        project = Project(
            project_cost=Decimal('10000'),
            sale_price=Decimal('20000'),  # Profit exists
            property_value=Decimal('5000'),
            property_owner='Property Owner',
            property_profit_share=Decimal('5')
        )
        
        results, totals = compute_shares(investors, role_bonuses, project)
        
        # Should have 2 results: investor + property owner
        assert len(results) == 2
        
        # Find property owner result
        prop_owner = next(r for r in results if r.role == 'Property Owner')
        assert prop_owner.bonus == Decimal('10')  # Base share
        assert prop_owner.profit_bonus == Decimal('5')  # Profit share
        assert prop_owner.total_share == Decimal('10') + Decimal('5') + (Decimal('5000') / Decimal('15000') * Decimal('100'))
    
    def test_investor_constructor_mix(self):
        investors = [
            Investor(name='Inv1', role='Investor', payment=Decimal('5000')),
            Investor(name='Const1', role='Constructor', payment=Decimal('3000'))
        ]
        role_bonuses = RoleBonuses(
            developer=Decimal('0'),
            constructor=Decimal('8'),
            investor=Decimal('40')
        )
        project = Project(
            project_cost=Decimal('10000'),
            sale_price=Decimal('15000')
        )
        
        results, totals = compute_shares(investors, role_bonuses, project)
        
        assert len(results) == 2
        
        # Investor should get base share proportional to payment
        inv_result = next(r for r in results if r.role == 'Investor')
        assert inv_result.share == (Decimal('5000') / Decimal('8000') * Decimal('100'))
        assert inv_result.bonus == Decimal('40')  # Full investor bonus (only 1 investor)
        
        # Constructor should get base share + constructor bonus
        const_result = next(r for r in results if r.role == 'Constructor')
        assert const_result.share == (Decimal('3000') / Decimal('8000') * Decimal('100'))
        assert const_result.bonus == Decimal('8')  # Full constructor bonus (only 1 constructor)
    
    def test_share_budget_validation_integration(self):
        """Test that share budget validation works with compute_shares."""
        investors = [
            Investor(name='Inv1', role='Investor', payment=Decimal('10000'))
        ]
        # This would exceed 100% if base shares + role bonuses > 100
        role_bonuses = RoleBonuses(
            developer=Decimal('0'),
            constructor=Decimal('0'),
            investor=Decimal('50')  # 50% bonus
        )
        project = Project(
            project_cost=Decimal('10000'),
            sale_price=Decimal('15000'),
            property_value=Decimal('10000'),
            property_owner='Owner',
            property_profit_share=Decimal('0')
        )
        
        # This should work - base share (50%) + investor bonus (50%) = 100%
        results, totals = compute_shares(investors, role_bonuses, project)
        assert totals['total_shares'] <= Decimal('100.01')  # Allow small rounding

