from unittest.mock import patch, MagicMock
from backend.core.config import settings
from backend.database.models import User


def test_google_sign_in_new_user(client):
    """Test signing in with a new Google account creates user, profiles, and returns JWT."""
    mock_payload = {
        "iss": "https://accounts.google.com",
        "sub": "google-sub-123456789",
        "email": "sarah.connor@gmail.com",
        "email_verified": "true",
        "name": "Sarah Connor",
        "aud": settings.GOOGLE_CLIENT_ID or "default-client-id"
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch("httpx.Client.get", return_value=mock_resp):
        res = client.post("/api/auth/google", json={"id_token": "valid.google.jwt.token"})
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["user"]["email"] == "sarah.connor@gmail.com"
        assert data["user"]["name"] == "Sarah Connor"
        assert "token" in data
        assert data["user"]["id"].startswith("USR-")


def test_google_sign_in_existing_user(client):
    """Test subsequent sign-in with the same Google subject returns the existing user."""
    mock_payload = {
        "iss": "https://accounts.google.com",
        "sub": "google-sub-repeat-999",
        "email": "repeat.user@gmail.com",
        "email_verified": True,
        "name": "Repeat User",
        "aud": settings.GOOGLE_CLIENT_ID or "default-client-id"
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch("httpx.Client.get", return_value=mock_resp):
        # 1. First sign-in creates user
        res1 = client.post("/api/auth/google", json={"id_token": "token-1-123456789"})
        assert res1.status_code == 200
        user_id_1 = res1.json()["user"]["id"]

        # 2. Second sign-in retrieves the same user
        res2 = client.post("/api/auth/google", json={"id_token": "token-2-123456789"})
        assert res2.status_code == 200
        user_id_2 = res2.json()["user"]["id"]
        assert user_id_1 == user_id_2


def test_google_sign_in_account_linking(client, test_user_a, db_session):
    """Test linking an existing local password user when Google email matches and is verified."""
    mock_payload = {
        "iss": "accounts.google.com",
        "sub": "google-sub-link-777",
        "email": test_user_a.email,
        "email_verified": True,
        "name": "Alice Linked",
        "aud": settings.GOOGLE_CLIENT_ID or "default-client-id"
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch("httpx.Client.get", return_value=mock_resp):
        res = client.post("/api/auth/google", json={"id_token": "token-link-123456789"})
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["id"] == test_user_a.id

        # Verify google_id is persisted on the user by refreshing db_session
        db_session.expire_all()
        db_user = db_session.query(User).filter(User.id == test_user_a.id).first()
        assert db_user.google_id == "google-sub-link-777"


def test_google_sign_in_invalid_token(client):
    """Test invalid or expired token rejected by Google returns 401."""
    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.json.return_value = {"error_description": "Invalid Value"}

    with patch("httpx.Client.get", return_value=mock_resp):
        res = client.post("/api/auth/google", json={"id_token": "expired-or-garbage-token"})
        assert res.status_code == 401
        assert "invalid or expired" in res.json()["detail"].lower()


def test_google_sign_in_invalid_issuer(client):
    """Test token from an unauthorized issuer is rejected."""
    mock_payload = {
        "iss": "https://malicious-issuer.com",
        "sub": "sub-hacker",
        "email": "hacker@example.com",
        "email_verified": True
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch("httpx.Client.get", return_value=mock_resp):
        res = client.post("/api/auth/google", json={"id_token": "token-spoofed-issuer"})
        assert res.status_code == 401
        assert "invalid google token issuer" in res.json()["detail"].lower()


def test_google_sign_in_unverified_email(client):
    """Test Google token with unverified email is rejected to prevent impersonation."""
    mock_payload = {
        "iss": "https://accounts.google.com",
        "sub": "sub-unverified",
        "email": "unverified@gmail.com",
        "email_verified": False
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch("httpx.Client.get", return_value=mock_resp):
        res = client.post("/api/auth/google", json={"id_token": "token-unverified"})
        assert res.status_code == 400
        assert "email is not verified" in res.json()["detail"].lower()


def test_google_user_cannot_login_with_blank_password(client):
    """Ensure OAuth-only user who has no password cannot be logged in with arbitrary password."""
    mock_payload = {
        "iss": "https://accounts.google.com",
        "sub": "google-sub-nopass-555",
        "email": "oauth.only@gmail.com",
        "email_verified": True,
        "name": "OAuth Only",
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch("httpx.Client.get", return_value=mock_resp):
        res = client.post("/api/auth/google", json={"id_token": "token-nopass"})
        assert res.status_code == 200

    # Attempt to login via /api/auth/login with blank or random password
    login_res = client.post("/api/auth/login", json={
        "email": "oauth.only@gmail.com",
        "password": "GuessPassword123"
    })
    assert login_res.status_code == 401
