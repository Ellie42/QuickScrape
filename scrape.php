<?php

function qsGetDomFromUrl($url)
{
    $curlHandle = curl_init($url);

    curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);

    $data = curl_exec($curlHandle);

    if (curl_errno($curlHandle) !== CURLE_OK) {
        throw new \Exception("Failed to load URL $url");
    }

    libxml_use_internal_errors(true);

    $domDocument = new DOMDocument();
    $domDocument->loadHTML($data);

    return $domDocument;
}

try {
    $domDocument = qsGetDomFromUrl('http://mangafox.la/manga/eggnoid/');
} catch (Exception $e) {
    echo "Failed to load dom document: {$e->getCode()} - {$e->getMessage()}";
}

$xpath = new DOMXPath($domDocument);

$query = "
//div[@id='page']
/div[contains(concat(' ', normalize-space(@class), ' '), ' left ')]
/div[@id='chapters']
/ul[contains(concat(' ', normalize-space(@class), ' '), ' chlist ')]
/li
/div
/h3
/a[contains(concat(' ', normalize-space(@class), ' '), ' tips ')]
";

$elements = $xpath->query($query);

foreach ($elements as $element) {
    $href = $element->getAttribute("href");
    try {
        $domDocument = qsGetDomFromUrl("http:".$href);
        var_dump("http:".$href);
    } catch (Exception $e) {
        echo "Failed to load dom document: {$e->getCode()} - {$e->getMessage()}";
    }

    $xpath = new DOMXPath($domDocument);

    $query = "
        //div[@id='viewer']
        /div[contains(concat(' ', normalize-space(@class), ' '), ' read_img ')]
        /a
        /img[@id='image']
    ";

    $elements = $xpath->query($query);

    $data = [];

    foreach ($elements as $element) {
        $data[] = $element->getAttribute("src");
    }

    var_dump($elements);

}
