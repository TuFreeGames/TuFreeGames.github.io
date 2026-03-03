const categoryButtons = document.querySelectorAll('button[data-category]');

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.category;
    alert(`下一步可建立 /category/${category} 的獨立 SEO 頁面（目前為示範）。`);
  });
});
