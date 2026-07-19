class TagArgument {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    // type check, does not error
    is(type) {
        return this.type === type;
    }

    // value check, does not error
    equals(value) {
        return this.value === value;
    }

    // specific value check, does not error
    equalsSpecific(value) {
        return this.type === "specific" && this.value === value;
    }

    // type check, throws error if not type
    check(type){
        if(this.type !== type) throw new Error(`Invalid argument type: Expected ${type}, got ${this.type}`);
    }

    // specific value check, throws error if not specific or not equal to value
    checkSpecific(value){
        if(this.type !== "specific") throw new Error(`Invalid argument type: Expected specific, got ${this.type}`);
        if(this.value !== value) throw new Error(`Invalid argument value: Expected ${value}, got ${this.value}`);
    }

    toString() {
        return String(this.value);
    }

    static parse(value) {
        if (SuperType.specificTypes.includes(value)) {
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

    static randomCharacters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "!", "@", "#", "$", "%", "&", "\\", "<", ">", "?"];

    static randomCharacter() {
        return SuperType.randomCharacters[Math.floor(Math.random() * SuperType.randomCharacters.length)];
    }

    static specificTypes = ["reset", "override", "default", "keep", "end", "instant", "separate"];

    static defaultScrollCount = 6;

    glitchLoop = () => {
        for (const span of this.state.glitches) {
            span.textContent = SuperType.randomCharacter();
        }

        requestAnimationFrame(this.glitchLoop);
    }

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
        this.functions = new Map();

        for (const [name, func] of Object.entries(functions)) {
            if (typeof func !== "function") {
                throw new Error(`Invalid function for ${name}: Expected function, got ${typeof func}`);
            }

            this.functions.set(name, func);
        }

        const div = document.createElement("div");
        div.classList.add("supertype");
        target.appendChild(div);

        this.target = div;

        this.state = {
            token: 0,
            pausedAt: 0,
            nextTime: performance.now(),
            paused: false,
            page: "root",
            glitches: [],
            scrollCount: 0,

            tagSpeedOverride: false,
            userSpeedOverride: null,

            defaultCharDelay: null,
            defaultNewlineDelay: null,
            currentColor: null,
            currentBg: null,
            fragment: null
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
        if(this.header.previewMode === true) this.header.instant = true;

        this.state.page = page;
        this.state.token = 0;
        this.state.paused = false;
        this.state.nextTime = performance.now();
        this.state.tagSpeedOverride = false;
        this.state.scrollCount = 0;
        // if page is reset, then clear glitches
        // this.state.glitches = [];
        this.state.defaultCharDelay = new Number(this.header.charDelay);
        this.state.defaultNewlineDelay = new Number(this.header.newlineDelay);

        this.state.currentColor = new String(this.header.textColor);
        this.state.currentBg = new String(this.header.backgroundColor);

        this.fragment = null;

        requestAnimationFrame(this.render);
        requestAnimationFrame(this.glitchLoop);
    }

    appendToTarget(element) {
        this.state.fragment.appendChild(element);
    }

    render = (now) => {
        if (this.state.paused) {
            requestAnimationFrame(this.render);
            return;
        }

        const fragment = document.createDocumentFragment();
        this.state.fragment = fragment;


        let processed = 0;

        while (now >= this.state.nextTime && (processed < 200 || this.header.instant)) {
            const token = this.pages[this.state.page][this.state.token++];

            if (!token) break;

            this.process(token);
            processed++;
        }

        if (fragment.childNodes.length) {
            this.target.appendChild(fragment);
        }

        requestAnimationFrame(this.render);
    }

    addRenderTime(ms){
        if(this.header.instant) return;
        if (this.state.userSpeedOverride !== null) {
            ms = this.state.userSpeedOverride;
        }

        this.state.nextTime += ms;
    }

    process(token) {
        if (this.state.scrollCount > 0) {
            this.state.scrollCount--;

            requestAnimationFrame(() => {
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: "instant"
                });
            });
        }

        if(token.type === "character") {
            this.renderToken(token);
            return;
        }

        switch (token.name) {

            // case "start"

            case "removelast": {
                let count = token.args[0];

                if(count === undefined) throw new Error("Missing removelast count");
                count.check("number");

                // remove the last count rendered characters from the target
                let removed = 0;

                for (let i = this.target.childNodes.length - 1; i >= 0 && removed < count.value; i--) {
                    const node = this.target.childNodes[i];
                    
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
                        this.target.removeChild(node);
                        removed++;
                    }
                }


            } break;

            case "custom": {
                let name = token.args[0];
                let delay = token.args[1];

                if(name === undefined) throw new Error("Missing custom tag name");
                if(delay === undefined) throw new Error("Missing custom tag delay");

                name.check("string");
                delay.check("number");

                this.header.customDelays[name.value] = delay.value;
            } break;

            case "customremove": {
                let name = token.args[0];
                if(name === undefined) throw new Error("Missing custom tag name");
                name.check("string");

                if(this.header.customDelays[name.value] === undefined) throw new Error(`Custom tag not found: ${name.value}`);

                delete this.header.customDelays[name.value];
            } break;

            case "function": {
                const funcName = token.args[0];
                if(funcName === undefined) throw new Error("Missing function name");
                funcName.check("string");

                const func = this.functions.get(funcName.value);

                if(!func) throw new Error(`Function not found: ${funcName.value}`);

                this.state.scrollCount = SuperType.defaultScrollCount;
                func(this);
            } break;

            case "tab": {
                let value = token.args[0];

                if(value === undefined) throw new Error("Missing tab value");
                value.check("number");

                this.renderRaw("&nbsp;".repeat(value.value));
                this.addRenderTime(this.header.customDelays[" "] ?? this.header.charDelay);
                
            } break;

            case "gopage": {
                const pageName = token.args[0];
                if(pageName === undefined) throw new Error("Missing page name");
                pageName.check("string");

                if(this.header.previewMode){
                    let charCount = this.header.wordWrap;
                    if(charCount === undefined){
                        // get the amount of characters that would fit on a line in the screen using the target width and the font size
                        const fontSize = parseFloat(getComputedStyle(this.target).fontSize);
                        const targetWidth = this.target.clientWidth;
                        charCount = Math.floor(targetWidth / fontSize);
                    }

                    this.renderRaw(`<br>${"=".repeat(charCount)}<br>`)
                    this.start(pageName.value);
                    return;
                }


                const text = token.args[1];
                if(text === undefined) throw new Error("Missing button text");
                text.check("string");

                let keep = token.args[2];
                if(keep !== undefined) keep.checkSpecific("keep");

                keep = (keep === undefined) ? false : true

                let button = document.createElement("div");
                button.classList.add("button");
                button.textContent = "▌" + text.value;

                button.addEventListener("click", () => {
                    if(keep === false) {
                        this.target.innerHTML = "";
                        this.state.glitches = [];
                    }
                    this.start(pageName.value);
                });

                this.appendToTarget(button);
            } break;

            case "color": {
                if(token.args.length === 0) throw new Error("Missing color value");

                const value = token.args[0];
                if(!value.is("color") && !value.equalsSpecific("reset")) throw new Error(`Invalid color value: Expected color or reset, got ${value.type}`);

                if(value.is("color")) {
                    this.state.currentColor = value.value;
                } else if(value.equalsSpecific("reset")) {
                    this.state.currentColor = this.header.textColor;
                }
            } break;

            case "bg": {
                if(token.args.length === 0) throw new Error("Missing background color value");

                const value = token.args[0];
                if(!value.is("color") && !value.equalsSpecific("reset")) throw new Error(`Invalid background color value: Expected color or reset, got ${value.type}`);

                if(value.is("color")) {
                    this.state.currentBg = value.value;
                } else if(value.equalsSpecific("reset")) {
                    this.state.currentBg = this.header.backgroundColor;
                }
            } break;

            case "speed": {
                const value = token.args[0];
                const option = token.args[1];

                if(value === undefined) throw new Error("Missing speed value");

                value.check("number");
                if(option) option.checkSpecific("override");

                this.header.charDelay = value.value;
                if(option != undefined) this.state.tagSpeedOverride = true;
            } break;

            case "speeddefault": {
                this.header.charDelay = this.state.defaultCharDelay;
                this.state.tagSpeedOverride = false;
            } break;

            case "newline": {

                let instant = token.args[0];
                if(instant !== undefined) instant.checkSpecific("instant");
                if(instant === undefined) instant = false;

                if(instant == false) this.addRenderTime(this.state.defaultNewlineDelay);
                this.renderRaw("<br>");
                this.state.scrollCount = SuperType.defaultScrollCount;
            } break;

            case "linebreak": {
                let instant = token.args[0];
                if(instant !== undefined) instant.checkSpecific("instant");
                if(instant === undefined) instant = false;

                if(instant == false) this.addRenderTime(this.state.defaultNewlineDelay);
                this.renderRaw("<br><br>");
                this.state.scrollCount = SuperType.defaultScrollCount;
            } break;

            case "sleep": {
                let value = token.args[0];

                if(value === undefined) throw new Error("Missing sleep value");

                value.check("number");
                this.addRenderTime(value.value);
            } break;

            case "glitch": {
                let value = token.args[0];
                let separate = token.args[1];

                if(value === undefined) throw new Error("Missing glitch value");

                if(separate !== undefined) separate.checkSpecific("separate");

                separate = (separate === undefined) ? false : true;

                if (separate) {
                    const tokens = [];

                    for (let i = 0; i < value.value; i++) {
                        tokens.push({
                            type: "tag",
                            name: "glitch",
                            args: [new TagArgument("number", 1)],
                            style: token.style
                        });
                    }

                    this.pages[this.state.page].splice(
                        this.state.token,
                        0,
                        ...tokens
                    );

                    return;
                }

                value.check("number");
                const glitchCount = value;

                for (let i = 0; i < glitchCount; i++) {
                    let span = document.createElement("span");
                    span.textContent = SuperType.randomCharacter();
                    this.styleElement(span, token.style);
                    this.target.appendChild(span);
                    this.state.glitches.push(span);
                }

                this.addRenderTime(this.state.defaultNewlineDelay);
            } break;
                
            default: {
                console.error(`Unknown tag type: ${token.name}`);
            }
        }
    }

    renderToken(token) {
        let delay = this.header.customDelays[token.value] ?? this.header.charDelay;

        if(this.state.tagSpeedOverride === true) {
            delay = this.header.charDelay;
        }

        this.addRenderTime(delay);
        this.renderCharacter(token.value, token.style);
    }

    styleElement(element, style) {
        element.style.color = this.state.currentColor;
        element.style.backgroundColor = this.state.currentBg;
        element.style.fontWeight = style.bold ? "bold" : "normal";
        element.style.fontStyle = style.italic ? "italic" : "normal";
        element.style.textDecoration = style.underline ? "underline" : "none";
        element.style.textDecoration += style.strikethrough ? " line-through" : "";
    }

    renderCharacter(text, style) {
        const span = document.createElement("span");
        span.textContent = text;

        this.styleElement(span, style);

        this.state.fragment.appendChild(span);
    }

    renderRaw(html) {
        const template = document.createElement("template");
        template.innerHTML = html;

        this.state.fragment.appendChild(template.content);
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
                token.style = {
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
            
            let lineCharacterCount = 0;
            let lastSpaceIndex = -1;

            for(let i = 0; i < pageTokens.length; i++) {
                const token = pageTokens[i];

                if(token.type === "tag"){
                    if(
                        token.name === "newline" ||
                        token.name === "linebreak" ||
                        token.name === "newpage"
                    ) {
                        lineCharacterCount = 0;
                        lastSpaceIndex = -1;
                    }

                    continue;
                }

                lineCharacterCount++;

                if(/\s/.test(token.value)) {
                    lastSpaceIndex = i;
                }

                if(
                    this.header.wordWrap !== undefined &&
                    lineCharacterCount > this.header.wordWrap
                ) {
                    const insertIndex = lastSpaceIndex !== -1 ? lastSpaceIndex + 1 : i;

                    pageTokens.splice(insertIndex, 0, {
                        type: "tag",
                        name: "newline",
                        args: [
                            new TagArgument("specific", "instant")
                        ],
                        style: {
                            "color": this.header.textColor,
                            "bg": this.header.backgroundColor,
                            "bold": false,
                            "italic": false,
                            "underline": false,
                            "strikethrough": false
                        }
                    });

                    lineCharacterCount = 0;
                    lastSpaceIndex = -1;

                    for(let k = insertIndex + 1; k <= i + 1; k++) {
                        const t = pageTokens[k];

                        if(t.type === "character") {
                            lineCharacterCount++;

                            if(/\s/.test(t.value)) {
                                lastSpaceIndex = k;
                            }
                        }
                    }

                    i++;
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

        // if its not a .st file, throw error
        if (!path.endsWith(".st")) {
            throw new Error(`Invalid file type: ${path}. Expected .st file`);
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
    if(SuperType.specificTypes.includes(value)) return {type: "specific", value}

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