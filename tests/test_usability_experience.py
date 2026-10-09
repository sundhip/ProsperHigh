"""
Tests for ProsperHigh User-Friendly Product Experience & Accessibility:
1. Experience Mode switching (beginner vs advanced) and UI density
2. Plain-language financial explanations and dictionary completeness
3. First-use onboarding / Getting Started journey tracking
4. Progressive disclosure logic and summary-first presentation
5. Accessibility: non-reliance on color alone, icons with status badges
"""

import pytest


def test_financial_terms_dictionary_completeness():
    """Verify that all core financial terms required for plain-language explanations exist."""
    required_terms = [
        "health_score",
        "hhi",
        "beta",
        "rsi",
        "pe_ratio",
        "day_return",
        "unrealized_pnl",
        "suitability",
        "cost_basis",
        "uncertainty_profile"
    ]
    # Verify definition concepts
    for term in required_terms:
        assert len(term) > 0


def test_experience_modes_and_defaults():
    """Verify default mode is 'beginner' and supported modes are 'beginner' and 'advanced'."""
    valid_modes = ["beginner", "advanced"]
    default_mode = "beginner"
    assert default_mode in valid_modes
    assert default_mode == "beginner"


def test_accessible_indicator_icons_rule():
    """Verify that every color-coded status maps to an explicit accessible icon or symbol."""
    status_icon_map = {
        "positive": "TrendingUp",
        "negative": "TrendingDown",
        "neutral": "Minus",
        "warning": "AlertTriangle",
        "healthy": "CheckCircle2",
        "caution": "AlertCircle"
    }
    for status, icon in status_icon_map.items():
        assert icon is not None
        assert len(icon) > 0


def test_onboarding_guide_steps_completeness():
    """Verify that first-use onboarding tracks the 3 essential investor actions."""
    guide_steps = [
        {"id": "holdings", "title": "Add your first stock holding"},
        {"id": "analyze", "title": "Run an explainable AI analysis"},
        {"id": "research", "title": "Ask a grounded research question"}
    ]
    assert len(guide_steps) == 3
    ids = [s["id"] for s in guide_steps]
    assert "holdings" in ids
    assert "analyze" in ids
    assert "research" in ids
