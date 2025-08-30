document.addEventListener('DOMContentLoaded', () => {
  const termsContainer = document.getElementById('terms-container');
  const monitoringContainer = document.getElementById('monitoring-container');
  const acceptButton = document.getElementById('accept-terms');

  acceptButton.addEventListener('click', () => {
      window.api.acceptTerms();
  });

  window.api.onMonitoringStarted(() => {
      termsContainer.style.display = 'none';
      monitoringContainer.style.display = 'block';
      updateAllStatuses('Active');
  });
});

function updateAllStatuses(status) {
  const services = ['hardware', 'activity', 'usb', 'file'];
  services.forEach(service => {
      const element = document.getElementById(`${service}-status`);
      if (element) {
          element.textContent = status;
          element.className = `status ${status.toLowerCase()}`;
      }
  });
}