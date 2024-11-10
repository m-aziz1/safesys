// Global state for storing data
window.users = [];
window.lockers = [];
window.activities = [];

// Fetch data from the Flask backend
async function fetchData() {
	try {
		const response = await fetch("/showData");
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
		return null;
	}
}

// Function to update data with backend response
async function initializeData() {
	try {
		const data = await fetchData();
		if (data) {
			console.log("Fetched data:", data);

			// Update users array
			window.users = data.users.map((user) => ({
				id: user.id,
				email: user.email,
				name: user.name,
			}));

			// Update lockers array
			window.lockers = data.lockers.map((locker) => ({
				id: parseInt(locker.id),
				status: locker.issuedTo ? "occupied" : "free",
				occupiedBy: locker.issuedTo
					? window.users.find((user) => user.id === locker.issuedTo)?.email
					: null,
			}));

			// Update activities array
			window.activities = data.activity
				.filter((act) => act.status === "reported")
				.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort by timestamp descending
				.filter(
					(act, index, self) =>
						index === self.findIndex((t) => t.locker === act.locker) // Keep only first occurrence of each locker
				)
				.map((act) => ({
					id: parseInt(act.id),
					locker: parseInt(act.locker),
					user: parseInt(act.user),
					status: act.status,
					timestamp: act.timestamp,
				}));

			return {
				users: window.users,
				lockers: window.lockers,
				activities: window.activities,
			};
		}
	} catch (error) {
		console.error("Error initializing data:", error);
		alert("Failed to load locker data. Please refresh the page.");
	}
	return null;
}

// Make functions and data available globally
window.fetchData = fetchData;
window.initializeData = initializeData;
