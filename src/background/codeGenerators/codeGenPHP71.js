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

    this.generate = (data) => {
        let {selector} = data;
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
            code,
        };
    };
};