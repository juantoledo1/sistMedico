"""Tests for security utilities — password validation + generation."""

import pytest
from app.core.security import (
    validate_password_strength,
    generate_random_password,
    hash_password,
    verify_password,
)


class TestValidatePasswordStrength:
    """validate_password_strength(password) -> (bool, str)"""

    def test_valid_password(self):
        ok, msg = validate_password_strength("Abc12345")
        assert ok is True
        assert msg == "Contraseña segura"

    def test_too_short(self):
        ok, msg = validate_password_strength("Ab1c")
        assert ok is False
        assert "8" in msg

    def test_no_uppercase(self):
        ok, msg = validate_password_strength("abcdef1g")
        assert ok is False
        assert "mayúscula" in msg

    def test_no_lowercase(self):
        ok, msg = validate_password_strength("ABCDEF1G")
        assert ok is False
        assert "minúscula" in msg

    def test_no_digit(self):
        ok, msg = validate_password_strength("Abcdefgh")
        assert ok is False
        assert "número" in msg

    @pytest.mark.parametrize("pwd", [
        "aA1",           # too short
        "12345678",      # no upper/lower
        "abcdefgh",      # no upper/digit
        "ABCDEFGH",      # no lower/digit
        "Abcdefg1",      # boundary: exactly 8, should pass
    ])
    def test_boundary_cases(self, pwd):
        ok, _ = validate_password_strength(pwd)
        if len(pwd) >= 8 and any(c.isupper() for c in pwd) \
           and any(c.islower() for c in pwd) and any(c.isdigit() for c in pwd):
            assert ok is True
        else:
            assert ok is False


class TestGenerateRandomPassword:
    """generate_random_password(length=8) -> str"""

    def test_default_length(self):
        pwd = generate_random_password()
        assert len(pwd) == 8

    def test_custom_length(self):
        pwd = generate_random_password(12)
        assert len(pwd) == 12

    def test_contains_required_chars(self):
        for _ in range(20):
            pwd = generate_random_password()
            assert any(c.isupper() for c in pwd), f"No uppercase in {pwd}"
            assert any(c.islower() for c in pwd), f"No lowercase in {pwd}"
            assert any(c.isdigit() for c in pwd), f"No digit in {pwd}"

    def test_excludes_ambiguous_chars(self):
        """Should exclude I, O, l, o, 0, 1 from generated passwords."""
        for _ in range(50):
            pwd = generate_random_password(16)
            assert "I" not in pwd, f"Found I in {pwd}"
            assert "O" not in pwd, f"Found O in {pwd}"
            assert "l" not in pwd, f"Found l in {pwd}"
            assert "o" not in pwd, f"Found o in {pwd}"
            assert "0" not in pwd, f"Found 0 in {pwd}"
            assert "1" not in pwd, f"Found 1 in {pwd}"

    def test_different_each_time(self):
        passwords = {generate_random_password() for _ in range(100)}
        assert len(passwords) > 90, "Too many collisions in random passwords"


class TestHashVerifyPassword:
    """hash_password + verify_password roundtrip"""

    def test_roundtrip(self):
        original = "MySecretPass123"
        hashed = hash_password(original)
        assert verify_password(original, hashed) is True

    def test_wrong_password_fails(self):
        hashed = hash_password("RealPass123")
        assert verify_password("WrongPass456", hashed) is False

    def test_same_password_different_hashes(self):
        """bcrypt uses different salts each time."""
        h1 = hash_password("SamePass1")
        h2 = hash_password("SamePass1")
        assert h1 != h2
        assert verify_password("SamePass1", h1) is True
        assert verify_password("SamePass1", h2) is True
