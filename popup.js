const hideElements = () => {
  document.getElementById("container").style.display = "none";
};
const showElements = () => {
  document.getElementById("container").style.display = "block";
};
window.onload = function () {
  const statusElement = document.getElementById("status");
  if (!chrome.tabs) {
    hideElements();
    statusElement.textContent =
      "Please refresh page and reopen extension. chrome.tabs API not available";
    return;
  }
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || !tabs[0]) {
      hideElements();
      statusElement.textContent =
        "Please refresh page and reopen extension. No active tab found";
      return;
    }
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getKevelModalValues" },
      function (response) {
        if (chrome.runtime.lastError) {
          hideElements();
          statusElement.textContent =
            "Please refresh page and reopen extension. Error: " +
            chrome.runtime.lastError.message;
        } else if (response && response.current !== undefined) {
          showElements();
          let adId = "";
          let zone = '';
          let primaryImageUrl = "";
          let adHeight = "";
          let adWidth = "";
          if (response.current) {
            adId = response.current.match(/:mapid\s+([0-9]+)/)?.[1] || "";
            zone = response.current.match(/:zone\s+"([^"]*)"/)?.[1] || '';
            adWidth =
              response.current.match(/:adtypewidth\s+([0-9]+)/)?.[1] || "";
            adHeight =
              response.current.match(/:adtypeheight\s+([0-9]+)/)?.[1] || "";
            primaryImageUrl =
              response.current.match(
                /:ctPrimaryImageDesktop\s+"([^"]*)"/,
              )?.[1] || "";
            statusElement.textContent =
              "Kevel Ad Modal data extracted. Ad ID: " +
              adId +
              ", Primary Image URL: " +
              primaryImageUrl;
          } else {
            hideElements();
            statusElement &&
              (statusElement.textContent = "Kevel Ad Modal must be opened.");
            return;
          }
          if (!adId && !zone) {
            hideElements();
            statusElement &&
              (statusElement.textContent =
                "Ad Id missing. Please create ad first and open modal and then reopen extension.");
            return;
          }

          const previewUrl = document.getElementById("previewUrl");
          previewUrl.href = `https://my.example.com/?previewAdId=${adId}`;
          previewUrl.textContent = `https://my.example.com/?previewAdId=${adId}`;
          
          // Pass loginName from response to asset selector
          const loginName = response.loginName || 'unknown';
          loadAssetSelectorPlugin(adHeight, adWidth, loginName);
        } else {
          hideElements();
          statusElement.textContent =
            "Kevel Ad Modal must be opened before using this extension.";
        }
      },
    );
  });
};
let selectedFile = null;

function setPopupSize(isLarge) {
  const body = document.body;
  const assetSelector = document.getElementById("asset-selector");
  if (isLarge) {
    body.style.width = "800px";
    if (assetSelector) {
      assetSelector.style.height = "700px";
      assetSelector.style.minWidth = "600px";
      assetSelector.style.minHeight = "600px";
    }
  } else {
    body.style.width = "500px";
    if (assetSelector) {
      assetSelector.style.height = "540px";
      assetSelector.style.minWidth = "";
      assetSelector.style.minHeight = "";
    }
  }
}

function loadAssetSelectorPlugin(adHeight, adWidth, loginName) {
  const container = document.getElementById("asset-selector");
  const statusDiv = document.getElementById("status");

  if (!container || !statusDiv) return;
  statusDiv.textContent = "Loading AEM Asset Selector...";

  // Show loading spinner/message in asset-selector container
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;">
      <div>
        <div class="spinner" style="margin:auto;width:40px;height:40px;border:4px solid #ccc;border-top:4px solid #1976d2;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <div style="margin-top:12px;text-align:center;color:#1976d2;font-weight:500;">Loading Asset Selector...</div>
      </div>
    </div>
    <style>
      @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
  `;

  // The assets-selector.js script is loaded statically via popup.html
  if (typeof window.PureJSSelectors === "undefined") {
    statusDiv.textContent = "❌ Asset Selector library not loaded";
    container.innerHTML = "";
    return;
  }

  statusDiv.textContent = "Connecting to your AEM instance...";

  // Log the loginName for debugging
  const props = {
    repositoryId: "",
    rail: false,
    imsToken: "", // will be set after fetch or cache
    selectionType: "single",
    rootPath:
      "/content/dam/apps/keveladvertising/advertising",
    hideTreeNav: false,
    dialogSize: "fullscreen",
    featureSet:["upload"],
    uploadConfig: {
      metadataSchema: [
            {
                mapToProperty: 'kevelAd:creatorName',
                value: loginName,
                element: 'hidden',
            },
        ],
    }
  };

  // Try to get token from sessionStorage
  let cachedToken = null;
  let cachedTokenExpiry = null;
  try {
    cachedToken = sessionStorage.getItem("aemToken");
    cachedTokenExpiry = sessionStorage.getItem("aemTokenExpiry");
  } catch (e) {}

  const now = Date.now();
  if (
    cachedToken &&
    cachedTokenExpiry &&
    now < parseInt(cachedTokenExpiry, 10)
  ) {
    props.imsToken = cachedToken;
    setupAssetSelector();
  } else {
    fetch(
      "https://**.adobeioruntime.net/api/v1/web/asset-selector-token/getToken",
    )
      .then((res) => res.json())
      .then((tokenData) => {
        props.imsToken = tokenData.imsToken || "";
        // Store in sessionStorage for 25 minutes (token lifetime is usually 30min)
        try {
          sessionStorage.setItem("aemToken", props.imsToken);
          sessionStorage.setItem(
            "aemTokenExpiry",
            (now + 25 * 60 * 1000).toString(),
          );
        } catch (e) {}
        setupAssetSelector();
      })
      .catch((err) => {
        statusDiv.textContent = "❌ Failed to fetch IMS token: " + err;
        container.innerHTML = "";
      });
  }

  function setupAssetSelector() {
    setPopupSize(true); // Enlarge popup for asset selector
    // Add handleSelection to get asset name when Select is clicked
    props.handleSelection = function (selectedAssets) {
      if (Array.isArray(selectedAssets) && selectedAssets.length > 0) {
        const assetName =
          selectedAssets[0].name || selectedAssets[0].title || "(no name)";
        // Print all required repo metadata fields
        const asset = selectedAssets[0];
        const dmUrl =
          asset["repo:scene7Domain"] +
          "is/image/" +
          asset["repo:scene7File"] +
          "?wid=" +
          adWidth +
          "&hei=" +
          adHeight +
          "&qlt=100";
        // Send message to content script to update :ctPrimaryImageDesktop
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (tabs && tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: "updateCtPrimaryImageDesktop",
                value: dmUrl,
              });
            }
          },
        );
        // Hide the asset-selector plugin after selection
        container.style.display = "none";
        setPopupSize(false); // Restore popup size
        // Show a success message and info for the user
        statusDiv.innerHTML = `<div style="color: #388e3c; font-weight: 600; margin-top: 18px; font-size: 1.1rem;">✅ Asset selected!<br>Image URL has been auto-populated into the Ad Modal Image field.<br><span style='font-size:0.95rem;color:#333;'>You can now review or save your changes in the Ad Modal.</span></div>`;
      } else {
        statusDiv.textContent = "No asset selected.";
      }
    };
    // Clear loading spinner before rendering selector
    container.innerHTML = "";
    window.PureJSSelectors.renderAssetSelector(container, props, function () {
      statusDiv.innerHTML = `<div style="color: #1976d2; font-weight: 500; margin-top: 18px; font-size: 1.05rem;">✅ Asset Selector ready!<br><span style='font-size:0.95rem;color:#333;'>Browse and select an asset. The image URL will be auto-filled in the Ad Modal after selection.</span></div>`;
    });
  }
}
