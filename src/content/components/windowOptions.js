quickScrape.components.windowOptions = function (el) {
    this.collection = false;
    this.collectionCount = 0;

    this.reload = () => {
        el.innerHTML = `
    <div>
        <div class="qs-input">
            <label>Collection</label>
            <input type="checkbox" ${this.collection ? 'checked' : ''}>
            <div>(${this.collectionCount} item${this.collectionCount !== 1 ? 's' : ''})</div>
        </div>
    </div>`;
    };

    this.reload();
};