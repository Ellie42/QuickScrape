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

        if(typeof currentElement !== 'string'){
            currentSelector = quickScrape.selectorGenerator.generateSingle(currentElement);
        }

        let selector = quickScrape.selectorGenerator.generate(
            quickScrape.queryWindow.hierarchy.getHierarchy(),
            [selected],
        );

        let alternativeTags = {};

        let allElements = document.querySelectorAll(selector);
        let numberOfSteps = quickScrape.queryWindow.hierarchy.getHierarchy().length - (selected + 1);

        alternativeTags["*"] = allElements.length;

        allElements.forEach((el) => {
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

        alternatives.forEach((el) => {
            el.addEventListener('mouseup', (e) => {
                parent.querySelector(".qs-hierarchy-alternative.qs-hierarchy-alternative-selected")
                    .classList.remove("qs-hierarchy-alternative-selected");

                e.currentTarget.classList.add("qs-hierarchy-alternative-selected");

                quickScrape.queryWindow.hierarchy.changeSelectorAtCurrent(
                    e.currentTarget.getAttribute("data-selector"),
                );
            });
        });
    }

    this.reload = (el) => {
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
        return [].slice.apply(parent.querySelectorAll('.qs-element-attribute input[type=checkbox]')).filter((el) => {
            return el.checked;
        }).map(el => el.getAttribute("name"));
    };
};