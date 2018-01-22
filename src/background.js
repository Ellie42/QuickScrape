if (chrome && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        let action = request.action.split('.');

        switch (action[0]) {
            case 'code':
                quickScrape.codeGeneration.handleCall(action, request, sendResponse);
                break;
        }
    })
}