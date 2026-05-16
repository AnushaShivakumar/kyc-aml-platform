from datetime import datetime
from typing import Literal, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="KYC AML Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Role = Literal["admin", "customer"]
CustomerType = Literal["Individual", "Organization"]
Status = Literal["Not Started", "In Progress", "Approved", "Rejected", "Manual Review"]


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Role


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Role = "customer"
    customer_type: CustomerType = "Individual"


class OnboardingRequest(BaseModel):
    user_id: str
    customer_name: str
    customer_type: CustomerType
    country: str
    occupation: str
    source_of_funds: str
    expected_deposit: float
    document_quality: Literal["Clear", "Blurry", "Expired", "Suspicious"]
    face_match: Literal["Strong", "Good", "Weak", "Failed"]
    sanctions_match: bool = False
    pep_match: bool = False


class ManualOnboardingRequest(OnboardingRequest):
    user_id: str = "admin-created"


class DecisionRequest(BaseModel):
    note: Optional[str] = None


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


def calculate_risk(data: OnboardingRequest):
    score = 0
    reasons = []

    if data.sanctions_match:
        score += 30
        reasons.append("Sanctions match found")
    if data.pep_match:
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
    country_points = country_risk.get(data.country, 8)
    score += country_points
    if country_points:
        reasons.append(f"Country risk added {country_points} points")

    if data.customer_type == "Organization":
        score += 10
        reasons.append("Organization onboarding requires ownership review")

    occupation = data.occupation.lower()
    if "self" in occupation or "business" in occupation or "owner" in occupation:
        score += 5
        reasons.append("Self-employed or business income needs verification")
    elif "unknown" in occupation or "none" in occupation:
        score += 10
        reasons.append("Occupation is unclear")

    source = data.source_of_funds.lower()
    if "unknown" in source or "cash" in source:
        score += 20
        reasons.append("Source of funds is unclear")
    elif "business" in source or "inheritance" in source:
        score += 8
        reasons.append("Source of funds requires document review")

    if data.expected_deposit >= 100000:
        score += 15
        reasons.append("Expected deposit is unusually large")
    elif data.expected_deposit >= 30000:
        score += 10
        reasons.append("Expected deposit is elevated for new onboarding")

    document_points = {"Clear": 0, "Blurry": 3, "Expired": 7, "Suspicious": 10}
    score += document_points[data.document_quality]
    if document_points[data.document_quality]:
        reasons.append(f"Document quality issue: {data.document_quality}")

    face_points = {"Strong": 0, "Good": 2, "Weak": 4, "Failed": 5}
    score += face_points[data.face_match]
    if face_points[data.face_match]:
        reasons.append(f"Biometric match is {data.face_match}")

    score = min(score, 100)

    if score <= 30:
        return score, "Low", "Approved", reasons or ["All verification checks passed"]
    if score <= 60:
        return score, "Medium", "Manual Review", reasons
    return score, "High", "Rejected", reasons


@app.get("/")
def home():
    return {"message": "KYC AML Platform Running"}


@app.post("/auth/register")
def register(payload: RegisterRequest):
    if any(user["email"] == payload.email for user in users):
        raise HTTPException(status_code=400, detail="Email already exists")

    user = {
        "id": str(uuid4()),
        "name": payload.name,
        "email": payload.email,
        "password": payload.password,
        "role": payload.role,
        "customer_type": payload.customer_type if payload.role == "customer" else None,
    }
    users.append(user)
    return {key: value for key, value in user.items() if key != "password"}


@app.post("/auth/login")
def login(payload: LoginRequest):
    user = next(
        (
            user
            for user in users
            if user["email"] == payload.email
            and user["password"] == payload.password
            and user["role"] == payload.role
        ),
        None,
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login details")
    return {key: value for key, value in user.items() if key != "password"}


@app.get("/customers/{user_id}/onboarding")
def get_customer_onboarding(user_id: str):
    requests = [item for item in onboarding_requests if item["user_id"] == user_id]
    return requests[-1] if requests else {"final_status": "Not Started"}


@app.post("/onboarding")
def submit_onboarding(payload: OnboardingRequest):
    score, level, status, reasons = calculate_risk(payload)
    request = {
        "id": str(uuid4()),
        **payload.model_dump(),
        "kyc_status": "Failed" if payload.document_quality == "Suspicious" or payload.face_match == "Failed" else "Passed",
        "aml_status": "Flagged" if payload.sanctions_match or payload.pep_match else "Clear",
        "risk_score": score,
        "risk_level": level,
        "final_status": status,
        "decision_note": "; ".join(reasons),
        "created_at": datetime.utcnow().isoformat(),
    }
    onboarding_requests.append(request)
    return request


@app.post("/admin/manual-onboarding")
def manual_onboarding(payload: ManualOnboardingRequest):
    return submit_onboarding(payload)


@app.get("/admin/onboarding-requests")
def list_onboarding_requests():
    return sorted(onboarding_requests, key=lambda item: item["created_at"], reverse=True)


@app.post("/admin/onboarding-requests/{request_id}/approve")
def approve_request(request_id: str, payload: DecisionRequest):
    request = next((item for item in onboarding_requests if item["id"] == request_id), None)
    if not request:
        raise HTTPException(status_code=404, detail="Onboarding request not found")
    request["final_status"] = "Approved"
    request["decision_note"] = payload.note or "Approved manually by admin."
    return request


@app.post("/admin/onboarding-requests/{request_id}/reject")
def reject_request(request_id: str, payload: DecisionRequest):
    request = next((item for item in onboarding_requests if item["id"] == request_id), None)
    if not request:
        raise HTTPException(status_code=404, detail="Onboarding request not found")
    request["final_status"] = "Rejected"
    request["decision_note"] = payload.note or "Rejected manually by admin."
    return request
