

function navigateSection(currentSectionId, targetSectionId) {
  const $currentSection = $(`#section-${currentSectionId}`);
  const $targetSection = $(`#section-${targetSectionId}`);

  if (targetSectionId > currentSectionId) {
    // Moving forward: validate required fields
    if (!validateSection($currentSection)) {
      Swal.fire({
        title: "Please fill out all required fields before proceeding.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }
  }

  // Switch sections
  $currentSection.addClass('hidden-section');
  $targetSection.removeClass('hidden-section');
}

function validateSection($section) {
  let isValid = true;
  $section.find('input[required], select[required]').each(function () {
    if (!$(this).val()) {
      isValid = false;
      $(this).addClass('is-invalid'); // Add a class for invalid fields (optional for styling)
    } else {
      $(this).removeClass('is-invalid'); // Remove invalid class if corrected
    }
  });
  return isValid;
};




function handlePageLoad() {
  const urlParams = new URLSearchParams(window.location.search);

  // Handle validation errors
  const errors = urlParams.get('errors');
  if (errors) {
    try {
      // Parse the JSON string to get error messages
      const errorMessages = JSON.parse(decodeURIComponent(errors));

      // Combine all errors into a single string with each error on a new line
      const errorText = errorMessages.map(msg => `• ${msg}`).join("\n");

      // Display using SweetAlert2
      Swal.fire({
        title: "Please try again!",
        text: errorText,
        icon: "error",
        confirmButtonText: "OK",
      });
    } catch (e) {
      console.error('Error parsing validation errors:', e);
    }
  }

  // Handle success message
  const success = urlParams.get('success');
  if (success) {
    Swal.fire({
      title: "Success!",
      text: success,
      icon: "success",
      confirmButtonText: "OK",
    });
  }

};
window.onload = handlePageLoad;
