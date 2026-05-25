document.addEventListener('DOMContentLoaded', function() {
    console.log("Spotlight Slideshow Script Loaded");

    const spotlightItems = document.querySelectorAll('.spotlight-item');
    const menuItems = document.querySelectorAll('.menu-list-item');
    
    console.log(`Found ${spotlightItems.length} spotlight items and ${menuItems.length} menu items.`);

    if (spotlightItems.length === 0 || menuItems.length === 0) {
        console.warn("No spotlight items or menu items found. Slideshow will not start.");
        return;
    }

    let currentIndex = 0;
    const intervalTime = 2500; // 2.5 秒輪播一張圖片

    function showSlide(index) {
        // Remove active class from all items
        spotlightItems.forEach(item => item.classList.remove('active'));
        menuItems.forEach(item => item.classList.remove('active'));

        // Add active class to current item
        if (spotlightItems[index]) {
            spotlightItems[index].classList.add('active');
        }
        if (menuItems[index]) {
            menuItems[index].classList.add('active');
            
            // Scroll menu item into view if needed
            menuItems[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }

    // Start the slideshow
    setInterval(() => {
        currentIndex = (currentIndex + 1) % spotlightItems.length;
        showSlide(currentIndex);
    }, intervalTime);
});
