/** @format */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../services/api";

function getUser() {
	return JSON.parse(localStorage.getItem("kycUser"));
}

function CustomerDashboard() {
	const navigate = useNavigate();
	const user = getUser();
	const [status, setStatus] = useState({ final_status: "Loading" });

	useEffect(() => {
		api.getCustomerOnboarding(user.id).then(setStatus);
	}, [user.id]);

	function logout() {
		localStorage.removeItem("kycUser");
		navigate("/");
	}

	const steps = ["Submitted", "KYC Verification", "AML Screening", "Risk Score", "Decision"];
	const activeStep =
		status.final_status === "Not Started" ? 0 : status.final_status === "In Progress" ? 2 : 5;

	return (
		<main className="page shell">
			<nav className="topbar">
				<div>
					<p className="eyebrow">Customer portal</p>
					<h1>Welcome, {user.name}</h1>
				</div>
				<button className="button ghost" type="button" onClick={logout}>
					Logout
				</button>
			</nav>

			<section className="grid two">
				<div className="panel">
					<h2>Onboarding status</h2>
					<div className={`status-pill ${status.final_status?.toLowerCase().replace(" ", "-")}`}>
						{status.final_status}
					</div>
					<p className="muted">{status.decision_note || "Submit onboarding to begin review."}</p>
					<Link className="button primary" to="/customer/onboarding">
						{status.final_status === "Not Started" ? "Start onboarding" : "Update onboarding"}
					</Link>
				</div>

				<div className="panel">
					<h2>Risk score</h2>
					<div className="score">{status.risk_score ?? "--"}</div>
					<p className="muted">Risk level: {status.risk_level || "Pending"}</p>
					<p className="muted">KYC: {status.kyc_status || "Pending"}</p>
					<p className="muted">AML: {status.aml_status || "Pending"}</p>
				</div>
			</section>

			<section className="panel">
				<h2>Onboarding progress</h2>
				<div className="tracker">
					{steps.map((step, index) => (
						<div className={index < activeStep ? "tracker-step done" : "tracker-step"} key={step}>
							<span>{index + 1}</span>
							{step}
						</div>
					))}
				</div>
			</section>
		</main>
	);
}

export default CustomerDashboard;
