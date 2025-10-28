(() => {
  const bannerId = 'linkedin-games-bot-banner';
  if (document.getElementById(bannerId)) {
    return;
  }

  const banner = document.createElement('div');
  banner.id = bannerId;
  banner.textContent = 'LinkedIn Games Bot is active (placeholder).';
  banner.style.position = 'fixed';
  banner.style.bottom = '24px';
  banner.style.right = '24px';
  banner.style.padding = '12px 16px';
  banner.style.background = '#0a66c2';
  banner.style.color = '#fff';
  banner.style.fontFamily = 'Arial, sans-serif';
  banner.style.borderRadius = '8px';
  banner.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
  banner.style.zIndex = '2147483647';

  const close = document.createElement('button');
  close.textContent = 'Dismiss';
  close.style.marginLeft = '12px';
  close.style.background = '#fff';
  close.style.color = '#0a66c2';
  close.style.border = 'none';
  close.style.padding = '6px 12px';
  close.style.borderRadius = '4px';
  close.style.cursor = 'pointer';
  close.addEventListener('click', () => banner.remove());

  banner.appendChild(close);
  document.body.appendChild(banner);
})();
