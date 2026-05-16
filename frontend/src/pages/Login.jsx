/** @format */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../services/api";
import "./Login.css";
function Login() {
	const navigate = useNavigate();
	const [form, setForm] = useState({
		email: "admin@kyc.com",
		password: "admin123",
		role: "admin",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	function updateField(event) {
		setForm({ ...form, [event.target.name]: event.target.value });
	}

	function switchRole(role) {
		setForm({
			email: role === "admin" ? "admin@kyc.com" : "customer@kyc.com",
			password: role === "admin" ? "admin123" : "customer123",
			role,
		});
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setLoading(true);
		setError("");

		try {
			const user = await api.login(form);
			localStorage.setItem("kycUser", JSON.stringify(user));
			navigate(user.role === "admin" ? "/admin" : "/customer");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="login-page">
			<section className="login-card">
				<Link className="back-link" to="/">
					Back
				</Link>
				<p className="eyebrow">Secure access</p>
				<h1>Login</h1>

				<div className="role-switch">
					<button
						className={form.role === "admin" ? "active" : ""}
						type="button"
						onClick={() => switchRole("admin")}
					>
						Admin
					</button>
					<button
						className={form.role === "customer" ? "active" : ""}
						type="button"
						onClick={() => switchRole("customer")}
					>
						Customer
					</button>
				</div>

				<form className="form" onSubmit={handleSubmit}>
					<label>
						Email
						<input
							name="email"
							type="email"
							value={form.email}
							onChange={updateField}
						/>
					</label>
					<label>
						Password
						<input
							name="password"
							type="password"
							value={form.password}
							onChange={updateField}
						/>
					</label>
					{error && <p className="error">{error}</p>}
					<button
						className="button primary full"
						type="submit"
						disabled={loading}
					>
						{loading ? "Signing in..." : "Login"}
					</button>
				</form>

				<p className="muted center">
					New customer? <Link to="/register">Create an account</Link>
				</p>
			</section>
		</main>
	);
}

export default Login;
