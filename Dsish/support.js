document.addEventListener("DOMContentLoaded", () => {

    const closeBtn = document.getElementById("closeSupport");
    const submitBtn = document.getElementById("submitSupport");

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const orderId = document.getElementById("orderId");
    const issueType = document.getElementById("issueType");
    const message = document.getElementById("message");

    /* ================= CLOSE BUTTON ================= */

    closeBtn.addEventListener("click", () => {
        document.body.style.opacity = "0";
        document.body.style.transition = "0.3s ease";

        setTimeout(() => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = "index.html";
            }
        }, 300);
    });

    /* ================= SUBMIT FORM ================= */

    submitBtn.addEventListener("click", () => {

        if (submitBtn.classList.contains("loading")) return;

        const nameVal = fullName.value.trim();
        const emailVal = email.value.trim();
        const issueVal = issueType.value;
        const messageVal = message.value.trim();

        if (!nameVal || !emailVal || !issueVal || !messageVal) {
            showToast("Please fill all required fields ⚠");
            return;
        }

        if (!validateEmail(emailVal)) {
            showToast("Please enter a valid email address ✉");
            return;
        }

        submitBtn.classList.add("loading");
        submitBtn.textContent = "Submitting Request...";

        setTimeout(() => {

            const ticketId = generateTicketId();

            const ticket = {
                ticketId,
                name: nameVal,
                email: emailVal,
                orderId: orderId.value.trim() || "N/A",
                issue: issueVal,
                message: messageVal,
                date: getCurrentDate()
            };

            saveTicket(ticket);

            showToast(`Ticket Submitted ✔ ID: ${ticketId}`);

            resetForm();

            submitBtn.classList.remove("loading");
            submitBtn.textContent = "Submit Request";

        }, 5000);
    });

    /* ================= SAVE TO LOCAL STORAGE ================= */

    function saveTicket(ticket) {
        const existingTickets = JSON.parse(localStorage.getItem("supportTickets")) || [];
        existingTickets.unshift(ticket);
        localStorage.setItem("supportTickets", JSON.stringify(existingTickets));
    }

    /* ================= GENERATE TICKET ID ================= */

    function generateTicketId() {
        const random = Math.floor(1000 + Math.random() * 9000);
        return "SUP-" + random;
    }

    /* ================= EMAIL VALIDATION ================= */

    function validateEmail(email) {
        const pattern = /^[^ ]+@[^ ]+\.[a-z]{2,}$/;
        return pattern.test(email.toLowerCase());
    }

    /* ================= RESET FORM ================= */

    function resetForm() {
        fullName.value = "";
        email.value = "";
        orderId.value = "";
        issueType.value = "";
        message.value = "";
    }

    /* ================= TOAST ================= */

    function showToast(message) {

        let toast = document.querySelector(".toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.className = "toast";
            document.body.appendChild(toast);

            /* Minimal styling injected */
            toast.style.position = "fixed";
            toast.style.bottom = "30px";
            toast.style.left = "50%";
            toast.style.transform = "translateX(-50%)";
            toast.style.background = "#111";
            toast.style.color = "#fff";
            toast.style.padding = "14px 24px";
            toast.style.borderRadius = "50px";
            toast.style.fontSize = "14px";
            toast.style.opacity = "0";
            toast.style.transition = "0.3s ease";
            toast.style.zIndex = "2000";
        }

        toast.textContent = message;
        toast.style.opacity = "1";

        setTimeout(() => {
            toast.style.opacity = "0";
        }, 3000);
    }

    /* ================= DATE FORMAT ================= */

    function getCurrentDate() {
        const options = { day: "2-digit", month: "short", year: "numeric" };
        return new Date().toLocaleDateString("en-GB", options);
    }

});
