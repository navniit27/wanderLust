(() => {
  "use strict";

  const forms = document.querySelectorAll(".needs-validation");

  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();

const taxToggle = document.getElementById("tax-toggle");

if (taxToggle) {
  taxToggle.addEventListener("change", ({ target }) => {
    document.querySelectorAll(".tax-info").forEach((taxInfo) => {
      taxInfo.style.display = target.checked ? "inline" : "none";
    });
  });
}

document.querySelectorAll(".password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;

    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.textContent = showing ? "Show" : "Hide";
    button.setAttribute(
      "aria-label",
      showing ? "Show password" : "Hide password"
    );
  });
});

document.querySelectorAll(".js-confirm-delete").forEach((form) => {
  form.addEventListener("submit", (event) => {
    const message = form.dataset.confirm || "Are you sure?";
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  });
});

document.querySelectorAll("[data-counter-for]").forEach((counter) => {
  const field = document.getElementById(counter.dataset.counterFor);
  if (!field) return;

  const update = () => {
    counter.textContent = String(field.value.length);
  };

  field.addEventListener("input", update);
  update();
});

document.querySelectorAll('input[type="file"][name="image"]').forEach((input) => {
  const previewId = "image-preview";
  let preview = document.getElementById(previewId);

  if (!preview) {
    preview = document.createElement("img");
    preview.id = previewId;
    preview.alt = "Selected image preview";
    preview.className = "edit-img mt-2 d-none";
    input.insertAdjacentElement("afterend", preview);
  }

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) {
      preview.classList.add("d-none");
      preview.removeAttribute("src");
      return;
    }

    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.classList.remove("d-none");
  });
});

document.querySelectorAll(".alert").forEach((alertEl) => {
  if (!alertEl.classList.contains("alert-success") && !alertEl.classList.contains("alert-danger")) {
    return;
  }

  setTimeout(() => {
    alertEl.style.transition = "opacity 0.4s ease";
    alertEl.style.opacity = "0";
    setTimeout(() => alertEl.remove(), 400);
  }, 4500);
});
