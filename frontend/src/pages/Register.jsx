/** @format */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../services/api";

function Register() {
	const navigate = useNavigate();
	const [form, setForm] = useState({
		name: "",
		email: "",
		password: "",
		role: "customer",
		customer_type: "Individual",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	function updateField(event) {
		setForm({ ...form, [event.target.name]: event.target.value });
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setLoading(true);
		setError("");

		try {
			const user = await api.register(form);
			localStorage.setItem("kycUser", JSON.stringify(user));
			navigate("/customer");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="page auth-page">
			<section className="auth-card">
				<Link className="back-link" to="/">
					Back
				</Link>
				<p className="eyebrow">Customer onboarding</p>
				<h1>Create account</h1>

				<form className="form" onSubmit={handleSubmit}>
					<label>
						Full name
						<input name="name" value={form.name} onChange={updateField} required />
					</label>
					<label>
						Email
						<input name="email" type="email" value={form.email} onChange={updateField} required />
					</label>
					<label>
						Password
						<input
							name="password"
							type="password"
							value={form.password}
							onChange={updateField}
							required
						/>
					</label>
					<label>
						Customer type
						<select name="customer_type" value={form.customer_type} onChange={updateField}>
							<option>Individual</option>
							<option>Organization</option>
						</select>
					</label>
					{error && <p className="error">{error}</p>}
					<button className="button primary full" type="submit" disabled={loading}>
						{loading ? "Creating..." : "Register"}
					</button>
				</form>
			</section>
		</main>
	);
}

export default Register;
