quickScrape.queryScraper = {
    overlay: null,
    state: {
        active: true,
        hidden: false,
        hover: {
            elements: []
        }
    },
    handleMouseMovement(e) {
        if (!this.state.active || this.overlay === null) {
            return;
        }

        let elements = document.elementsFromPoint(e.clientX, e.clientY)
            .filter(e => e.outerHTML !== this.overlay.outerHTML && !["BODY", "HTML"].includes(e.tagName));

        quickScrape.overlay.putOver(this.overlay, elements[0]);

        this.state.hover.elements = elements;
    },
    createScrapeOverlay() {
        this.overlay = quickScrape.overlay.create();
    },
    hideOverlay() {
        this.overlay.classList.add("qs-hidden");
    },
    showOverlay() {
        this.overlay.classList.remove("qs-hidden");
    },
    handleScrapeEvents(overlay) {
        document.addEventListener("keyup", (e) => {
            if (e.key === "Escape") {
                this.handleScrapeStateChange("stop");
            }
        });

        overlay.addEventListener("mouseup", (e) => {
            this.hideOverlay();
            quickScrape.queryWindow.show();
        })
    },
    handleScrapeStateChange(action) {
        if (action[1] === 'start') {
            this.state.active = true;
            quickScrape.queryWindow.hide();
            this.createScrapeOverlay();
            this.handleScrapeEvents(this.overlay);
            this.showOverlay();
        } else {
            chrome.extension.sendMessage({
                action: "scrape.stop"
            });

            this.overlay.remove();
            this.overlay = null;
            this.state.active = false;
        }
    },
    init() {
        chrome.extension.onMessage.addListener((request, sender, respond) => {
            let action = request.action.split('.');

            if (action[0] === 'scrape') {
                this.handleScrapeStateChange(action);
            }
        });

        document.addEventListener("mousemove", (e) => {
            this.handleMouseMovement(e);
        });
    }
};

