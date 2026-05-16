/** @format */

import { Link } from "react-router-dom";

function Home() {
	return (
		<main className="page shell hero-layout">
			<section className="hero-copy">
				<p className="eyebrow">KYC + AML MVP</p>
				<h1>Customer onboarding with risk-based approval.</h1>
				<p className="hero-text">
					A simple platform for customers to submit onboarding details and for admins to
					review KYC, AML, risk score, and final decisions.
				</p>
				<div className="actions">
					<Link className="button primary" to="/login">
						Login
					</Link>
					<Link className="button secondary" to="/register">
						Register
					</Link>
				</div>
			</section>

			<section className="flow-panel" aria-label="Platform flow">
				<div className="flow-step active">Customer details submitted</div>
				<div className="flow-step">KYC verification</div>
				<div className="flow-step">AML screening</div>
				<div className="flow-step">Risk score</div>
				<div className="flow-step">Score based onboarding</div>
			</section>
		</main>
	);
}

export default Home;
