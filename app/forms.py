"""Flask-WTF forms for the investment calculator."""
from flask_wtf import FlaskForm
from wtforms import DecimalField, StringField
from wtforms.validators import DataRequired, Optional, NumberRange


class MainForm(FlaskForm):
    """Main form for investment calculator."""
    developer_bonus = DecimalField(
        'Total Developer Bonus (%)',
        validators=[DataRequired(), NumberRange(min=0, max=100)],
        default=40
    )
    constructor_bonus = DecimalField(
        'Total Constructor Bonus (%)',
        validators=[DataRequired(), NumberRange(min=0, max=100)],
        default=8
    )
    investor_bonus = DecimalField(
        'Total Investor Bonus (%)',
        validators=[DataRequired(), NumberRange(min=0, max=100)],
        default=40
    )
    project_cost = DecimalField(
        'Project Cost (€)',
        validators=[DataRequired(), NumberRange(min=0)]
    )
    sale_price = DecimalField(
        'Project Sale Price (€)',
        validators=[DataRequired(), NumberRange(min=0)]
    )
    property_value = DecimalField(
        'Property Value (€)',
        validators=[Optional(), NumberRange(min=0)],
        default=0
    )
    property_owner = StringField(
        'Property Owner Name',
        validators=[Optional()]
    )
    property_share = DecimalField(
        'Property Equity Pool (%)',
        validators=[Optional(), NumberRange(min=0, max=100)],
        default=10
    )
    property_profit_share = DecimalField(
        'Property Profit Pool (%)',
        validators=[Optional(), NumberRange(min=0, max=100)],
        default=5
    )
    property_model = StringField(
        'Property Model',
        validators=[Optional()],
        default='A'
    )
    property_weight = DecimalField(
        'Property Weight (×)',
        validators=[Optional(), NumberRange(min=0)],
        default=1.0
    )
    property_profit_min_pct = DecimalField(
        'Property Profit Min (%)',
        validators=[Optional(), NumberRange(min=0, max=100)],
        default=None
    )
    property_profit_max_pct = DecimalField(
        'Property Profit Max (%)',
        validators=[Optional(), NumberRange(min=0, max=100)],
        default=None
    )

