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

    this.tag = (t) => {
        tag = t;
    };

    this.class = (cl) => {
        addToAttributeString(`contains(concat(' ', normalize-space(@class), ' '), ' ${cl} ')`);
    };

    this.id = (id) => {
        addToAttributeString(`@id='${id}'`);
    };

    this.next = () => {
        let str = "";

        if(tag.length > 0){
            str = tag;
        }

        if(attributeString.length > 0){
            str += `[${attributeString}]`;
        }

        pushToQuery(str);
        tag = "";
        attributeString = "";
    };

    this.compile = () => {
        return query.join('\n');
    }
};