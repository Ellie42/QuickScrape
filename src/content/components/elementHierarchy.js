quickScrape.components.elementHierarchy = function (parent, elements) {
    this.elements = elements.reverse();
    this.selected = this.elements.length - 1;

    let customHierarchy = [];

    function addListeners() {
        let steps = parent.querySelectorAll('.qs-window-hierarchy-step');

        steps.forEach((el) => {
            el.addEventListener('mouseup', (e) => {
                parent.querySelector(`.qs-window-hierarchy-step[data-index='${this.selected}']`)
                    .classList.remove("qs-hierarchy-step-selected");

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

    this.getElementAtIndex = (index) => {
        return this.getHierarchy()[index];
    };

    this.changeSelectorAtCurrent = (selector) => {
        let oldSelector = quickScrape.selectorGenerator.generateSingle(this.elements[this.selected]);

        if (selector === oldSelector) {
            delete(customHierarchy[this.selected]);
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

        this.elements.forEach((el) => {
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