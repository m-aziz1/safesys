// Sidebar Toggle
const sidebar = document.querySelector(".sidebar");
const mainContent = document.querySelector(".main-content");
const toggleButtons = document.querySelectorAll(".toggle-sidebar");
const currentSection = document.querySelector(".current-section");

toggleButtons.forEach((button) => {
	button.addEventListener("click", () => {
		if (window.innerWidth <= 768) {
			sidebar.classList.toggle("mobile-visible");
		} else {
			sidebar.classList.toggle("collapsed");
			mainContent.classList.toggle("expanded");
		}
	});
});

// Close sidebar when clicking outside on mobile
document.addEventListener("click", (e) => {
	if (
		window.innerWidth <= 768 &&
		!sidebar.contains(e.target) &&
		!e.target.closest(".toggle-sidebar")
	) {
		sidebar.classList.remove("mobile-visible");
	}
});

// Navigation handling
document.querySelectorAll(".nav-link").forEach((link) => {
	link.addEventListener("click", (e) => {
		e.preventDefault();
		const section = e.target.closest(".nav-link").dataset.section;

		// Update active nav
		document
			.querySelectorAll(".nav-link")
			.forEach((l) => l.classList.remove("active"));
		e.target.closest(".nav-link").classList.add("active");

		// Update mobile header text
		currentSection.textContent =
			section.charAt(0).toUpperCase() + section.slice(1);

		// Show/hide sections
		document
			.querySelectorAll("main section")
			.forEach((s) => s.classList.add("hidden"));
		document.getElementById(`${section}-section`)?.classList.remove("hidden");

		// Close mobile sidebar after navigation
		if (window.innerWidth <= 768) {
			sidebar.classList.remove("mobile-visible");
		}
	});
});

// Render lockers
function renderLockers() {
	const lockersContainer = document.querySelector(".locker-grid");
	if (!lockersContainer) {
		console.error("Locker container not found");
		return;
	}

	try {
		lockersContainer.innerHTML = "";

		if (!window.lockers || !Array.isArray(window.lockers)) {
			throw new Error("Invalid lockers data");
		}

		window.lockers.forEach((locker) => {
			if (!locker || typeof locker.id === "undefined") {
				console.warn("Invalid locker data:", locker);
				return;
			}

			const card = document.createElement("div");
			card.className = "locker-card";

			const cardContent = `
                <div class="locker-header">
                    <h3 class="locker-title">Locker ${locker.id}</h3>
                    <span class="status-badge ${
											locker.status === "free"
												? "status-free"
												: "status-occupied"
										}">
                        ${locker.status.toUpperCase()}
                    </span>
                </div>
                ${
									locker.status === "occupied"
										? `<div class="locker-actions">
                        <p class="occupant-info">Occupied by: ${
													locker.occupiedBy || "Unknown"
												}</p>
                        <button class="btn-vacate" data-locker-id="${
													locker.id
												}">VACATE</button>
                       </div>`
										: `<div class="locker-actions">
                        <select id="assign-${locker.id}" class="user-select">
                            <option value="">Assign to...</option>
                            ${window.users
															.map(
																(user) =>
																	`<option value="${user.email}">${user.email}</option>`
															)
															.join("")}
                        </select>
                        <button class="btn-assign" data-locker-id="${
													locker.id
												}">ASSIGN</button>
                       </div>`
								}
            `;

			card.innerHTML = cardContent;

			// Add event listeners
			const vacateButton = card.querySelector(".btn-vacate");
			const assignButton = card.querySelector(".btn-assign");

			if (vacateButton) {
				vacateButton.addEventListener("click", () => vacateLocker(locker.id));
			}

			if (assignButton) {
				assignButton.addEventListener("click", () => assignLocker(locker.id));
			}

			lockersContainer.appendChild(card);
		});
	} catch (error) {
		console.error("Error rendering lockers:", error);
		lockersContainer.innerHTML = `<div class="error-message">Error loading lockers: ${error.message}</div>`;
	}
}

// Render activity logs
function renderActivity() {
	const activityContainer = document.querySelector(".activity-list");
	if (!activityContainer) return;

	activityContainer.innerHTML = "";

	// Sort activities by timestamp in descending order
	const sortedActivities = window.activities.sort(
		(a, b) => new Date(b.timestamp) - new Date(a.timestamp)
	);

	sortedActivities.forEach((activity) => {
		const log = document.createElement("div");
		log.className = "activity-item";
		log.innerHTML = `
            <div class="activity-locker">Locker ${activity.locker}</div>
            <div class="activity-type">Activity: ${activity.status}</div>
            <div class="activity-time">Reported at - ${activity.timestamp}</div>
        `;
		activityContainer.appendChild(log);
	});
}

// Function to handle locker vacation
async function vacateLocker(lockerId) {
	try {
		if (lockerId === undefined || lockerId === null) {
			throw new Error("Locker ID is required");
		}

		const locker = window.lockers.find((l) => l.id === lockerId);
		if (!locker) {
			throw new Error("Invalid locker ID");
		}

		const response = await fetch("/api/lockers/vacate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				lockerId: parseInt(lockerId),
				userId: locker.occupiedBy,
			}),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error || "Failed to vacate locker");
		}

		await initializeData();
		renderLockers();
		renderActivity();
	} catch (error) {
		console.error("Error vacating locker:", error);
		alert(error.message || "Failed to vacate locker. Please try again.");
	}
}

// Function to handle locker assignment
async function assignLocker(lockerId) {
	try {
		if (lockerId === undefined || lockerId === null) {
			throw new Error("Locker ID is required");
		}

		const select = document.getElementById(`assign-${lockerId}`);
		const userEmail = select.value;

		if (!userEmail) {
			throw new Error("Please select a user");
		}

		const response = await fetch("/api/lockers/assign", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				lockerId: parseInt(lockerId),
				userEmail: userEmail,
			}),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error || "Failed to assign locker");
		}

		// Update the local data
		const lockerIndex = window.lockers.findIndex((l) => l.id === lockerId);
		if (lockerIndex !== -1) {
			window.lockers[lockerIndex] = {
				...window.lockers[lockerIndex],
				status: "occupied",
				occupiedBy: userEmail,
			};
		}

		// Refresh the UI
		renderLockers();
		renderActivity();

		// Optionally refresh the data from server
		await initializeData();
	} catch (error) {
		console.error("Error assigning locker:", error);
		alert(error.message || "Failed to assign locker. Please try again.");
	}
}

// Initialize data and render on page load
window.addEventListener("DOMContentLoaded", async () => {
	await initializeData();
	renderLockers();
	renderActivity();
});

// Make functions available globally for onclick handlers
window.vacateLocker = vacateLocker;
window.assignLocker = assignLocker;
window.renderLockers = renderLockers;
window.renderActivity = renderActivity;
