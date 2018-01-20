quickScrape.components.codeGenerationControls = function (parent) {
    function getGenerationData() {
        return {
            url: window.location.href,
            hierarchy: quickScrape.queryWindow.hierarchy.elements,
            attributes: quickScrape.queryWindow.elementInfo.getSelectedAttributes(),
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
            });
        });
    };

    this.reload();
};