quickScrape = {
    components: {}
};
quickScrape.selectorGenerator = {
    config: {
        collection: false
    },
    getBestClasses(el) {
        let classes = [];

        for (let i = 0; i < el.classList.length; i++) {
            classes.push(el.classList[i]);
        }

        return classes;
    },
    splitSelector(selector) {
        let data = [];
        let regex = /(\w+)(?:#(\w+))?(?:\.([\w\.]+))?/g;
        let match = regex.exec(selector);

        while (match) {
            let classes;

            if (typeof match[3] !== 'undefined') {
                classes = match[3].split('.');
            }

            data.push({
                tag: match[1],
                id: match[2],
                classes: classes
            });

            match = regex.exec(selector);
        }

        return data;
    },
    generateSingleAttrSelector(el) {
        let selector = "";
        let isId = false;

        if (el.id !== "") {
            selector += `#${el.id}`;
        } else {
            selector += this.getBestClasses(el).reduce((prev, cl) => {
                return `${prev}.${cl}`;
            }, "");
        }

        return [selector, isId];
    },
    generateSingle(el) {
        return el.tagName.toLowerCase() + this.generateSingleAttrSelector(el)[0];
    },
    //TODO Fix when selecting an element in the hierarchy above the ID root not creating the query correctly
    generate(hierarchy, wildcardIndexes) {
        let firstId = null;
        //Individual Selectors
        let iSelectors = [];

        if (typeof wildcardIndexes === 'undefined') {
            wildcardIndexes = [];
        }

        hierarchy.forEach((el, index) => {
            if (wildcardIndexes.includes(index)) {
                let selector = "*";
                if (index > 0) {
                    selector = "> " + selector;
                }
                iSelectors[index] = selector;
                return;
            }

            if (typeof el === 'string') {
                iSelectors[index] = el;
                return;
            }

            [selector, isId] = this.generateSingleAttrSelector(el);

            if (isId) {
                firstId = index;
            }

            iSelectors[index] = el.tagName.toLowerCase() + selector;
        });

        if (firstId !== null) {
            iSelectors = iSelectors.slice(firstId);
        }

        return iSelectors.reduce((prev, sel) => `${prev} ${sel}`, "").slice(1);
    }
};
quickScrape.components.codeGenerationControls = function (parent) {
    function copyText(text) {
        function selectElementText(element) {
            if (document.selection) {
                var range = document.body.createTextRange();
                range.moveToElementText(element);
                range.select();
            } else if (window.getSelection) {
                var range = document.createRange();
                range.selectNode(element);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
            }
        }
        var element = document.createElement('DIV');
        element.style.whiteSpace = 'pre';
        element.textContent = text;
        document.body.appendChild(element);
        selectElementText(element);
        document.execCommand('copy');
        element.remove();
    }

    function getGenerationData() {
        return {
            url: window.location.href,
            selector: quickScrape.queryWindow.currentSelector,
            attributes: quickScrape.queryWindow.elementInfo.getSelectedAttributes(),
            language: parent.querySelector(".qs-code-generation-buttons > select").value
        };
    }

    this.reload = function () {
        parent.innerHTML = `
            <div class="qs-code-generation-buttons">
                <select>
                    <option value="php71">PHP 7.1</option>    
                </select>
                <button class="qs-code-generate-button">
                    Generate
                </button>
            </div>
        `;

        parent.querySelector('.qs-code-generate-button').addEventListener('mouseup', e => {
            let data = getGenerationData();
            chrome.runtime.sendMessage({
                action: 'code.generate',
                data
            }, code => {
                copyText(code.helperFunctions + '\n' + code.code);
                alert("Copied code to clipboard :)");
            });
        });
    };

    this.reload();
};
quickScrape.components.elementHierarchy = function (parent, elements) {
    this.elements = elements.reverse();
    this.selected = this.elements.length - 1;

    let customHierarchy = [];

    function addListeners() {
        let steps = parent.querySelectorAll('.qs-window-hierarchy-step');

        steps.forEach(el => {
            el.addEventListener('mouseup', e => {
                parent.querySelector(`.qs-window-hierarchy-step[data-index='${this.selected}']`).classList.remove("qs-hierarchy-step-selected");

                this.selected = parseInt(e.currentTarget.getAttribute("data-index"));
                e.currentTarget.classList.add("qs-hierarchy-step-selected");

                quickScrape.queryWindow.updateSelectedElement(this.selected);
            });
        });
    }

    this.reload = () => {
        let hierarchy = this.getHierarchy().reduce((prev, el, index) => {
            let classList = '';
            let tag = el;

            if (typeof el !== 'string') {
                tag = el.tagName.toLowerCase();

                if (el.id !== "") {
                    classList += `<div>#${el.id}</div>`;
                }

                for (let i = 0; i < el.classList.length; i++) {
                    classList += `<div>.${el.classList[i]}</div>`;
                }
            }

            return `${prev}<div class="qs-window-hierarchy-step ${this.selected === index ? 'qs-hierarchy-step-selected' : ''}" data-index="${index}">
                ${tag}
                <div class="qs-window-hierarchy-classes">
                    ${classList}
                </div>
            </div>`;
        }, "");

        parent.innerHTML = hierarchy;

        addListeners.call(this);
    };

    this.getElementAtIndex = index => {
        return this.getHierarchy()[index];
    };

    this.changeSelectorAtCurrent = selector => {
        let oldSelector = quickScrape.selectorGenerator.generateSingle(this.elements[this.selected]);

        if (selector === oldSelector) {
            delete customHierarchy[this.selected];
            this.reload();
            quickScrape.queryWindow.updateSelectedElement(this.selected);
            return;
        }

        customHierarchy[this.selected] = selector;

        let newSelector = quickScrape.selectorGenerator.generate(this.getHierarchy());

        let newBase = document.querySelector(newSelector);

        quickScrape.queryWindow.activeElement = newBase;

        this.reload();
        quickScrape.queryWindow.updateSelectedElement(this.selected);
    };

    this.getHierarchy = () => {
        let hierarchy = [];

        this.elements.forEach(el => {
            hierarchy.push(el);
        });

        customHierarchy.forEach((custom, index) => {
            if (!custom) {
                return;
            }

            hierarchy[index] = custom;
        });

        return hierarchy;
    };

    this.reload();
};
quickScrape.components.elementInfo = function (parent) {
    let currentElement = null;
    let defaultSelected = false;

    function shouldElementAttributeBeChecked(name, value) {
        if (currentElement.tagName === 'A' && name.toLowerCase() === 'href') {
            defaultSelected = true;
            return true;
        }

        if (currentElement.tagName === 'IMG' && name === 'src') {
            defaultSelected = true;
            return true;
        }

        if (name === 'innerText' && !defaultSelected) {
            return true;
        }

        return false;
    }

    function generateAttributeRow(name, value) {
        let checked = shouldElementAttributeBeChecked(name, value);

        let html = `
                <tr class="qs-element-attribute">
                    <td class="qs-element-attribute-name">
                        ${name}
                    </td>
                    <td class="qs-element-attribute-value">
                        ${value}
                    </td>
                    <td>
                        <input type="checkbox" ${checked ? 'checked' : ''} name="${name}">
                    </td>
                </tr>
            `;

        return html;
    }

    function getElementAttributeHtml() {
        let html = "";

        for (let i = 0; i < currentElement.attributes.length; i++) {
            let attr = currentElement.attributes[i];

            html += generateAttributeRow(attr.nodeName, attr.nodeValue);
        }

        let innerText = currentElement.innerText;

        if (innerText.length > 50) {
            innerText = innerText.slice(0, 50) + "...";
        }

        html += generateAttributeRow('innerText', innerText);

        return html;
    }

    function getElementHierarchyAlternativeHTML() {
        let html = ``;
        let selected = quickScrape.queryWindow.hierarchy.selected;
        let currentElement = quickScrape.queryWindow.hierarchy.getElementAtIndex(selected);
        let currentSelector = currentElement;

        if (typeof currentElement !== 'string') {
            currentSelector = quickScrape.selectorGenerator.generateSingle(currentElement);
        }

        let selector = quickScrape.selectorGenerator.generate(quickScrape.queryWindow.hierarchy.getHierarchy(), [selected]);

        let alternativeTags = {};

        let allElements = document.querySelectorAll(selector);
        let numberOfSteps = quickScrape.queryWindow.hierarchy.getHierarchy().length - (selected + 1);

        alternativeTags["*"] = allElements.length;

        allElements.forEach(el => {
            let currentParent = el;

            for (let i = 0; i < numberOfSteps; i++) {
                currentParent = currentParent.parentNode;
            }

            let tag = quickScrape.selectorGenerator.generateSingle(currentParent);

            if (typeof alternativeTags[tag] === 'undefined') {
                alternativeTags[tag] = 0;
            }

            alternativeTags[tag]++;
        });

        Object.entries(alternativeTags).forEach(entry => {
            html += `
                <div data-selector="${entry[0]}" 
                    class="qs-hierarchy-alternative ${currentSelector === entry[0] ? 'qs-hierarchy-alternative-selected' : ''}">
                    ${entry[0]} (${entry[1]})
                </div>
           `;
        });

        return html;
    }

    function addListeners() {
        let alternatives = parent.querySelectorAll(".qs-hierarchy-alternative");

        alternatives.forEach(el => {
            el.addEventListener('mouseup', e => {
                parent.querySelector(".qs-hierarchy-alternative.qs-hierarchy-alternative-selected").classList.remove("qs-hierarchy-alternative-selected");

                e.currentTarget.classList.add("qs-hierarchy-alternative-selected");

                quickScrape.queryWindow.hierarchy.changeSelectorAtCurrent(e.currentTarget.getAttribute("data-selector"));
            });
        });
    }

    this.reload = el => {
        currentElement = el;
        defaultSelected = false;

        let elementAttributeHTML = getElementAttributeHtml();
        let elementHierarchyAlternativeHTML = getElementHierarchyAlternativeHTML();

        parent.innerHTML = `
            <div class="qs-element-info-basic">
                <div>
                    <span class="qs-element-bold">Tag</span>: ${el.tagName.toLowerCase()}
                </div>
            </div>
            <table class="qs-element-info-attributes">
                <thead>
                    <tr>
                        <th>Attr</th>
                        <th>Value</th>
                        <th>Get</th>
                    </tr>
                </thead>
                <tbody>
                    ${elementAttributeHTML}
                </tbody>
            </table>
            <div class="qs-hierarchy-info">
                <span class="qs-element-bold">
                    Alternatives
                </span>
                <div class="qs-hierarchy-alternatives">
                    ${elementHierarchyAlternativeHTML}
                </div>
            </div>
        `;

        addListeners();
    };

    this.getSelectedAttributes = () => {
        return [].slice.apply(parent.querySelectorAll('.qs-element-attribute input[type=checkbox]')).filter(el => {
            return el.checked;
        }).map(el => el.getAttribute("name"));
    };
};
quickScrape.components.windowOptions = function (el) {
    this.collection = false;
    this.collectionCount = 0;

    this.reload = () => {
        el.innerHTML = `
    <div>
        <div class="qs-input">
            <label>Collection</label>
            <input type="checkbox" ${this.collection ? 'checked' : ''}>
            <div>(${this.collectionCount} item${this.collectionCount !== 1 ? 's' : ''})</div>
        </div>
    </div>`;
    };

    this.reload();
};
quickScrape.dragger = {};
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

        let elements = document.elementsFromPoint(e.clientX, e.clientY).filter(e => e.outerHTML !== this.overlay.outerHTML && !["BODY", "HTML"].includes(e.tagName));

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
        document.addEventListener("keyup", e => {
            if (e.key === "Escape") {
                this.handleScrapeStateChange("stop");
            }
        });

        overlay.addEventListener("mouseup", e => {
            this.hideOverlay();
            quickScrape.queryWindow.show();
        });
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

        document.addEventListener("mousemove", e => {
            this.handleMouseMovement(e);
        });
    }
};
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
        count: 0
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
        this.codeGenerationControls = new quickScrape.components.codeGenerationControls(this.queryWindow.querySelector(".qs-code-generation-controls"));
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
        this.queryWindow.querySelectorAll(".qs-window-right-section").forEach(el => {
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
        this.overlays.forEach(overlay => {
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

        elements.forEach(el => {
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
    }
};

if (chrome && chrome.runtime) {
    quickScrape.queryScraper.init.call(quickScrape.queryScraper);
}