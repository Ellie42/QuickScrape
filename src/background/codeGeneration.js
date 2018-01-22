quickScrape.codeGeneration = {
    handleCall(action, {data}, sendResponse) {
        if (action[1] === 'generate') {
            let adapter;

            switch (data.language) {
                case "php71":
                    adapter = new quickScrape.codeGenPHP71();
            }

            let code = adapter.generate(data);

            sendResponse(code);
        }
    },
};