<?php

$url = 'https://mangarock.com/manga/mrs-serie-115081';

$curlHandle = curl_init($url);

curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);

$data = curl_exec($curlHandle);

if (curl_errno($curlHandle) !== CURLE_OK) {
    throw new \Exception("Failed to load URL $url");
}

libxml_use_internal_errors(true);

$domDocument = new DOMDocument();
$domDocument->loadHTML($data);

//section#page-content article div.container div.row div.col-12.col-lg-8 div._2bD1y div.GRmHC table._1es70 tbody.ptmaY tr._2_j2_ td._3bNVU.col-9 a._2dU-m._1qbNn

$xpath = new DOMXPath($domDocument);

$elements = $xpath->query("//section[@id='page-content']/article" .
    "/div[contains(concat(' ', normalize-space(@class), ' '), ' container ')]" .
    "/div[contains(concat(' ', normalize-space(@class), ' '), ' row ')]" .
    // and contains(concat(' ', normalize-space(@class), ' '), ' col-lg-8 ')] This does not exist on page load, added via js
    "/div[contains(concat(' ', normalize-space(@class), ' '), ' col-12 ')"
);

var_dump($elements);

foreach ($elements as $element) {
    var_dump($element);
}
