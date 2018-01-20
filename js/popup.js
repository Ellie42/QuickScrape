function init() {
    var scrapeButton = document.querySelector(".scrape-button");

    scrapeButton.addEventListener("mouseup", function (e) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "scrape.start"});
            window.close();
        });

        if (scrapeButton.classList.contains("running")) {
            scrapeButton.classList.remove("running");
        } else {
            scrapeButton.classList.add("running");
        }
    });
}

if (chrome && chrome.runtime) {
    init();
}