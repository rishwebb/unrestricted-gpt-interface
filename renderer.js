const webview = document.getElementById('web-view');
const btnClose = document.getElementById('btn-close');
const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClearNow = document.getElementById('btn-clear-now');
const loadingBar = document.getElementById('loading-bar');
const toastContainer = document.getElementById('toast-container');

let webviewReady = false;

// Window Controls
btnClose.addEventListener('click', () => {
  window.gptPro.close();
});

btnMinimize.addEventListener('click', () => {
  window.gptPro.minimize();
});

btnMaximize.addEventListener('click', () => {
  window.gptPro.maximize();
});

// Toast Notification Helper (safe DOM construction, no innerHTML interpolation)
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = type === 'error' ? 'toast toast-error' : 'toast';

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'toast-icon';

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  if (type === 'error') {
    const circle = document.createElementNS(svgNs, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    const line1 = document.createElementNS(svgNs, 'line');
    line1.setAttribute('x1', '15');
    line1.setAttribute('y1', '9');
    line1.setAttribute('x2', '9');
    line1.setAttribute('y2', '15');
    const line2 = document.createElementNS(svgNs, 'line');
    line2.setAttribute('x1', '9');
    line2.setAttribute('y1', '9');
    line2.setAttribute('x2', '15');
    line2.setAttribute('y2', '15');
    svg.append(circle, line1, line2);
  } else {
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14');
    const polyline = document.createElementNS(svgNs, 'polyline');
    polyline.setAttribute('points', '22 4 12 14.01 9 11.01');
    svg.append(path, polyline);
  }

  iconWrapper.appendChild(svg);

  const label = document.createElement('span');
  label.textContent = message;

  toast.append(iconWrapper, label);
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }, 3000);
}

// Clear site storage & reload uncensored.chat
async function clearStorageAndRefresh() {
  try {
    showToast('Clearing site data for uncensored.chat...');

    const res = await window.gptPro.clearSiteData();

    if (res.success) {
      showToast('Site data cleared! Reloading page...');
      if (webviewReady) {
        webview.reload();
      } else {
        webview.src = 'https://uncensored.chat/';
      }
    } else {
      showToast(`Error clearing storage: ${res.error}`, 'error');
    }
  } catch (err) {
    console.error('Clear storage error:', err);
    showToast('Failed to clear site data.', 'error');
  }
}

// Red "Clear Site Data" button
btnClearNow.addEventListener('click', () => {
  clearStorageAndRefresh();
});

// Loading Bar & Error Handlers
webview.addEventListener('dom-ready', () => {
  webviewReady = true;
});

webview.addEventListener('did-start-loading', () => {
  loadingBar.style.width = '35%';
});

webview.addEventListener('did-stop-loading', () => {
  loadingBar.style.width = '100%';
  setTimeout(() => {
    loadingBar.style.width = '0%';
  }, 300);
});

webview.addEventListener('did-fail-load', (event) => {
  // Ignore -3 (ERR_ABORTED) triggered by normal redirects or reloads
  if (event.errorCode === -3 || !event.isMainFrame) return;
  loadingBar.style.width = '0%';
  showToast(`Failed to load page (${event.errorDescription || 'Network error'})`, 'error');
});
