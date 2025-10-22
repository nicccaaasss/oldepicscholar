document.addEventListener('DOMContentLoaded', function() {
    const pages = document.querySelectorAll('.page');
    const indicators = document.querySelectorAll('.page-indicator');
    let currentPage = 0;

    function showPage(pageIndex) {
        pages.forEach((page, index) => {
            page.style.transform = `translateX(-${pageIndex * 100}%)`;
        });
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === pageIndex);
        });
        currentPage = pageIndex;
    }

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showPage(index);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
            if (currentPage < pages.length - 1) {
                showPage(currentPage + 1);
            } else {
                showPage(0); 
            }
        } else if (event.key === 'ArrowLeft') {
            if (currentPage > 0) {
                showPage(currentPage - 1);
            } else {
                showPage(pages.length - 1); 
            }
        }
    });

    showPage(currentPage);
});