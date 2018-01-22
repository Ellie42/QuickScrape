quickScrape.queryWindow = {
    queryWindow: null,
    overlays: [],
    currentSelector: null,

    elementsListElement: null,
    selectorInputElement: null,
    hierarchyElement: null,
    activeElement: null,

    options: null,
    elementInfo: null,
    codeGenerationControls: null,
    hierarchy: null,

    hitState: {
        current: 0,
        count: 0,
    },
    elements: [],
    createWindow: function () {
        this.queryWindow = document.createElement("div");
        this.queryWindow.classList.add("qs-query-window");

        this.queryWindow.innerHTML = `
            <div class="qs-window-titlebar">
                <div class="qs-window-title">
                    Query Window
                </div>
                <div class="qs-window-controls">
                    <div class="qs-window-control qs-window-control-close">
                        X
                    </div>
                </div>
            </div>
           
                
            <div class="qs-window-content">
                <div class="qs-window-left">
                    <div class="qs-window-elements-list">
                        <div class="qs-window-elements-list-prev">
                            <
                        </div>
                        <div class="qs-window-elements-list-status">
                        
                        </div>
                        <div class="qs-window-elements-list-next">
                            >
                        </div>
                    </div>

                    <div class="qs-window-selector">
                        <input type="text" readonly>
                    </div>
                    <div class="qs-window-hierarchy">
                                        
                    </div>
                </div>
                <div class="qs-window-right">
                    <div class="qs-window-options">
                    </div>
                    <div class="qs-window-right-section" data-section="element">
                        <div class="qs-element-info">
                            
                        </div>
                    </div>
                    <div class="qs-code-generation-controls">
                    
                    </div>
                </div>
            </div>

        `;

        let body = document.querySelector("body");
        let first = body.querySelector("*:first-child");

        body.insertBefore(this.queryWindow, first);

        this.hierarchyElement = this.queryWindow.querySelector(".qs-window-hierarchy");
        this.selectorInput = this.queryWindow.querySelector(".qs-window-selector input");
        this.elementsListElement = this.queryWindow.querySelector(".qs-window-elements-list-status");
        this.options = new quickScrape.components.windowOptions(this.queryWindow.querySelector(".qs-window-options"));
        this.elementInfo = new quickScrape.components.elementInfo(this.queryWindow.querySelector(".qs-element-info"));
        this.codeGenerationControls = new quickScrape.components.codeGenerationControls(
            this.queryWindow.querySelector(".qs-code-generation-controls"),
        );
    },
    changeSelection(change) {
        change = this.hitState.current + change;

        if (change < 0) {
            change = this.hitState.count - 1;
        } else if (change > this.hitState.count - 1) {
            change = 0;
        }

        this.activeElement = this.elements[change];
        this.hitState.current = change;
        this.reloadQueryWindow();
    },
    hide() {
        if (this.queryWindow === null) {
            return;
        }

        quickScrape.queryScraper.state.active = false;
        this.queryWindow.remove();
        this.clearOverlays();
        this.queryWindow = null;
    },
    showSideBar(name) {
        this.queryWindow.querySelectorAll(".qs-window-right-section").forEach((el) => {
            if (el.getAttribute('data-section') === name) {
                el.classList.remove("qs-hidden");
                return;
            }

            el.classList.add("qs-hidden");
        });
    },
    handleWindowEvents: function () {
        this.queryWindow.querySelector(".qs-window-control-close").addEventListener("mouseup", () => {
            this.hide();
        });

        this.queryWindow.querySelector(".qs-window-elements-list-prev").addEventListener("mouseup", () => {
            this.changeSelection(-1);
        });
        this.queryWindow.querySelector(".qs-window-elements-list-next").addEventListener("mouseup", () => {
            this.changeSelection(1);
        });
    },
    clearOverlays() {
        this.overlays.forEach((overlay) => {
            overlay.remove();
        });

        this.overlays = [];
    },
    updateSelectedElement(index) {
        if (typeof index === 'undefined') {
            index = this.hierarchy.getHierarchy().length - 1;
        }

        this.clearOverlays();

        this.elementsListElement.innerHTML = `
            ${this.hitState.current + 1} of ${this.hitState.count} hits
        `;

        let hierarchy = this.hierarchy.getHierarchy().slice(0, index + 1);

        let selector = quickScrape.selectorGenerator.generate(hierarchy);

        this.selectorInput.value = selector;
        this.currentSelector = selector;

        let elements = document.querySelectorAll(selector);

        this.options.collection = elements.length > 1;
        this.options.collectionCount = elements.length;

        this.elementInfo.reload(elements[0]);

        elements.forEach((el) => {
            this.overlays.push(quickScrape.overlay.create(el));
        });
    },
    reloadQueryWindow() {
        let hierarchy = [];
        let currentElement = this.activeElement;

        while (currentElement !== null && currentElement.tagName !== 'BODY') {
            hierarchy.push(currentElement);
            currentElement = currentElement.parentNode;
        }

        this.hierarchy = new quickScrape.components.elementHierarchy(this.hierarchyElement, hierarchy);

        this.updateSelectedElement();

        this.options.reload();
    },
    show() {
        if (this.queryWindow === null) {
            this.createWindow();
            this.handleWindowEvents();
        }

        this.elements = quickScrape.queryScraper.state.hover.elements;
        this.activeElement = this.elements[0];

        this.hitState.current = 0;
        this.hitState.count = this.elements.length;
        this.reloadQueryWindow();
        this.showSideBar("element");
    },
};