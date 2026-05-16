/** @format */

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OnboardingForm from "./pages/OnboardingForm";
import Register from "./pages/Register";
import "./kyc.css";

function getCurrentUser() {
	const storedUser = localStorage.getItem("kycUser");
	return storedUser ? JSON.parse(storedUser) : null;
}

function ProtectedRoute({ children, role }) {
	const user = getCurrentUser();

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (role && user.role !== role) {
		return <Navigate to="/" replace />;
	}

	return children;
}

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route
					path="/customer"
					element={
						<ProtectedRoute role="customer">
							<CustomerDashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/customer/onboarding"
					element={
						<ProtectedRoute role="customer">
							<OnboardingForm />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/admin"
					element={
						<ProtectedRoute role="admin">
							<AdminDashboard />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
