/** @format */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../services/api";

function AdminDashboard() {
	const navigate = useNavigate();
	const [requests, setRequests] = useState([]);
	const [error, setError] = useState("");
	const [manualForm, setManualForm] = useState({
		customer_name: "",
		customer_type: "Individual",
		country: "USA",
		occupation: "",
		source_of_funds: "Salary",
		expected_deposit: 5000,
		document_quality: "Clear",
		face_match: "Strong",
		sanctions_match: false,
		pep_match: false,
	});

	async function loadRequests() {
		setRequests(await api.getOnboardingRequests());
	}

	useEffect(() => {
		loadRequests();
	}, []);

	const stats = useMemo(
		() => ({
			total: requests.length,
			approved: requests.filter((item) => item.final_status === "Approved").length,
			review: requests.filter((item) => item.final_status === "Manual Review").length,
			rejected: requests.filter((item) => item.final_status === "Rejected").length,
		}),
		[requests]
	);

	function logout() {
		localStorage.removeItem("kycUser");
		navigate("/");
	}

	function updateManualForm(event) {
		const { name, type, checked, value } = event.target;
		setManualForm({ ...manualForm, [name]: type === "checkbox" ? checked : value });
	}

	async function submitManual(event) {
		event.preventDefault();
		setError("");
		try {
			await api.manualOnboarding({
				...manualForm,
				expected_deposit: Number(manualForm.expected_deposit),
			});
			setManualForm({ ...manualForm, customer_name: "", occupation: "" });
			loadRequests();
		} catch (err) {
			setError(err.message);
		}
	}

	async function decide(requestId, action) {
		if (action === "approve") {
			await api.approveRequest(requestId, "Approved after admin review.");
		} else {
			await api.rejectRequest(requestId, "Rejected after admin review.");
		}
		loadRequests();
	}

	return (
		<main className="page shell">
			<nav className="topbar">
				<div>
					<p className="eyebrow">Admin portal</p>
					<h1>Onboarding dashboard</h1>
				</div>
				<button className="button ghost" type="button" onClick={logout}>
					Logout
				</button>
			</nav>

			<section className="metrics">
				<div className="metric">
					<span>Total</span>
					<strong>{stats.total}</strong>
				</div>
				<div className="metric">
					<span>Approved</span>
					<strong>{stats.approved}</strong>
				</div>
				<div className="metric">
					<span>Manual review</span>
					<strong>{stats.review}</strong>
				</div>
				<div className="metric">
					<span>Rejected</span>
					<strong>{stats.rejected}</strong>
				</div>
			</section>

			<section className="grid admin-grid">
				<div className="panel">
					<h2>Manual onboarding</h2>
					<form className="form compact" onSubmit={submitManual}>
						<input
							name="customer_name"
							placeholder="Customer name"
							value={manualForm.customer_name}
							onChange={updateManualForm}
							required
						/>
						<select name="customer_type" value={manualForm.customer_type} onChange={updateManualForm}>
							<option>Individual</option>
							<option>Organization</option>
						</select>
						<select name="country" value={manualForm.country} onChange={updateManualForm}>
							<option>USA</option>
							<option>India</option>
							<option>UAE</option>
							<option>Nigeria</option>
							<option>Iran</option>
							<option>North Korea</option>
						</select>
						<input
							name="occupation"
							placeholder="Occupation"
							value={manualForm.occupation}
							onChange={updateManualForm}
							required
						/>
						<select name="source_of_funds" value={manualForm.source_of_funds} onChange={updateManualForm}>
							<option>Salary</option>
							<option>Business income</option>
							<option>Investment savings</option>
							<option>Cash / Unknown</option>
						</select>
						<input
							name="expected_deposit"
							type="number"
							value={manualForm.expected_deposit}
							onChange={updateManualForm}
						/>
						<select
							name="document_quality"
							value={manualForm.document_quality}
							onChange={updateManualForm}
						>
							<option>Clear</option>
							<option>Blurry</option>
							<option>Expired</option>
							<option>Suspicious</option>
						</select>
						<select name="face_match" value={manualForm.face_match} onChange={updateManualForm}>
							<option>Strong</option>
							<option>Good</option>
							<option>Weak</option>
							<option>Failed</option>
						</select>
						<label className="checkbox">
							<input
								name="sanctions_match"
								type="checkbox"
								checked={manualForm.sanctions_match}
								onChange={updateManualForm}
							/>
							Sanctions match
						</label>
						<label className="checkbox">
							<input
								name="pep_match"
								type="checkbox"
								checked={manualForm.pep_match}
								onChange={updateManualForm}
							/>
							PEP match
						</label>
						{error && <p className="error">{error}</p>}
						<button className="button primary full" type="submit">
							Create onboarding request
						</button>
					</form>
				</div>

				<div className="panel">
					<h2>Customer review queue</h2>
					<div className="request-list">
						{requests.map((request) => (
							<article className="request-card" key={request.id}>
								<div className="request-head">
									<div>
										<h3>{request.customer_name}</h3>
										<p className="muted">
											{request.customer_type} · {request.country} · {request.occupation}
										</p>
									</div>
									<div className={`status-pill ${request.final_status.toLowerCase().replace(" ", "-")}`}>
										{request.final_status}
									</div>
								</div>
								<div className="risk-row">
									<strong>Risk score: {request.risk_score}/100</strong>
									<span>{request.risk_level} risk</span>
									<span>KYC: {request.kyc_status}</span>
									<span>AML: {request.aml_status}</span>
								</div>
								<p className="muted">{request.decision_note}</p>
								<div className="actions">
									<button className="button secondary" type="button" onClick={() => decide(request.id, "approve")}>
										Approve
									</button>
									<button className="button danger" type="button" onClick={() => decide(request.id, "reject")}>
										Reject
									</button>
								</div>
							</article>
						))}
					</div>
				</div>
			</section>
		</main>
	);
}

export default AdminDashboard;
