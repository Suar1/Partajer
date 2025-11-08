"""Pydantic models for the investment calculator."""
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field


class Investor(BaseModel):
    """Represents an investor in the project."""
    name: str
    role: Literal["Developer", "Constructor", "Investor", "Property Owner"]
    payment: Decimal = Field(default=Decimal("0"), ge=0)
    property_profit_share: Decimal = Field(default=Decimal("0"), ge=0)


class RoleBonuses(BaseModel):
    """Role bonus percentages."""
    developer: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    constructor: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    investor: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    property_base_share: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    property_profit_share: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class Project(BaseModel):
    """Project details."""
    project_cost: Decimal = Field(ge=0)
    sale_price: Decimal = Field(ge=0)
    property_value: Decimal = Field(default=Decimal("0"), ge=0)
    property_owner: str = ""
    property_profit_share: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class Result(BaseModel):
    """Calculation result for a single investor."""
    name: str
    role: str
    payment: Decimal
    share: Decimal  # Base share percentage
    bonus: Decimal  # Role bonus percentage
    profit_bonus: Decimal  # Property share percentage
    total_share: Decimal  # Equity percentage (for sale value)
    profit_share: Decimal = Field(default=None)  # Profit percentage (for profit distribution, Model B only)

