quickScrape.selectorGenerator = {
    config: {
        collection: false,
    },
    getBestClasses(el) {
        let classes = [];

        for (let i = 0; i < el.classList.length; i++) {
            classes.push(el.classList[i]);
        }

        return classes;
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
    },
};