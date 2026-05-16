/** @format */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../services/api";

function getUser() {
	return JSON.parse(localStorage.getItem("kycUser"));
}

function OnboardingForm() {
	const navigate = useNavigate();
	const user = getUser();
	const [form, setForm] = useState({
		user_id: user.id,
		customer_name: user.name,
		customer_type: user.customer_type || "Individual",
		country: "USA",
		occupation: "",
		source_of_funds: "Salary",
		expected_deposit: 5000,
		document_quality: "Clear",
		face_match: "Strong",
		sanctions_match: false,
		pep_match: false,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	function updateField(event) {
		const { name, type, checked, value } = event.target;
		setForm({ ...form, [name]: type === "checkbox" ? checked : value });
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setLoading(true);
		setError("");

		try {
			await api.submitOnboarding({
				...form,
				expected_deposit: Number(form.expected_deposit),
			});
			navigate("/customer");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="page shell narrow">
			<Link className="back-link" to="/customer">
				Back to dashboard
			</Link>
			<section className="panel">
				<p className="eyebrow">Customer submission</p>
				<h1>Onboarding form</h1>
				<form className="form two-column" onSubmit={handleSubmit}>
					<label>
						Customer name
						<input name="customer_name" value={form.customer_name} onChange={updateField} required />
					</label>
					<label>
						Customer type
						<select name="customer_type" value={form.customer_type} onChange={updateField}>
							<option>Individual</option>
							<option>Organization</option>
						</select>
					</label>
					<label>
						Country
						<select name="country" value={form.country} onChange={updateField}>
							<option>USA</option>
							<option>Canada</option>
							<option>UK</option>
							<option>Germany</option>
							<option>India</option>
							<option>UAE</option>
							<option>Nigeria</option>
							<option>Pakistan</option>
							<option>Iran</option>
							<option>North Korea</option>
						</select>
					</label>
					<label>
						Occupation
						<input
							name="occupation"
							placeholder="Example: Software engineer"
							value={form.occupation}
							onChange={updateField}
							required
						/>
					</label>
					<label>
						Source of funds
						<select name="source_of_funds" value={form.source_of_funds} onChange={updateField}>
							<option>Salary</option>
							<option>Business income</option>
							<option>Investment savings</option>
							<option>Inheritance</option>
							<option>Cash / Unknown</option>
						</select>
					</label>
					<label>
						Expected deposit
						<input
							min="0"
							name="expected_deposit"
							type="number"
							value={form.expected_deposit}
							onChange={updateField}
						/>
					</label>
					<label>
						Document quality
						<select name="document_quality" value={form.document_quality} onChange={updateField}>
							<option>Clear</option>
							<option>Blurry</option>
							<option>Expired</option>
							<option>Suspicious</option>
						</select>
					</label>
					<label>
						Biometric face match
						<select name="face_match" value={form.face_match} onChange={updateField}>
							<option>Strong</option>
							<option>Good</option>
							<option>Weak</option>
							<option>Failed</option>
						</select>
					</label>
					<label className="checkbox">
						<input
							name="sanctions_match"
							type="checkbox"
							checked={form.sanctions_match}
							onChange={updateField}
						/>
						Sanctions match found
					</label>
					<label className="checkbox">
						<input name="pep_match" type="checkbox" checked={form.pep_match} onChange={updateField} />
						PEP match found
					</label>
					{error && <p className="error wide">{error}</p>}
					<button className="button primary wide" type="submit" disabled={loading}>
						{loading ? "Submitting..." : "Submit onboarding"}
					</button>
				</form>
			</section>
		</main>
	);
}

export default OnboardingForm;
