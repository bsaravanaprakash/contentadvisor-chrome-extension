// content.js
// This script runs in the context of the web page and listens for messages from the popup.


(function() {
  
let form = '';
let current = '';
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getKevelModalValues') {
      function tryFindForm() {
        form = document.querySelector('.modal.fade.in .modal-body .modal-scroll-container form');
        let loginName = null;
        const strongElem = document.querySelector('strong[adzerk-logical-id="nav-login-name"]');
        if (strongElem) {
          loginName = strongElem.textContent.trim();
        }
        if (form) {
          current = form.getAttribute('current');
          sendResponse({ current, loginName });
        } else {
          sendResponse({ current: null, loginName, error: 'Form element not found after waiting' });
        }
      }
      tryFindForm();
      return true; // keep message channel open for async response
    }
    if (request.action === 'updateCtPrimaryImageDesktop') {
      // Try to find the input for ctPrimaryImageDesktop and set its value
      // Try by adzerk-logical-id first, then fallback to id
      if(form && current) {
          const textArea = form?.querySelector('input[adzerk-logical-id="custom-fields-input-ctPrimaryImageDesktop"]');
          const inputId = textArea?.id;
        const input = document.getElementById(inputId);
      if (input) {
        input.value = request.value;
        // Optionally, trigger input/change events if needed by the app
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    }
  });
})();
