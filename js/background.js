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
quickScrape.codeGenPHP71 = function () {
    function getDataRetrievalString(attributes) {
        let str = ``;

        if (attributes.length === 0) {
            return "";
        }

        if (attributes.length === 1) {
            str = `$data[] = $element->getAttribute("${attributes[0]}");`;
        } else {
            let dataArray = ``;

            attributes.forEach(attr => {
                dataArray += `"${attr}" => $element->getAttribute("${attr}"),\n`;
            });

            str = `[
${dataArray.slice(0, -2)}
];`;
        }

        return str;
    }

    this.generate = data => {
        let { selector } = data;
        let splitSelector = quickScrape.selectorGenerator.splitSelector(selector);

        let xpath = new quickScrape.xPathQuery();

        splitSelector.forEach(selector => {
            if (selector.tag) {
                xpath.tag(selector.tag);
            }
            if (selector.id) {
                xpath.id(selector.id);
            }
            if (Array.isArray(selector.classes)) {
                selector.classes.forEach(cl => {
                    xpath.class(cl);
                });
            }

            xpath.next();
        });

        let xpathString = xpath.compile();
        let dataRetrievalString = getDataRetrievalString(data.attributes);

        console.log(dataRetrievalString);

        let helperFunctions = `<?php

function qsGetDomFromUrl($url)
{
    $curlHandle = curl_init($url);

    curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);

    $data = curl_exec($curlHandle);

    if (curl_errno($curlHandle) !== CURLE_OK) {
        throw new \\Exception("Failed to load URL $url");
    }

    libxml_use_internal_errors(true);

    $domDocument = new DOMDocument();
    $domDocument->loadHTML($data);

    return $domDocument;
}
`;

        let code = `try {
    $domDocument = qsGetDomFromUrl('http://mangafox.la/manga/eggnoid/');
} catch (Exception $e) {
    echo "Failed to load dom document: {$e->getCode()} - {$e->getMessage()}";
}

$xpath = new DOMXPath($domDocument);

$query = "
${xpathString}
";

$elements = $xpath->query($query);

$data = [];

foreach ($elements as $element) {
    ${dataRetrievalString}
}

//Code here! :)
`;
        return {
            helperFunctions,
            code
        };
    };
};
quickScrape.xPathQuery = function () {
    let query = [];
    let tag = "";
    let attributeString = "";

    function pushToQuery(string) {
        if (query.length === 0) {
            string = `//${string}`;
        } else {
            string = `/${string}`;
        }

        query.push(string);
    }

    function addToAttributeString(str) {
        if (attributeString.length > 0) {
            attributeString = `${str} and ${attributeString}`;
        } else {
            attributeString = str;
        }
    }

    this.tag = t => {
        tag = t;
    };

    this.class = cl => {
        addToAttributeString(`contains(concat(' ', normalize-space(@class), ' '), ' ${cl} ')`);
    };

    this.id = id => {
        addToAttributeString(`@id='${id}'`);
    };

    this.next = () => {
        let str = "";

        if (tag.length > 0) {
            str = tag;
        }

        if (attributeString.length > 0) {
            str += `[${attributeString}]`;
        }

        pushToQuery(str);
        tag = "";
        attributeString = "";
    };

    this.compile = () => {
        return query.join('\n');
    };
};
quickScrape.codeGeneration = {
    handleCall(action, { data }, sendResponse) {
        if (action[1] === 'generate') {
            let adapter;

            switch (data.language) {
                case "php71":
                    adapter = new quickScrape.codeGenPHP71();
            }

            let code = adapter.generate(data);

            sendResponse(code);
        }
    }
};
if (chrome && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        let action = request.action.split('.');

        switch (action[0]) {
            case 'code':
                quickScrape.codeGeneration.handleCall(action, request, sendResponse);
                break;
        }
    });
}