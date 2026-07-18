class TagArgument {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    is(type) {
        return this.type === type;
    }

    equals(value) {
        return this.value === value;
    }

    toString() {
        return String(this.value);
    }

    check(type){
        if(this.type !== type) throw new Error(`Invalid argument type: Expected ${type}, got ${this.type}`);
    }

    static parse(value) {
        if (["reset", "override", "default", "keep", "end"].includes(value)) {
            return new TagArgument("specific", value);
        }

        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return new TagArgument("number", Number(value));
        }

        if (value === "true") {
            return new TagArgument("boolean", true);
        }

        if (value === "false") {
            return new TagArgument("boolean", false);
        }

        if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            return new TagArgument("color", new Color(value).toString());
        }

        if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(value)) {
            const [r, g, b] = value.split(",").map(Number);

            if (
                r >= 0 && r <= 255 &&
                g >= 0 && g <= 255 &&
                b >= 0 && b <= 255
            ) {
                return new TagArgument("color", new Color(r, g, b).toString());
            }

            throw new Error(`Invalid RGB color: ${value}`);
        }

        if (value.startsWith('"') && value.endsWith('"')) {
            return new TagArgument("string", value.slice(1, -1));
        }

        if (typeof value === "string") {
            return new TagArgument("string", value);
        }

        throw new Error(`Invalid value: ${value}`);
    }
}

export class SuperType {
    /**
     * 
     * @param {HTMLElement} target 
     */
    constructor(target, functions = {}) {
        this.data = null;
        this.header = null;
        this.body = null;
        this.pages = {
            root: []
        };
        this.target = target;
        this.state = {
            token: 0,
            pausedAt: 0,
            nextTime: performance.now(),
            paused: false,
            page: "root"
        }
    }

    paused(){
        return this.state.paused;
    }

    pause() {
        this.state.pausedAt = performance.now();
        this.state.paused = true;
    }

    resume() {
        const delta = performance.now() - this.state.pausedAt;
        this.state.nextTime += delta;   // shift the schedule forward
        this.state.paused = false;
    }

    start(page = "root") {
        this.state.page = page;
        this.state.token = 0;
        this.state.paused = false;
        this.state.nextTime = performance.now();

        requestAnimationFrame(this.render);
    }
    
    render = (now) => {
        if (this.state.paused) {
            requestAnimationFrame(this.render);
            return;
        }

        while (now >= this.state.nextTime) {
            const token = this.pages[this.state.page][this.state.token++];

            if (!token) return;

            this.process(token);
        }

        requestAnimationFrame(this.render);
    }

    process(token) {
        if(token.type === "character") {
            this.renderToken(token);
            return;
        }

        switch (token.name) {
            case "newline": {
                this.state.nextTime += this.header.newlineDelay;
                this.renderRaw("<br>");
            } break;

            case "linebreak": {
                this.state.nextTime += this.header.newlineDelay;
                this.renderRaw("<br><br>");
            } break;

            case "sleep": {
                token.args[0].check("number");
                this.state.nextTime += token.args[0].value;
            } break;
                
            default: {
                console.log(`Unknown tag type: ${token.name}`);
            }
        }
    }

    renderToken(token) {
        this.state.nextTime += this.header.customDelays[token.value] ?? this.header.charDelay;
        this.renderCharacter(token.value, token.style);
    }

    renderCharacter(text, style){
        let span = document.createElement("span");
        span.textContent = text;
        span.style.color = style.color;
        span.style.backgroundColor = style.bg;
        span.style.fontWeight = style.bold ? "bold" : "normal";
        span.style.fontStyle = style.italic ? "italic" : "normal";
        span.style.textDecoration = style.underline ? "underline" : "none";
        span.style.textDecoration += style.strikethrough ? " line-through" : "";

        this.target.appendChild(span);
    }

    renderRaw(html){
        this.target.innerHTML += html;
    }

    async load(path) {
        this.data = (await this.fetch(path)).replaceAll(/\{\{#[\s\S]*?#\}\}/g, "");

        const start = this.data.indexOf("typewriter");
        const open = this.data.indexOf("{", start);

        let depth = 1;
        let i = open + 1;

        while (i < this.data.length && depth > 0) {
            if (this.data[i] === "{") depth++;
            else if (this.data[i] === "}") depth--;
            i++;
        }

        // throw error if it doesnt have typewriter { ... }
        if (depth !== 0) {
            throw new Error("Invalid header");
        }
        
        let header = parseHeader(this.data.slice(start, i));

        if(header.parsed.typewriter === undefined){
            throw new Error("Header parsing failed: Missing 'typewriter' block");
        }

        if(header.errors.length > 0) {
            console.error("Header parsing errors:", header.errors);
            throw new Error(`Header parsing failed:\n${header.errors.map(e => e.message).join("\n")}`);
        }

        this.header = header.parsed.typewriter;
        this.body = this.data.slice(i).replaceAll(/\r?\n/g, '');

        if(this.header.charDelay === undefined) throw new Error("Missing charDelay in header");
        if(this.header.newlineDelay === undefined) throw new Error("Missing newlineDelay in header");
        if(this.header.textColor === undefined) throw new Error("Missing textColor in header");
        if(this.header.backgroundColor === undefined) throw new Error("Missing backgroundColor in header");

        if(this.header.customDelays === undefined) this.header.customDelays = {};
        if(this.header.instant === undefined) this.header.instant = false;
        if(this.header.completionBar === undefined) this.header.completionBar = false;

        this.tokens = this.tokenize(this.body)

        let currentPage = "root";

        for(let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];

            if(token.type === "tag" && token.name === "page") {
                if(token.args.length === 0) throw new Error(`Missing page name at token index ${i}`);
                
                // if(token.args[0].type !== "string") throw new Error(`Invalid page name at token index ${i}: Expected string, got ${token.args[0].type}`);

                if(token.args[0].type === "string"){
                    let pageName = token.args[0].value;

                    if(this.pages[pageName] !== undefined) throw new Error(`Duplicate page name at token index ${i}: ${pageName}`);


                    if(pageName === "root") throw new Error(`Invalid page name at token index ${i}: 'root' is reserved`);

                    if(this.pages[pageName] === undefined) {
                        this.pages[pageName] = [];
                    }

                    currentPage = pageName;
                }

                if(token.args[0].type === "specific"){
                    if(token.args[0].value === "end") currentPage = "root";
                    else throw new Error(`Invalid page name at token index ${i}: Expected String or end, got ${token.args[0].type}`);
                } 
            } else {
                if(token.type == "character") token.style = {
                    "color": this.header.textColor,
                    "bg": this.header.backgroundColor,
                    "bold": false,
                    "italic": false,
                    "underline": false,
                    "strikethrough": false
                }

                this.pages[currentPage].push(token);
            }
        }


        for(let page in this.pages) {
            let pageTokens = this.pages[page];
            let styleStack = {
                "bold": false,
                "italic": false,
                "underline": false,
                "strikethrough": false
            };

            for(let i = 0; i < pageTokens.length; i++) {
                const token = pageTokens[i];

                if(token.type === "style") {
                    if(token.value === "bold") styleStack.bold = !styleStack.bold;
                    if(token.value === "italic") styleStack.italic = !styleStack.italic;
                    if(token.value === "underline") styleStack.underline = !styleStack.underline;
                    if(token.value === "strikethrough") styleStack.strikethrough = !styleStack.strikethrough;

                    // remove this token from the pageTokens array
                    pageTokens.splice(i, 1);
                    i--;
                }

                if(token.type === "character") {
                    token.style = {
                        "bold": styleStack.bold,
                        "italic": styleStack.italic,
                        "underline": styleStack.underline,
                        "strikethrough": styleStack.strikethrough
                    }
                }
            }
        }

        return this;
    }

    tokenize(body) {
        const queue = [];

        let i = 0;

        while (i < body.length) {

            // escaped characters
            if (body[i] === "\\") {
                if (i + 1 < body.length) {
                    queue.push({
                        type: "character",
                        value: body[i + 1]
                    });

                    i += 2;
                    continue;
                }
            }


            // tag
            if (body[i] === "[") {
                const end = body.indexOf("]", i);

                if (end !== -1) {
                    const content = body.slice(i + 1, end).trim();

                    const parts = content.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];

                    const name = parts.shift();


                    const args = parts.map(arg => TagArgument.parse(arg));


                    queue.push({
                        type: "tag",
                        name,
                        args
                    });


                    i = end + 1;
                    continue;
                }
            }

            if(body[i] === "*") {
                queue.push({
                    type: "style",
                    value: "bold"
                });

                i++;
                continue;
            }

            if(body[i] === "_") {
                queue.push({
                    type: "style",
                    value: "underline"
                });

                i++;
                continue;
            }

            if(body[i] === "-") {
                queue.push({
                    type: "style",
                    value: "strikethrough"
                });

                i++;
                continue;
            }

            if(body[i] === "/") {
                queue.push({
                    type: "style",
                    value: "italic"
                });

                i++;
                continue;
            }



            queue.push({
                type: "character",
                value: body[i]
            });

            i++;
        }

        return queue;
    }

    async fetch(path) {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`Failed to fetch ${path}: ${response.status}`);
        }

        return await response.text();
    }
}

function getContext() {
    return "wtf"
}

class Color {
    constructor(a, b, c) {
        if (b === undefined && c === undefined) {
            // Hex constructor
            this.hex = a;
        } else {
            // RGB constructor
            let r = parseInt(a).toString(16).padStart(2, "0");
            let g = parseInt(b).toString(16).padStart(2, "0");
            let bValue = parseInt(c).toString(16).padStart(2, "0");

            this.hex = `#${r}${g}${bValue}`;
        }
    }

    toString() {
        return this.hex;
    }
}

function parseValue(value){
    if(["reset", "override", "default", "keep", "end"].includes(value)) return {type: "specific", value}

    if (/^-?\d+(\.\d+)?$/.test(value)) {
        return {type: "number", value: Number(value)};
    }

    // boolean
    if (value === "true") {
        return {type: "boolean", value: true};
    }

    if (value === "false") {
        return {type: "boolean", value: false};
    }


    // hex color
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        return {type: "color", value: new Color(value).toString()};
    }


    // RGB color
    if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(value)) {
        const [r, g, b] = value.split(/,/).map(Number);

        if (
            r >= 0 && r <= 255 &&
            g >= 0 && g <= 255 &&
            b >= 0 && b <= 255
        ) {
            return {type: "color", value: new Color(r, g, b).toString()};
        }

        throw new Error(`Invalid RGB color: ${value}`);
        return null;
    }


    // string
    if (value.startsWith('"') && value.endsWith('"')) {
        return {type: "string", value: value.slice(1, -1)};
    }

    if(typeof value === "string") return {type: "string", value: value.slice(1, -1)};

    throw new Error(`Invalid value: ${value}`);
}

function parseHeader(blockContent) {
    const lines = blockContent.split(/\r?\n/);

    const result = {};
    const stack = [result];

    let errors = [];

    const addError = (line, col, message) => {
        errors.push({
            line,
            col,
            message,
            context: lines[line] ?? ""
        });
    };


    const parseKey = (key) => {
        key = key.trim().replace(/^"|"$/g, "");

        if (/^-?\d+(\.\d+)?$/.test(key)) {
            return Number(key);
        }

        return key;
    };

    const parseValue = (value, lineIdx, colIdx) => {
        value = value.trim();

        // number
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return Number(value);
        }


        // boolean
        if (value === "true") {
            return true;
        }

        if (value === "false") {
            return false;
        }


        // hex color
        if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            return new Color(value).toString();
        }


        // RGB color
        if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(value)) {
            const [r, g, b] = value.split(/,/).map(Number);

            if (
                r >= 0 && r <= 255 &&
                g >= 0 && g <= 255 &&
                b >= 0 && b <= 255
            ) {
                return new Color(r, g, b).toString();
            }

            addError(lineIdx, colIdx, `Invalid RGB color: ${value}`);
            return null;
        }


        // string
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }


        addError(lineIdx, colIdx, `Invalid value: ${value}`);
        return null;
    };


    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) continue;


        // closing block
        if (line === "}") {
            if (stack.length > 1) {
                stack.pop();
            } else {
                addError(i, 0, "Unexpected '}'");
            }

            continue;
        }


        const match = line.match(/^(?:"([^"]+)"|([^:]+))\s*:\s*(.*)$/);

        if (!match) {
            addError(i, 0, `Invalid syntax: "${line}"`);
            continue;
        }


        const key = parseKey(match[1] ?? match[2]);
        const value = match[3].trim();


        // object start
        if (value === "{") {
            const obj = {};

            stack[stack.length - 1][key] = obj;

            stack.push(obj);

            continue;
        }


        const keyText = match[1] ?? match[2];

        const parsed = parseValue(
            value,
            i,
            keyText.length + 1
        );

        if (parsed !== null) {
            stack[stack.length - 1][key] = parsed;
        }
    }


    if (stack.length > 1) {
        addError(
            lines.length,
            0,
            "Missing closing '}'"
        );
    }


    return {
        parsed: result,
        errors
    };
}