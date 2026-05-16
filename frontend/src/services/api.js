const API_BASE_URL = "http://127.0.0.1:8001";

async function request(path, options = {}) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
		...options,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.detail || "Request failed");
	}

	return response.json();
}

export const api = {
	login: (payload) =>
		request("/auth/login", {
			method: "POST",
			body: JSON.stringify(payload),
		}),
	register: (payload) =>
		request("/auth/register", {
			method: "POST",
			body: JSON.stringify(payload),
		}),
	submitOnboarding: (payload) =>
		request("/onboarding", {
			method: "POST",
			body: JSON.stringify(payload),
		}),
	getCustomerOnboarding: (userId) => request(`/customers/${userId}/onboarding`),
	getOnboardingRequests: () => request("/admin/onboarding-requests"),
	manualOnboarding: (payload) =>
		request("/admin/manual-onboarding", {
			method: "POST",
			body: JSON.stringify(payload),
		}),
	approveRequest: (requestId, note) =>
		request(`/admin/onboarding-requests/${requestId}/approve`, {
			method: "POST",
			body: JSON.stringify({ note }),
		}),
	rejectRequest: (requestId, note) =>
		request(`/admin/onboarding-requests/${requestId}/reject`, {
			method: "POST",
			body: JSON.stringify({ note }),
		}),
};
