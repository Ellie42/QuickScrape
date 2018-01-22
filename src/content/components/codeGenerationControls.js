quickScrape.components.codeGenerationControls = function (parent) {
    function copyText(text){
        function selectElementText(element) {
            if (document.selection) {
                var range = document.body.createTextRange();
                range.moveToElementText(element);
                range.select();
            } else if (window.getSelection) {
                var range = document.createRange();
                range.selectNode(element);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
            }
        }
        var element = document.createElement('DIV');
        element.style.whiteSpace = 'pre';
        element.textContent = text;
        document.body.appendChild(element);
        selectElementText(element);
        document.execCommand('copy');
        element.remove();
    }

    function getGenerationData() {
        return {
            url: window.location.href,
            selector: quickScrape.queryWindow.currentSelector,
            attributes: quickScrape.queryWindow.elementInfo.getSelectedAttributes(),
            language: parent.querySelector(".qs-code-generation-buttons > select").value,
        };
    }

    this.reload = function () {
        parent.innerHTML = `
            <div class="qs-code-generation-buttons">
                <select>
                    <option value="php71">PHP 7.1</option>    
                </select>
                <button class="qs-code-generate-button">
                    Generate
                </button>
            </div>
        `;

        parent.querySelector('.qs-code-generate-button').addEventListener('mouseup', (e) => {
            let data = getGenerationData();
            chrome.runtime.sendMessage({
                action: 'code.generate',
                data,
            }, (code) => {
                copyText(code.helperFunctions + '\n' + code.code);
                alert("Copied code to clipboard :)");
            });
        });
    };

    this.reload();
};