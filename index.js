export class TagArgument {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    /**
     * type check, does not error
     */
    is(...types) {
        return types.includes(this.type);
    }

    /**
     * value check, does not error
     * @param  {...any} values 
     * @returns 
     */
    equals(...values) {
        return values.includes(this.value);
    }

    /**
     * specific value check, does not error
     */
    equalsSpecific(...values) {
        return this.type === "specific" && values.includes(this.value);
    }

    /**
     * type check, throws error if not one of the types
     */
    check(...types) {
        if (!types.includes(this.type)) {
            throw new Error(
                `Invalid argument type: Expected one of ${types.join(", ")}, got ${this.type}`
            );
        }
    }

    /**
     * specific value check, throws error if not specific or not one of the values
     */
    checkSpecific(...values) {
        if (this.type !== "specific") {
            throw new Error(`Invalid argument type: Expected specific, got ${this.type}`);
        }

        if (!values.includes(this.value)) {
            throw new Error(
                `Invalid argument value: Expected one of ${values.join(", ")}, got ${this.value}`
            );
        }
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

/**
 * Base class for all SuperType tags. Extend this and override any subset of
 * the hooks; unimplemented hooks fall back to these defaults.
 *
 * Register with SuperType.registerTag(YourTagClass).
 *
 * All hooks are static — tags don't hold per-instance state, they operate on
 * the `engine` (the SuperType instance) and `token` ({ type, name, args, style })
 * that are passed in.
 */
export class Tag {
    /** @type {string} the `[name ...]` identifier this tag responds to */
    static tagName = null;

    /**
     * Called while tokenize() encounters this tag, with the raw (unparsed)
     * string arguments between the brackets.
     *
     * Default behavior: return the parsed args array (TagArgument[]) and
     * tokenize() will automatically push the standard
     * { type: "tag", name, args } token for you.
     *
     * For full control, return `false` instead - tokenize() will then push
     * nothing on your behalf, and you're expected to have already done
     * whatever you needed via `ctx.queue` (the live token array being built).
     * This lets a tag:
     *   - push multiple tokens (e.g. expand a macro into several tags/characters)
     *   - push zero tokens (pure side effect, nothing rendered)
     *   - inspect or edit tokens already pushed (ctx.queue[ctx.queue.length - 1], splice, etc.)
     *
     * `ctx.engine` is also available for immediate side effects on the engine
     * itself, e.g. toggling tokenizer state that affects how subsequent
     * characters get scanned (see RawTag - this must happen here rather than
     * in onUse, since tokenize() runs once, eagerly, over the whole body
     * before any animation/process() calls happen).
     *
     * @param {string[]} rawArgs
     * @param {{engine: SuperType, queue: object[], body: string, index: number}} ctx
     * @returns {TagArgument[] | false}
     */
    static onTokenization(rawArgs, ctx) {
        return rawArgs.map(arg => TagArgument.parse(arg));
    }

    /**
     * Called from process() when the typewriter reaches this token during
     * animation. Do validation and state mutation here. Return `false` to
     * skip the onRender call that would otherwise follow (e.g. when a tag
     * expands itself into other tokens instead of doing anything itself).
     *
     * @param {SuperType} engine
     * @param {{type: "tag", name: string, args: TagArgument[], style: object}} token
     * @returns {false | void}
     */
    static onUse(engine, token) {
        console.error(`Unknown tag type: ${token.name}`);
    }

    /**
     * Called from process() right after onUse (unless onUse returned false).
     * Do any actual visual/DOM output here.
     *
     * @param {SuperType} engine
     * @param {{type: "tag", name: string, args: TagArgument[], style: object}} token
     */
    static onRender(engine, token) {}

    // ---------------------------------------------------------------------
    // Tags that wrap a span of content between an opening `[name ...]` and
    // a matching `[name end]` need to hook in at a specific point in the
    // load/tokenize pipeline. A tag class opts in by *overriding* one of
    // the two hooks below - there's no separate flag to set. The engine
    // detects opt-in with `Object.hasOwn(TagClass, "beforeTokenize")` (etc),
    // i.e. "did this specific subclass define its own version", not just
    // "does this method exist" - these base versions below exist purely so
    // the hooks show up in JSDoc/autocomplete, and are never called
    // themselves. If neither is overridden, nothing extra happens (e.g.
    // `raw`, which handles its own wrapping entirely inside onTokenization
    // by toggling tokenizer state).
    // ---------------------------------------------------------------------

    /**
     * Implement this if the tag needs to act on its wrapped content BEFORE
     * tokenization happens, working directly on raw body text (e.g. a
     * mixin definition, which is stored as a text template rather than
     * tokenized on the spot). Only called for tag classes that override
     * it themselves - the base implementation here is never invoked.
     *
     * Called once per matched `[name ...] ... [name end]` block, with the
     * raw (unparsed) opening-tag args and the raw text content in between.
     *
     * @param {string[]} rawArgs
     * @param {string} content
     * @param {{engine: SuperType}} ctx
     * @returns {string} text to splice into the body in place of the whole
     *   block (return "" to remove it entirely, as mixins do)
     */
    static beforeTokenize(rawArgs, content, ctx) {}

    /**
     * Implement this if the tag needs to route already-tokenized content
     * into a separate page AFTER tokenization happens (e.g. `page`, which
     * decides which page subsequent tokens land in). Only called for tag
     * classes that override it themselves - the base implementation here
     * is never invoked.
     *
     * Called for every token of this tag encountered while sorting tokens
     * into pages. Should create/validate the target page as a side effect
     * if needed, and return the page name to switch into (return "root" to
     * switch back to the default page, e.g. on `[name end]`).
     *
     * @param {SuperType} engine
     * @param {{type: "tag", name: string, args: TagArgument[]}} token
     * @param {number} index
     * @returns {string}
     */
    static afterTokenize(engine, token, index) {}
}

class UseTag extends Tag {
    static tagName = "@use";

    static onTokenization(rawArgs, ctx) {
        const args = rawArgs.map(arg => TagArgument.parse(arg));

        const nameArg = args[0];
        if (nameArg === undefined) throw new Error("Missing mixin name");
        nameArg.check("string");

        const mixinBody = ctx.engine.mixins[nameArg.value];
        if (mixinBody === undefined) {
            throw new Error(`Mixin not found: ${nameArg.value}`);
        }

        const substitutions = args.slice(1);
        let argIndex = 0;
        let depth = 0;
        let expanded = "";

        for (let i = 0; i < mixinBody.length; i++) {
            if (mixinBody.startsWith("<String>", i)) {
                const value = substitutions[argIndex];
                if (value === undefined) {
                    throw new Error(
                        `Mixin "${nameArg.value}" expected a value for placeholder #${argIndex + 1}`
                    );
                }
                value.check("string");

                expanded += depth > 0
                    ? `"${value.value.replace(/"/g, '\\"')}"`
                    : value.value;

                argIndex++;
                i += "<String>".length - 1;
                continue;
            }

            if (mixinBody.startsWith("<Number>", i)) {
                const value = substitutions[argIndex];
                if (value === undefined) {
                    throw new Error(
                        `Mixin "${nameArg.value}" expected a value for placeholder #${argIndex + 1}`
                    );
                }
                value.check("number");

                expanded += String(value.value);

                argIndex++;
                i += "<Number>".length - 1;
                continue;
            }

            if (mixinBody.startsWith("<Color>", i)) {
                const value = substitutions[argIndex];
                if (value === undefined) {
                    throw new Error(
                        `Mixin "${nameArg.value}" expected a value for placeholder #${argIndex + 1}`
                    );
                }
                value.check("color");

                expanded += value.value;

                argIndex++;
                i += "<Color>".length - 1;
                continue;
            }

            if (mixinBody.startsWith("<Boolean>", i)) {
                const value = substitutions[argIndex];
                if (value === undefined) {
                    throw new Error(
                        `Mixin "${nameArg.value}" expected a value for placeholder #${argIndex + 1}`
                    );
                }
                value.check("boolean");

                expanded += String(value.value);

                argIndex++;
                i += "<Boolean>".length - 1;
                continue;
            }

            if (mixinBody[i] === "[") depth++;
            else if (mixinBody[i] === "]") depth = Math.max(0, depth - 1);

            expanded += mixinBody[i];
        }

        expanded = expanded.replace(/\n[ \t]+/g, "\n");

        ctx.queue.push(...ctx.engine.tokenize(expanded));

        return false;
    }
}

class RawTag extends Tag {
    static tagName = "raw";

    // Wraps [raw] ... [raw end], but unlike mixin/page below, raw doesn't
    // need beforeTokenize or afterTokenize - it handles its own wrapping
    // right here in onTokenization by toggling tokenizer state directly.
    static onTokenization(rawArgs, ctx) {
        const args = super.onTokenization(rawArgs, ctx);
        const value = args[0];

        if (value !== undefined) value.checkSpecific("end");

        ctx.engine.state.rawMode = value === undefined;

        return args;
    }

    static onUse(engine, token) {
        // no runtime effect; entirely handled at tokenize-time above.
    }
}

class IgnoreTag extends Tag {
    static tagName = "ignore";

    static onUse(engine, token) {
        let value = token.args[0];
        if (value === undefined) return engine.state.ignoreCustomDelays = true;

        value.checkSpecific("off");

        engine.state.ignoreCustomDelays = false;
    }
}

class InstantTag extends Tag {
    static tagName = "instant";

    static onUse(engine, token) {
        let instant = token.args[0];
        if (instant === undefined) return engine.header.instant = true;

        instant.checkSpecific("off");

        engine.header.instant = false;
    }
}

class RemoveLastTag extends Tag {
    static tagName = "removelast";

    static onUse(engine, token) {
        token.args[0].check("number");

        const [number, keep] = token.args;

        if (keep !== undefined) keep.checkSpecific("keep");

        // expand into one-character removals, animated one at a time
        if (keep === undefined) {
            const tokens = [];

            for (let i = 0; i < number.value; i++) {
                tokens.push({
                    type: "tag",
                    name: "removelast",
                    args: [
                        new TagArgument("number", 1),
                        new TagArgument("specific", "keep")
                    ],
                    style: token.style
                });
            }

            engine.insertTokens(tokens);

            return false; // this token itself renders nothing; the spliced tokens will
        }

        engine.addRenderTime(engine.state.defaultCharDelay);
    }

    static onRender(engine, token) {
        if (engine.state.fragment && engine.state.fragment.childNodes.length) {
            engine.target.appendChild(engine.state.fragment); // fragment empties itself, still reusable
        }

        let count = token.args[0];

        while (count.value > 0 && engine.target.lastChild) {

            const span = engine.target.lastChild;

            if (span.nodeType !== Node.ELEMENT_NODE) {
                engine.target.removeChild(span);
                continue;
            }

            const text = span.firstChild;

            if (!text) {
                engine.target.removeChild(span);
                continue;
            }

            const remove = Math.min(count.value, text.length);

            text.deleteData(text.length - remove, remove);

            count.value -= remove;

            if (text.length === 0) {
                engine.target.removeChild(span);
            }
        }

        engine.resetSpanTextStyle();
    }
}

class CustomTag extends Tag {
    static tagName = "custom";

    static onUse(engine, token) {
        let name = token.args[0];
        let delay = token.args[1];

        if (name === undefined) throw new Error("Missing custom tag name");
        if (delay === undefined) throw new Error("Missing custom tag delay");

        name.check("string");
        delay.check("number");

        engine.header.customDelays[name.value] = delay.value;
    }
}

class CustomRemoveTag extends Tag {
    static tagName = "customremove";

    static onUse(engine, token) {
        let name = token.args[0];
        if (name === undefined) throw new Error("Missing custom tag name");
        name.check("string");

        if (engine.header.customDelays[name.value] === undefined) throw new Error(`Custom tag not found: ${name.value}`);

        delete engine.header.customDelays[name.value];
    }
}

class FunctionTag extends Tag {
    static tagName = "function";

    static onUse(engine, token) {
        const funcName = token.args[0];
        if (funcName === undefined) throw new Error("Missing function name");
        funcName.check("string");

        const func = engine.functions.get(funcName.value);

        if (!func) throw new Error(`Function not found: ${funcName.value}`)

        engine.state.scrollCount = SuperType.defaultScrollCount;
        func(engine, token);
    }
}

class TabTag extends Tag {
    static tagName = "tab";

    static onUse(engine, token) {
        let value = token.args[0];

        if (value === undefined) throw new Error("Missing tab value");
        value.check("number");

        engine.addRenderTime(engine.fetchDelay(" "));
    }

    static onRender(engine, token) {
        engine.renderRaw("&nbsp;".repeat(token.args[0].value));
    }
}

class GopageTag extends Tag {
    static tagName = "gopage";

    static onUse(engine, token) {
        const pageName = token.args[0];
        if (pageName === undefined) throw new Error("Missing page name");
        pageName.check("string");

        if (engine.header.previewMode) return;

        const text = token.args[1];
        if (text === undefined) throw new Error("Missing button text");
        text.check("string");

        let keep = token.args[2];
        if (keep !== undefined) keep.checkSpecific("keep");
    }

    static onRender(engine, token) {
        const pageName = token.args[0];

        if (engine.header.previewMode) {
            let charCount = engine.header.wordWrap;
            if (charCount === undefined) {

                const fontSize = parseFloat(getComputedStyle(engine.target).fontSize);
                const targetWidth = engine.target.clientWidth;
                charCount = Math.floor(targetWidth / fontSize);
            }

            engine.renderRaw(`<br>${"=".repeat(charCount)}<br>`)
            engine.start(pageName.value);
            return;
        }

        const text = token.args[1];
        const keep = token.args[2] !== undefined;

        let button = document.createElement("div");
        button.classList.add("button");
        button.textContent = "▌" + text.value;

        button.addEventListener("click", () => {
            if (keep === false) {
                engine.target.innerHTML = "";

                engine.resetSpanTextStyle();

                engine.state.glitches = [];
            }
            engine.start(pageName.value);
        });

        engine.appendToTarget(button);
    }
}

class ColorTag extends Tag {
    static tagName = "color";

    static onUse(engine, token) {
        if (token.args.length === 0) throw new Error("Missing color value");

        const value = token.args[0];
        if (!value.is("color") && !value.equalsSpecific("reset")) throw new Error(`Invalid color value: Expected color or reset, got ${value.type}`);

        if (value.is("color")) {
            engine.state.currentColor = value.value;
        } else if (value.equalsSpecific("reset")) {
            engine.state.currentColor = engine.header.textColor;
        }

        engine.resetSpanTextStyle();
    }
}

class BgTag extends Tag {
    static tagName = "bg";

    static onUse(engine, token) {
        if (token.args.length === 0) throw new Error("Missing background color value");

        const value = token.args[0];
        if (!value.is("color") && !value.equalsSpecific("reset")) throw new Error(`Invalid background color value: Expected color or reset, got ${value.type}`);

        if (value.is("color")) {
            engine.state.currentBg = value.value;
        } else if (value.equalsSpecific("reset")) {
            engine.state.currentBg = engine.header.backgroundColor;
        }

        engine.resetSpanTextStyle();
    }
}

class SpeedTag extends Tag {
    static tagName = "speed";

    static onUse(engine, token) {
        const value = token.args[0];
        const option = token.args[1];

        if (value === undefined) throw new Error("Missing speed value");

        value.check("number");
        if (option) option.checkSpecific("override");

        engine.header.charDelay = value.value;
        if (option != undefined) engine.state.tagSpeedOverride = true;
    }
}

class SpeedDefaultTag extends Tag {
    static tagName = "speeddefault";

    static onUse(engine, token) {
        engine.header.charDelay = engine.state.defaultCharDelay;
        engine.state.tagSpeedOverride = false;
    }
}

class NewlineTag extends Tag {
    static tagName = "newline";

    static onUse(engine, token) {
        let instant = token.args[0];
        if (instant !== undefined) instant.checkSpecific("instant");
        if (instant === undefined) instant = false;

        if (instant == false) engine.addRenderTime(engine.state.defaultNewlineDelay);
        engine.state.scrollCount = SuperType.defaultScrollCount;
        engine.state.lineWidth = 0;
    }

    static onRender(engine, token) {
        engine.renderRaw("<br>");
    }
}

class RepeatTag extends Tag {
    static tagName = "repeat";

    static onUse(engine, token) {
        const [value, count, instant] = token.args;

        value.check("string");
        count.check("number");

        if(instant !== undefined) instant.checkSpecific("instant");

        if(instant === undefined || instant.value === false){
            for (let i = 0; i < count.value; i++) {
                engine.insertToken({
                    type: "character",
                    value: value.value,
                    style: token.style
                });
            }
        } else {
            engine.renderCharacter(value.value.repeat(count.value), token.style);
        }

    }
}


class LinebreakTag extends Tag {
    static tagName = "linebreak";

    static onUse(engine, token) {
        let instant = token.args[0];
        if (instant !== undefined) instant.checkSpecific("instant");
        if (instant === undefined) instant = false;

        if (instant == false) engine.addRenderTime(engine.state.defaultNewlineDelay);
        engine.state.scrollCount = SuperType.defaultScrollCount;
        engine.state.lineWidth = 0;
    }

    static onRender(engine, token) {
        engine.renderRaw("<br><br>");
    }
}

class SleepTag extends Tag {
    static tagName = "sleep";

    static onUse(engine, token) {
        let value = token.args[0];

        if (value === undefined) throw new Error("Missing sleep value");

        value.check("number");
        engine.addRenderTime(value.value);
    }
}

class GlitchTag extends Tag {
    static tagName = "glitch";

    static onUse(engine, token) {
        let value = token.args[0];
        let keep = token.args[1];

        if (value === undefined) {
            throw new Error("Missing glitch value");
        }

        value.check("number");

        if (keep !== undefined) {
            keep.checkSpecific("keep");
        }

        // expand temporary glitches into keep glitches
        if (keep === undefined) {
            const tokens = [];

            for (let i = 0; i < value.value; i++) {
                tokens.push({
                    type: "tag",
                    name: "glitch",
                    args: [
                        new TagArgument("number", 1),
                        new TagArgument("specific", "keep")
                    ],
                    style: token.style
                });
            }

            engine.pages[engine.state.page].splice(
                engine.state.token,
                0,
                ...tokens
            );

            return false; // this token itself renders nothing; the spliced tokens will
        }

        engine.addRenderTime(engine.state.defaultCharDelay);
    }

    static onRender(engine, token) {
        const value = token.args[0];

        for (let i = 0; i < value.value; i++) {
            engine.createGlitch(token.style);
        }
    }
}

class JitterTag extends Tag {
    static tagName = "jitter";

    static onUse(engine, token) {
        const value = token.args[0];
        const strength = token.args[1];
        let third = token.args[2];

        if (value === undefined) throw new Error("Missing jitter value");
        if (strength === undefined) throw new Error("Missing jitter strength");

        value.check("string");
        strength.check("number");

        if (third !== undefined) third.checkSpecific("keep", "shared");
        

        // Expand into one-character keep tags.
        if (third === undefined) {
            const tokens = [];

            for (const ch of value.value) {
                tokens.push({
                    type: "tag",
                    name: "jitter",
                    args: [
                        new TagArgument("string", ch),
                        new TagArgument("number", strength.value),
                        new TagArgument("specific", "keep")
                    ],
                    style: token.style,
                });
            }

            engine.pages[engine.state.page].splice(
                engine.state.token,
                0,
                ...tokens
            );

            return false;
        } else if (third.equalsSpecific("shared")) {
            const sharedID = `jitter-${Math.random().toString(36).substr(2, 9)}`;
            const tokens = [];

            for (const ch of value.value) {
                tokens.push({
                    type: "tag",
                    name: "jitter",
                    sharedID,
                    args: [
                        new TagArgument("string", ch),
                        new TagArgument("number", strength.value),
                        new TagArgument("specific", "keep")
                    ],
                    style: token.style,
                });
            }

            engine.pages[engine.state.page].splice(
                engine.state.token,
                0,
                ...tokens
            );

            return false;
        }

        // Render this character with the normal typewriter delay.
        engine.addRenderTime(engine.fetchDelay(value.value));
    }

    static onRender(engine, token) {
        const value = token.args[0];
        const strength = token.args[1];

        engine.createJitter(
            value.value,
            strength.value,
            token.style,
            token?.sharedID
        );
    }
}

class PageTag extends Tag {
    static tagName = "page";

    // "page" tokens are never dispatched through process(): load() filters
    // them out of the token stream entirely, calling afterTokenize below to
    // decide which page subsequent tokens get routed into. onUse/onRender
    // are intentionally unused.
    static afterTokenize(engine, token, index) {
        const arg = token.args[0];

        if (arg === undefined) throw new Error(`Missing page name at token index ${index}`);

        if (arg.type === "string") {
            const name = arg.value;

            if (name === "root") {
                throw new Error(`Invalid page name at token index ${index}: 'root' is reserved`);
            }

            if (engine.pages[name] !== undefined) {
                throw new Error(`Duplicate page name at token index ${index}: ${name}`);
            }

            engine.pages[name] = [];

            return name;
        }

        if (arg.type === "specific" && arg.value === "end") {
            return "root";
        }

        throw new Error(`Invalid page argument token index ${index}: Expected String or end, got ${arg.type}`);
    }
}

class MixinTag extends Tag {
    static tagName = "mixin";

    // "mixin" tokens never make it to tokenize() at all: load() calls
    // beforeTokenize below to strip `[mixin "name"] ... [mixin end]` blocks
    // out of the raw body before tokenization happens. onUse/onRender are
    // intentionally unused.
    static beforeTokenize(rawArgs, content, ctx) {
        const nameArg = rawArgs[0];
        if (nameArg === undefined) throw new Error("Missing mixin name");

        const name = nameArg.replace(/^"|"$/g, "");

        if (ctx.engine.mixins[name] !== undefined) {
            throw new Error(`Duplicate mixin name: ${name}`);
        }

        ctx.engine.mixins[name] = content;

        return ""; // remove from the body entirely
    }
}

class SwapTag extends Tag {
    static tagName = "swap";

    static onUse(engine, token) {
        let bg = new String(engine.state.currentBg);
        let color = new String(engine.state.currentColor);
        
        engine.state.currentBg = color.toString();
        engine.state.currentColor = bg.toString();
    }
}

export class SuperType {

    static SharedMemory = {};

    static MAX_CHARACTERS_PER_FRAME = 200;

    static randomCharacters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "!", "@", "#", "$", "%", "&", "\\", "<", ">", "?"];

    static randomCharacter() {
        return SuperType.randomCharacters[Math.floor(Math.random() * SuperType.randomCharacters.length)];
    }

    static specificTypes = ["reset", "override", "default", "keep", "end", "instant", "off", "shared"];

    static defaultScrollCount = 6;

    /**
     * Registry of tag name -> Tag class. Populated via SuperType.registerTag().
     */
    static tags = new Map();

    /**
     * Register a class-based tag. The class must define a static `tagName`.
     * Any of `onTokenization`, `onUse`, `onRender` may be overridden; unimplemented
     * hooks fall back to the defaults defined on the base Tag class.
     *
     * @param {typeof Tag} TagClass
     */
    static registerTag(TagClass) {
        if (!TagClass.tagName) {
            throw new Error(`Tag class "${TagClass.name}" must define a static tagName`);
        }

        if (SuperType.tags.has(TagClass.tagName)) {
            throw new Error(`Tag "${TagClass.tagName}" is already registered`);
        }

        SuperType.tags.set(TagClass.tagName, TagClass);
    }

    /**
     * Names of every currently registered tag.
     */
    static get AllTags() {
        return [...SuperType.tags.keys()];
    }

    glitchLoop = () => {
        for (const text of this.state.glitches) {
            text.data = SuperType.randomCharacter();
        }

        requestAnimationFrame(this.glitchLoop);
    }

    jitterLoop = () => {
        for(const jitter of this.state.jitters) {
            jitter.textNode.parentElement.style.transform = `translate(${(Math.random() * 2 - 1) * (jitter.strength / 10)}px, ${(Math.random() * 2 - 1) * (jitter.strength / 10)}px)`;
        }

        // get shared jitters

        for(const jitters of Object.values(SuperType.SharedMemory)) {
            const transform = `translate(${(Math.random() * 2 - 1) * (jitters[0].strength / 10)}px, ${(Math.random() * 2 - 1) * (jitters[0].strength / 10)}px)`;
            jitters.forEach(jitter => {
                jitter.textNode.parentElement.style.transform = transform;
            })
            //jitter.textNode.parentElement.style.transform = `translate(${(Math.random() * 2 - 1) * (jitter.strength / 10)}px, ${(Math.random() * 2 - 1) * (jitter.strength / 10)}px)`;
        }

        requestAnimationFrame(this.jitterLoop);
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
        this.mixins = {};

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

        this.targetParent = target;
        this.target = div;
        
        this.target.style.whiteSpace = "pre-wrap";

        this.state = {
            token: 0,
            pausedAt: 0,
            nextTime: performance.now(),
            paused: false,
            page: "root",
            glitches: [],
            jitters: [],
            scrollCount: 0,
            lineWidth: 0,

            tagSpeedOverride: false,
            userSpeedOverride: null,

            defaultCharDelay: null,
            defaultNewlineDelay: null,
            currentColor: null,
            currentBg: null,
            fragment: null,

            currentSpan: null,
            currentText: null,
            currentStyle: null,

            scrollLocked: false,
            pauseLocked: false,

            ignoreCustomDelays: false,

            rawMode: false
        }
    }

    /**
     * Checks if the typewriter is currently paused.
     * @returns {Boolean}
     */
    paused(){
        return this.state.paused;
    }

    /**
     * Pauses the typewriter, freezing the schedule and allowing the user to scroll.
     * @returns {void}
     */
    pause() {
        this.state.pausedAt = performance.now();
        this.state.paused = true;
        this.state.scrollLocked = false;
    }

    /**
     * Unpauses the typewriter, shifting the schedule forward by the amount of time it was paused.
     * @returns {void}
     */
    resume() {
        if(this.state.pauseLocked === true) return;
        const delta = performance.now() - this.state.pausedAt;
        this.state.nextTime += delta;   // shift the schedule forward
        this.state.paused = false;
        this.state.scrollLocked = true;
        this.scrollWindow(this.targetParent.scrollHeight);
    }

    /**
     * begins rendering the given page, or "root" if no page is specified
     * @param {String} page page name
     * @returns {void}
     */
    start(page = "root") {
        if(this.header.previewMode === true) this.header.instant = true;

        this.state.page = page;
        this.state.token = 0;
        this.state.paused = false;
        this.state.nextTime = performance.now();
        this.state.tagSpeedOverride = false;
        this.state.scrollCount = 0;
        // if page is reset, then clear glitches
        this.state.glitches = [];
        this.state.jitters = [];
        this.state.defaultCharDelay = +(new Number(this.header.charDelay))
        this.state.defaultNewlineDelay = +(new Number(this.header.newlineDelay))

        this.state.currentColor = new String(this.header.textColor).toString();
        this.state.currentBg = new String(this.header.backgroundColor).toString();

        this.state.scrollLocked = false;
        this.state.pauseLocked = false;

        this.resetSpanTextStyle();


        this.fragment = null;

        requestAnimationFrame(this.render);
        requestAnimationFrame(this.glitchLoop);
        requestAnimationFrame(this.jitterLoop);
    }

    /**
     * Runs beforeTokenize (see Tag) for every registered tag that defines
     * it, pulling matched `[name ...] ... [name end]` blocks out of the raw
     * body before tokenization happens (e.g. mixin definitions). Adding a
     * new tag that needs this requires touching nothing here - just define
     * a `beforeTokenize` static method on the Tag class.
     *
     * @param {string} body
     * @returns {string}
     */
    runBeforeTokenizeHooks(body) {
        for (const [name, TagClass] of SuperType.tags) {
            if (!Object.hasOwn(TagClass, "beforeTokenize")) continue;

            const re = new RegExp(`\\[${name}(?:\\s+([^\\]]*))?\\]([\\s\\S]*?)\\[${name}\\s+end\\]`, "g");

            body = body.replace(re, (match, rawArgsStr, content) => {
                const rawArgs = (rawArgsStr ?? "").match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
                return TagClass.beforeTokenize(rawArgs, content, { engine: this });
            });
        }

        return body;
    }

    /**
     * Loads a SuperType file from the given path, parses it, and prepares it for rendering.
     * @param {string} path - The path to the SuperType file to load.
     * @returns 
     */
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

        this.targetParent.addEventListener("wheel", (e) => {
            // allow the user to scroll
            if(this.state.scrollLocked == true) return;

            this.targetParent.scrollBy({
                top: (e.shiftKey ? (13*4) : 13) * Math.sign(e.deltaY),
                behavior: "instant"
            });
        });

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

        this.body = this.data.slice(i).replace(/\r?\n/g, "\n");

        this.body = this.runBeforeTokenizeHooks(this.body);

        if(this.header.charDelay === undefined) throw new Error("Missing charDelay in header");
        if(this.header.newlineDelay === undefined) throw new Error("Missing newlineDelay in header");
        if(this.header.textColor === undefined) throw new Error("Missing textColor in header");
        if(this.header.backgroundColor === undefined) throw new Error("Missing backgroundColor in header");

        if(this.header.customDelays === undefined) this.header.customDelays = {};
        if(this.header.instant === undefined) this.header.instant = false;
        if(this.header.completionBar === undefined) this.header.completionBar = false;

        this.target.style.display = "inline-block";
        this.target.style.width = this.header.wordWrap ? `${this.header.wordWrap}ch` : "auto";

        this.tokens = this.tokenize(this.body)

        let currentPage = "root";

        for(let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];

            const TagClass = token.type === "tag" ? SuperType.tags.get(token.name) : undefined;

            if (TagClass && Object.hasOwn(TagClass, "afterTokenize")) {
                const afterValue = TagClass.afterTokenize(this, token, i);

                if (afterValue != null) currentPage = afterValue;
                continue;
            }

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

    appendToTarget(element) {
        this.state.fragment.appendChild(element);
    }

    resetSpanTextStyle(){
        this.state.currentStyle = null;
        this.state.currentSpan = null;
        this.state.currentText = null;
        return;
    }

    insertToken(token) {
        this.pages[this.state.page].splice(this.state.token, 0, token);
    }

    insertTokens(tokenArray){
        this.pages[this.state.page].splice(this.state.token, 0, ...tokenArray);
    }

    render = (now) => {
        if (this.state.paused) {
            requestAnimationFrame(this.render);
            return;
        }

        const fragment = document.createDocumentFragment();
        this.state.fragment = fragment;

        let processed = 0;

        try {
            while (now >= this.state.nextTime && (processed < SuperType.MAX_CHARACTERS_PER_FRAME || this.header.instant)) {
                const token = this.pages[this.state.page][this.state.token++];

                if (!token) {
                    this.state.scrollLocked = false;
                    this.state.pauseLocked = true;
                    this.pause();
                    if (this.header.backToTop === true) requestAnimationFrame(() => {
                        this.scrollWindow(0);
                    });
                    break;
                }

                this.process(token);
                processed++;
            }
        } catch (err) {
            console.error("SuperType: error processing token, skipping it\n", err);
        } finally {
            if (fragment.childNodes.length) {
                this.target.appendChild(fragment);
            }
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

    createGlitch(style) {
        this.resetSpanTextStyle();

        this.renderCharacter(SuperType.randomCharacter(), style);

        this.state.glitches.push(this.state.currentText);

        this.resetSpanTextStyle();
    }

    createJitter(character, strength, style, sharedID = undefined) {
        this.resetSpanTextStyle();

        this.renderCharacter(character, style);

        let jitter = {
            textNode: this.state.currentText,
            strength
        }

        jitter.textNode.parentElement.style.display = "inline-block";

        if(sharedID !== undefined){
            if(SuperType.SharedMemory[sharedID] === undefined){
                SuperType.SharedMemory[sharedID] = [jitter];
            } else {
                SuperType.SharedMemory[sharedID].push(jitter);
            }

        } else {
            this.state.jitters.push(jitter);
        }

        this.resetSpanTextStyle();
    }

    scrollWindow(to){
        window.scrollTo({
            top: to,
            behavior: "instant"
        });
    }

    scrollTargetParent(to){
        this.targetParent.scrollTo({
            top: to,
            behavior: "instant"
        });
    }

    process(token) {
        if (this.state.scrollCount > 0) {
            this.state.scrollCount--;

            requestAnimationFrame(() => {
                this.scrollWindow(this.targetParent.scrollHeight);
            });
        }

        if(token.type === "character") {
            this.renderToken(token);
            return;
        }

        const TagClass = SuperType.tags.get(token.name) ?? Tag;

        const result = TagClass.onUse(this, token);

        if (result === false) return;

        TagClass.onRender(this, token);
    }

    fetchDelay(tokenValue){

        let delay = null;

        if(this.state.ignoreCustomDelays === true) delay = this.header.charDelay;
        else if(this.state.tagSpeedOverride === true) delay = this.header.charDelay;
        else delay = (this.header.customDelays[tokenValue] ?? this.header.charDelay);

        return delay;
    }

    renderToken(token) {
        if (this.state.inWord !== true && token.value !== " ") {
            this.maybeBreakBeforeWord(token);
        }
        this.state.inWord = token.value !== " ";

        let delay = this.fetchDelay(token.value);
        this.addRenderTime(delay);
        this.renderCharacter(token.value, token.style);

        if (this.header.wordWrap) {
            this.state.lineWidth += this.getMeasureCtx(token.style).measureText(token.value).width;
        }
    }

    styleElement(element, style) {
        element.style.color = this.state.currentColor;
        element.style.backgroundColor = this.state.currentBg;
        element.style.fontWeight = style.bold ? "bold" : "normal";
        element.style.fontStyle = style.italic ? "italic" : "normal";
        
        // Build text-decoration correctly
        const decorations = [];
        if (style.underline) decorations.push("underline");
        if (style.strikethrough) decorations.push("line-through");
        element.style.textDecoration = decorations.length > 0 ? decorations.join(" ") : "none";
    }

    renderCharacter(text, style) {
        const sameStyle =
            this.state.currentStyle &&
            this.state.currentStyle.bold === style.bold &&
            this.state.currentStyle.italic === style.italic &&
            this.state.currentStyle.underline === style.underline &&
            this.state.currentStyle.strikethrough === style.strikethrough &&
            this.state.currentColor === this.state.currentStyle.color &&
            this.state.currentBg === this.state.currentStyle.bg;

        if (!sameStyle) {
            const span = document.createElement("span");

            this.styleElement(span, style);

            const textNode = document.createTextNode("");

            span.appendChild(textNode);

            this.state.fragment.appendChild(span);

            this.state.currentSpan = span;
            this.state.currentText = textNode;

            this.state.currentStyle = {
                bold: style.bold,
                italic: style.italic,
                underline: style.underline,
                strikethrough: style.strikethrough,
                color: this.state.currentColor,
                bg: this.state.currentBg
            };
        }

        this.state.currentText.appendData(text);
    }

    renderRaw(html) {

        this.resetSpanTextStyle();

        if (html === "<br>") {
            this.state.fragment.appendChild(document.createElement("br"));
            this.state.lineWidth = 0;
            return;
        }

        if (html === "<br><br>") {
            this.state.fragment.appendChild(document.createElement("br"));
            this.state.fragment.appendChild(document.createElement("br"));
            this.state.lineWidth = 0;
            return;
        }

        const template = document.createElement("template");
        template.innerHTML = html;
        this.state.fragment.appendChild(template.content);
    }

    getMeasureCtx(style = {}) {
        if (!this._measureCtx) {
            this._measureCtx = document.createElement("canvas").getContext("2d");
        }
        if (!this._fontBase) {
            const cs = getComputedStyle(this.target);
            this._fontBase = { size: cs.fontSize, family: cs.fontFamily };
        }
        const weight = style.bold ? "bold" : "normal";
        const slant = style.italic ? "italic" : "normal";
        this._measureCtx.font = `${slant} ${weight} ${this._fontBase.size} ${this._fontBase.family}`;
        return this._measureCtx;
    }
    lookAheadWord(firstChar) {
        let word = firstChar;
        const tokens = this.pages[this.state.page];
        let idx = this.state.token; // already points past the token just pulled in render()

        while (idx < tokens.length) {
            const t = tokens[idx];
            if (t.type !== "character" || t.value === " ") break;
            word += t.value;
            idx++;
        }
        return word;
    }

    maybeBreakBeforeWord(token) {
        if (!this.header.wordWrap) return; // only meaningful with a fixed wordWrap width

        const word = this.lookAheadWord(token.value);
        const ctx = this.getMeasureCtx(token.style);
        const wordWidth = ctx.measureText(word).width;
        const containerWidth = this.target.clientWidth;

        // only force a break if the word actually fits on its own line
        // (otherwise let normal char-wrapping handle the overflow, same as today)
        if (this.state.lineWidth > 0 && this.state.lineWidth + wordWidth > containerWidth && wordWidth <= containerWidth) {
            this.state.fragment.appendChild(document.createElement("br"));
            this.resetSpanTextStyle();
            this.state.lineWidth = 0;
        }
    }

    tokenize(body) {
        const queue = [];
        let i = 0;

        while (i < body.length) {

            // escaped characters
            if (body[i] === "\\" && this.state.rawMode === false) {
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

                    const isRawEnd = name === "raw" && parts.length === 1 && parts[0] === "end";

                    // While in raw mode, only [raw end] is allowed to act as a tag.
                    // Everything else falls through and gets pushed as plain characters.
                    if (this.state.rawMode !== true || isRawEnd) {
                        const TagClass = SuperType.tags.get(name) ?? Tag;

                        const result = TagClass.onTokenization(parts, {
                            engine: this,
                            queue,
                            body,
                            index: i
                        });

                        if (result !== false) {
                            queue.push({
                                type: "tag",
                                name,
                                args: result
                            });
                        }

                        i = end + 1;
                        continue;
                    }
                }
            }

            if (body[i] === "\n") {
                if (this.state.rawMode) {
                    queue.push({
                        type: "tag",
                        name: "newline",
                        args: [new TagArgument("specific", "instant")]
                    });

                    i++;

                    // Preserve indentation in raw mode.
                    continue;
                }

                // Outside raw mode, discard indentation after a newline.
                i++;

                while (body[i] === " " || body[i] === "\t") {
                    i++;
                }

                continue;
            }

            if(body[i] === "*") {
                queue.push({
                    type: this.state.rawMode ? "character" : "style",
                    value: this.state.rawMode ? "*" : "bold"
                });

                i++;
                continue;
            }

            if(body[i] === "_") {
                queue.push({
                    type: this.state.rawMode ? "character" : "style",
                    value: this.state.rawMode ? "_" : "underline"
                });

                i++;
                continue;
            }

            if(body[i] === "-") {
                queue.push({
                    type: this.state.rawMode ? "character" : "style",
                    value: this.state.rawMode ? "-" : "strikethrough"
                });

                i++;
                continue;
            }

            if(body[i] === "/") {
                queue.push({
                    type: this.state.rawMode ? "character" : "style",
                    value: this.state.rawMode ? "/" : "italic"
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

for (const TagClass of [
    RawTag,
    IgnoreTag,
    InstantTag,
    RemoveLastTag,
    CustomTag,
    CustomRemoveTag,
    FunctionTag,
    TabTag,
    GopageTag,
    ColorTag,
    BgTag,
    SpeedTag,
    SpeedDefaultTag,
    NewlineTag,
    LinebreakTag,
    SleepTag,
    GlitchTag,
    PageTag,
    JitterTag,
    MixinTag,
    UseTag,
    SwapTag,
    RepeatTag
]) {
    SuperType.registerTag(TagClass);
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