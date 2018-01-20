quickScrape.overlay = {
    create(el) {
        let overlay = document.createElement("div");
        overlay.classList.add("qs-scraper-hover");

        let body = document.querySelector("body");
        let first = body.querySelector("*:first-child");

        body.insertBefore(overlay, first);

        if (typeof el !== 'undefined') {
            this.putOver(overlay, el);
        }

        return overlay;
    },
    putOver(overlay, element) {
        let elementRect = element.getBoundingClientRect();

        overlay.style.width = elementRect.width + "px";
        overlay.style.height = elementRect.height + "px";
        overlay.style.top = elementRect.top + window.scrollY + "px";
        overlay.style.left = elementRect.left + window.scrollX + "px";
    }
};