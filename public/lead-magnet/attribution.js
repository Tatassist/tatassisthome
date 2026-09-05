// Preserve campaign context between the guide and product pages.
// Never copy email addresses or other arbitrary query parameters into analytics or links.
(() => {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'];
  const source = new URL(window.location.href);
  document.querySelectorAll('a[data-attribution]').forEach((link) => {
    try {
      const target = new URL(link.getAttribute('href'), window.location.origin);
      if (!['http:', 'https:'].includes(target.protocol)) return;
      keys.forEach((key) => {
        const value = source.searchParams.get(key);
        if (value && value.length <= 200 && !target.searchParams.has(key)) target.searchParams.set(key, value);
      });
      link.href = target.href;
    } catch {
      // Attribution must never prevent navigation or access to the guide.
    }
  });
})();
