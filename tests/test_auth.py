from backend.core.security import verify_password


def test_register_user_success(client):
    """Test successful user registration returns 201 and JWT."""
    res = client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePassword123!"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["email"] == "jane@example.com"
    assert data["user"]["id"].startswith("USR-")


def test_register_duplicate_email(client, test_user_a):
    """Test duplicate registration with existing email returns 400."""
    res = client.post("/api/auth/register", json={
        "name": "Imposter Alice",
        "email": test_user_a.email,
        "password": "NewPassword123!"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"].lower()


def test_login_success(client, test_user_a):
    """Test successful login with correct credentials returns 200 and token."""
    res = client.post("/api/auth/login", json={
        "email": test_user_a.email,
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["id"] == test_user_a.id


def test_login_incorrect_password(client, test_user_a):
    """Test login with wrong password returns 401."""
    res = client.post("/api/auth/login", json={
        "email": test_user_a.email,
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert "invalid email address or password" in res.json()["detail"].lower()


def test_login_nonexistent_email(client):
    """Test login with unknown email returns 401."""
    res = client.post("/api/auth/login", json={
        "email": "ghost@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 401


def test_password_is_properly_hashed(test_user_a):
    """Ensure stored password hash is bcrypt, not plaintext or plain sha256."""
    assert not test_user_a.password_hash.startswith("Password")
    assert test_user_a.password_hash.startswith("$2b$") or test_user_a.password_hash.startswith("$2a$")
    assert verify_password("Password123!", test_user_a.password_hash) is True
    assert verify_password("WrongPassword!", test_user_a.password_hash) is False


def test_auth_me_endpoint(client, auth_headers_user_a, test_user_a):
    """Test /api/auth/me returns current user when authenticated."""
    res = client.get("/api/auth/me", headers=auth_headers_user_a)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == test_user_a.id
    assert data["email"] == test_user_a.email


def test_auth_me_unauthenticated(client):
    """Test /api/auth/me returns 401 without auth header."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401
