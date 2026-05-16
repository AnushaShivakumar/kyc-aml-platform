import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
from uuid import uuid4


users = [
    {
        "id": "admin-1",
        "name": "Admin User",
        "email": "admin@kyc.com",
        "password": "admin123",
        "role": "admin",
        "customer_type": None,
    },
    {
        "id": "customer-1",
        "name": "Emma Johnson",
        "email": "customer@kyc.com",
        "password": "customer123",
        "role": "customer",
        "customer_type": "Individual",
    },
]

onboarding_requests = [
    {
        "id": "req-1",
        "user_id": "customer-1",
        "customer_name": "Emma Johnson",
        "customer_type": "Individual",
        "country": "USA",
        "occupation": "Software Engineer",
        "source_of_funds": "Salary",
        "expected_deposit": 5000,
        "document_quality": "Clear",
        "face_match": "Strong",
        "sanctions_match": False,
        "pep_match": False,
        "kyc_status": "Passed",
        "aml_status": "Clear",
        "risk_score": 0,
        "risk_level": "Low",
        "final_status": "Approved",
        "decision_note": "Auto-approved based on low-risk KYC and AML checks.",
        "created_at": datetime.utcnow().isoformat(),
    }
]


def public_user(user):
    return {key: value for key, value in user.items() if key != "password"}


def calculate_risk(data):
    score = 0
    reasons = []

    if data.get("sanctions_match"):
        score += 30
        reasons.append("Sanctions match found")
    if data.get("pep_match"):
        score += 20
        reasons.append("PEP match found")

    country_risk = {
        "USA": 0,
        "Canada": 5,
        "UK": 5,
        "Germany": 5,
        "India": 8,
        "UAE": 10,
        "Nigeria": 10,
        "Pakistan": 12,
        "Iran": 20,
        "North Korea": 20,
    }
    country_points = country_risk.get(data.get("country"), 8)
    score += country_points
    if country_points:
        reasons.append(f"Country risk added {country_points} points")

    if data.get("customer_type") == "Organization":
        score += 10
        reasons.append("Organization onboarding requires ownership review")

    occupation = data.get("occupation", "").lower()
    if "self" in occupation or "business" in occupation or "owner" in occupation:
        score += 5
        reasons.append("Self-employed or business income needs verification")
    elif "unknown" in occupation or "none" in occupation:
        score += 10
        reasons.append("Occupation is unclear")

    source = data.get("source_of_funds", "").lower()
    if "unknown" in source or "cash" in source:
        score += 20
        reasons.append("Source of funds is unclear")
    elif "business" in source or "inheritance" in source:
        score += 8
        reasons.append("Source of funds requires document review")

    expected_deposit = float(data.get("expected_deposit") or 0)
    if expected_deposit >= 100000:
        score += 15
        reasons.append("Expected deposit is unusually large")
    elif expected_deposit >= 30000:
        score += 10
        reasons.append("Expected deposit is elevated for new onboarding")

    document_points = {"Clear": 0, "Blurry": 3, "Expired": 7, "Suspicious": 10}
    score += document_points.get(data.get("document_quality"), 0)
    if document_points.get(data.get("document_quality"), 0):
        reasons.append(f"Document quality issue: {data.get('document_quality')}")

    face_points = {"Strong": 0, "Good": 2, "Weak": 4, "Failed": 5}
    score += face_points.get(data.get("face_match"), 0)
    if face_points.get(data.get("face_match"), 0):
        reasons.append(f"Biometric match is {data.get('face_match')}")

    score = min(score, 100)
    if score <= 30:
        return score, "Low", "Approved", reasons or ["All verification checks passed"]
    if score <= 60:
        return score, "Medium", "Manual Review", reasons
    return score, "High", "Rejected", reasons


class Handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def read_json(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        return json.loads(self.rfile.read(content_length))

    def send_json(self, payload, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/":
            self.send_json({"message": "KYC AML Platform Running"})
            return

        if path.startswith("/customers/") and path.endswith("/onboarding"):
            user_id = path.split("/")[2]
            matches = [item for item in onboarding_requests if item["user_id"] == user_id]
            self.send_json(matches[-1] if matches else {"final_status": "Not Started"})
            return

        if path == "/admin/onboarding-requests":
            ordered = sorted(onboarding_requests, key=lambda item: item["created_at"], reverse=True)
            self.send_json(ordered)
            return

        self.send_json({"detail": "Not found"}, 404)

    def do_POST(self):
        path = urlparse(self.path).path
        data = self.read_json()

        if path == "/auth/register":
            if any(user["email"] == data.get("email") for user in users):
                self.send_json({"detail": "Email already exists"}, 400)
                return
            user = {
                "id": str(uuid4()),
                "name": data["name"],
                "email": data["email"],
                "password": data["password"],
                "role": data.get("role", "customer"),
                "customer_type": data.get("customer_type", "Individual"),
            }
            users.append(user)
            self.send_json(public_user(user))
            return

        if path == "/auth/login":
            user = next(
                (
                    user
                    for user in users
                    if user["email"] == data.get("email")
                    and user["password"] == data.get("password")
                    and user["role"] == data.get("role")
                ),
                None,
            )
            if not user:
                self.send_json({"detail": "Invalid login details"}, 401)
                return
            self.send_json(public_user(user))
            return

        if path == "/onboarding" or path == "/admin/manual-onboarding":
            score, level, status, reasons = calculate_risk(data)
            request = {
                "id": str(uuid4()),
                **data,
                "user_id": data.get("user_id", "admin-created"),
                "kyc_status": "Failed"
                if data.get("document_quality") == "Suspicious" or data.get("face_match") == "Failed"
                else "Passed",
                "aml_status": "Flagged" if data.get("sanctions_match") or data.get("pep_match") else "Clear",
                "risk_score": score,
                "risk_level": level,
                "final_status": status,
                "decision_note": "; ".join(reasons),
                "created_at": datetime.utcnow().isoformat(),
            }
            onboarding_requests.append(request)
            self.send_json(request)
            return

        if path.startswith("/admin/onboarding-requests/"):
            parts = path.split("/")
            request_id = parts[3]
            action = parts[4]
            request = next((item for item in onboarding_requests if item["id"] == request_id), None)
            if not request:
                self.send_json({"detail": "Onboarding request not found"}, 404)
                return
            request["final_status"] = "Approved" if action == "approve" else "Rejected"
            request["decision_note"] = data.get("note") or f"{request['final_status']} manually by admin."
            self.send_json(request)
            return

        self.send_json({"detail": "Not found"}, 404)


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 8001), Handler)
    print("KYC AML API running at http://127.0.0.1:8001")
    server.serve_forever()
