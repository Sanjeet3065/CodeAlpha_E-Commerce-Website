(() => {
  const { initShell } = window.KoboUI;
  const { mountCatalog } = window.KoboCatalog;

  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get('category') || 'All';
  const initialQuery = params.get('q') || '';
  const initialSort = params.get('sort') || 'featured';

  const navKey = initialCategory === 'All' ? 'collection' : initialCategory.toLowerCase();

  initShell(navKey).then((state) => {
    if (state.user) {
      window.location.replace('/account.html');
      return;
    }

    const mountEl = document.getElementById('home-catalog-mount');
    mountCatalog(mountEl, {
      initialCategory,
      initialQuery,
      initialSort,
    });
  });
})();
