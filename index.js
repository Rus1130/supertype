export class TagArgument {
    constructor(type, value, raw = null) {
        this.type = type;
        this.value = value;
        this.raw = raw;
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
        // "none" is a universal stand-in for "no argument was passed" -
        // any tag argument slot that receives the literal string "none"
        // behaves exactly as if that slot had been omitted entirely
        // (i.e. resolves to JavaScript `undefined`, not a TagArgument
        // instance). Every call site of parse() must be prepared to
        // receive `undefined` back as a result of this.
        if (value === "none") {
            return undefined;
        }

        if (SuperType.specificTypes.includes(value)) {
            return new TagArgument("specific", value, value);
        }

        if (value.startsWith('"') && value.endsWith('"')) {
            return new TagArgument("string", value.slice(1, -1), value);
        }

        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return new TagArgument("number", Number(value), value);
        }

        if (value === "true") {
            return new TagArgument("boolean", true, value);
        }

        if (value === "false") {
            return new TagArgument("boolean", false, value);
        }

        if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            return new TagArgument("color", new Color(value).toString(), value);
        }

        if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(value)) {
            const [r, g, b] = value.split(",").map(Number);

            if (
                r >= 0 && r <= 255 &&
                g >= 0 && g <= 255 &&
                b >= 0 && b <= 255
            ) {
                return new TagArgument("color", new Color(r, g, b).toString(), value);
            }

            throw new Error(`Invalid RGB color: ${value}`);
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
    // Three optional hooks let a tag class reach outside the normal
    // onTokenization/onUse/onRender flow. Each one opts in by being
    // *overridden* on the subclass - there's no separate flag to set. The
    // engine detects opt-in with `Object.hasOwn(TagClass, "<hookName>")`,
    // i.e. "did this specific subclass define its own version", not just
    // "does this method exist" - the base versions below exist purely so
    // the hooks show up in JSDoc/autocomplete, and are never called
    // themselves. If none are overridden, nothing extra happens (e.g.
    // `raw`, which handles its own wrapping entirely inside onTokenization
    // by toggling tokenizer state).
    // ---------------------------------------------------------------------

    /**
     * Implement this if the tag needs to do one-time setup work right
     * before tokenize() runs over the full body - e.g. resetting engine
     * state that a previous load() call may have left behind. Only called
     * for tag classes that override it themselves - the base
     * implementation here is never invoked.
     *
     * Called once per tag class (not once per occurrence in the body),
     * right before `tokenize()` is invoked.
     *
     * @param {{engine: SuperType, body: string}} ctx
     * @returns {void}
     */
    static beforeTokenization(ctx) {}

    /**
     * Implement this if the tag wraps a span of content between an opening
     * `[name ...]` and a matching `[name end]`, and needs to rewrite or
     * consume that raw text BEFORE tokenization happens (e.g. a mixin
     * definition, which is stored as a text template rather than tokenized
     * on the spot). Only called for tag classes that override it
     * themselves - the base implementation here is never invoked.
     *
     * Called once per matched `[name ...] ... [name end]` block, with the
     * raw (unparsed) opening-tag args and the raw text content in between.
     *
     * May be async - the engine awaits the return value before continuing
     * to scan for the next match, so it's safe to do things like fetching
     * and loading another file here (see `@import`).
     *
     * @param {string[]} rawArgs
     * @param {string} content
     * @param {{engine: SuperType}} ctx
     * @returns {string | Promise<string>} text to splice into the body in
     *   place of the whole block (return "" to remove it entirely, as
     *   mixins do)
     */
    static extractBlock(rawArgs, content, ctx) {}

    /**
     * Implement this if the tag needs to route already-tokenized content
     * into a separate page (e.g. `page`, which decides which page
     * subsequent tokens land in). Only called for tag classes that
     * override it themselves - the base implementation here is never
     * invoked.
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
    static routeToPage(engine, token, index) {}

    /**
     * Optional: a regex source string constraining what the raw argument
     * text of a *block-opening* use of this tag may look like. If the args
     * after `[name ...]` don't match this pattern, runExtractBlockHooks
     * won't treat that occurrence as a block opener at all - it's left
     * alone for normal tokenize()/onUse() handling instead.
     *
     * Only needed for tags whose name is reused for both an inline,
     * self-contained form AND a block form (see RepeatTag).
     *
     * @type {string | null}
     */
    static blockOpenArgsPattern = null;
}

class StartTag extends Tag {
    static tagName = "@start";

    // No runtime effect - the entry point it marks is resolved once, at
    // load-time, into engine.startIndex (see load()), and openPage() reads
    // that instead of always starting at 0.
    static onUse(engine, token) {}
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

        let expanded = "";
        let argIndex = 0;

        let inTag = false;
        let inDoubleString = false;
        let inSingleString = false;

        for (let i = 0; i < mixinBody.length; i++) {

            // escaped character
            if (mixinBody[i] === "\\" && i + 1 < mixinBody.length) {
                expanded += mixinBody[i];
                expanded += mixinBody[++i];
                continue;
            }

            const ch = mixinBody[i];

            // update parser state
            if (inTag) {
                if (ch === '"' && !inSingleString) {
                    inDoubleString = !inDoubleString;
                    expanded += ch;
                    continue;
                }

                if (ch === "'" && !inDoubleString) {
                    inSingleString = !inSingleString;
                    expanded += ch;
                    continue;
                }

                if (!inDoubleString && !inSingleString && ch === "]") {
                    inTag = false;
                    expanded += ch;
                    continue;
                }
            } else if (ch === "[") {
                inTag = true;
                expanded += ch;
                continue;
            }

            let matched = null;

            if (mixinBody.startsWith("<String>", i)) matched = "string";
            else if (mixinBody.startsWith("<Number>", i)) matched = "number";
            else if (mixinBody.startsWith("<Color>", i)) matched = "color";
            else if (mixinBody.startsWith("<Boolean>", i)) matched = "boolean";

            if (matched !== null) {

                const value = substitutions[argIndex];

                if (value === undefined) {
                    throw new Error(
                        `Mixin "${nameArg.value}" expected argument #${argIndex + 1}`
                    );
                }

                value.check(matched);

                switch (matched) {

                    case "string":
                        if (inTag) {
                            expanded += `"${value.value
                                .replace(/\\/g, "\\\\")
                                .replace(/"/g, '\\"')}"`;
                        } else {
                            expanded += value.value
                                .replace(/\\/g, "\\\\")
                                .replace(/\[/g, "\\[")
                                .replace(/\]/g, "\\]");
                        }
                        i += "<String>".length - 1;
                        break;

                    case "number":
                        expanded += value.raw ?? String(value.value);
                        i += "<Number>".length - 1;
                        break;

                    case "color":
                        expanded += value.raw ?? value.value;
                        i += "<Color>".length - 1;
                        break;

                    case "boolean":
                        expanded += value.raw ?? String(value.value);
                        i += "<Boolean>".length - 1;
                        break;
                }

                argIndex++;
                continue;
            }

            expanded += ch;
        }

        expanded = expanded.replace(/\n[ \t]+/g, "\n");

        ctx.queue.push(...ctx.engine.tokenize(expanded));

        return false;
    }
}

class ImportTag extends Tag {
    static tagName = "@import";

    static async extractBlock(rawArgs, content, ctx) {
        const filePaths = content.split("\n").map(line => line.trim()).filter(line => line.length > 0);

        for (const filePath of filePaths) {
            const dummy = document.createElement("div");

            const importedEngine = new SuperType(dummy, ctx.engine.functions);

            await importedEngine.load(filePath).then(() => {
                const pages = importedEngine.pages;
                const mixins = importedEngine.mixins;

                for (const [name, tokens] of Object.entries(pages)) {
                    const importName = importedEngine.fileName + "-" + name;
                    if (ctx.engine.pages[importName] !== undefined) throw new Error(`Duplicate page name in imported file: ${name}`);
                    ctx.engine.pages[importName] = tokens;
                }

                for (const [name, tokens] of Object.entries(mixins)) {
                    if (ctx.engine.mixins[name] !== undefined) throw new Error(`Duplicate mixin name in imported file: ${name}`);
                    ctx.engine.mixins[name] = tokens;
                }
            })
        }
    }

    static onUse(engine, token) {
    }
}

class RawTag extends Tag {
    static tagName = "raw";

    // Wraps [raw] ... [raw end], but unlike mixin/page below, raw doesn't
    // need extractBlock or routeToPage, it handles its own wrapping
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

    // See JitterTag for why this expansion must happen once at tokenize
    // time rather than every time onUse fires.
    static onTokenization(rawArgs, ctx) {
        const args = rawArgs.map(arg => TagArgument.parse(arg));
        const [number, group] = args;

        if (number === undefined) throw new Error("Missing removelast value");

        number.check("number");

        if (group !== undefined) {
            group.checkSpecific("group");
            return args;
        }

        // expand into one-character removals, animated one at a time
        for (let i = 0; i < number.value; i++) {
            ctx.queue.push({
                type: "tag",
                name: "removelast",
                args: [
                    new TagArgument("number", 1),
                    new TagArgument("specific", "group")
                ],
            });
        }

        return false;
    }

    static onUse(engine, token) {
        engine.addRenderTime(engine.state.charDelay);
    }

    static onRender(engine, token) {
        if (engine.state.fragment && engine.state.fragment.childNodes.length) {
            engine.target.appendChild(engine.state.fragment);
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

        if(name.value == "\\n") engine.state.newlineDelay = delay.value;
        else engine.header.customDelays[name.value] = delay.value;
    }
}

class CustomRemoveTag extends Tag {
    static tagName = "customremove";

    static onUse(engine, token) {
        let name = token.args[0];
        if (name === undefined) throw new Error("Missing custom tag name");
        name.check("string");

        if (engine.header.customDelays[name.value] === undefined) return;

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

        const [value, fill] = token.args;

        if (value === undefined) throw new Error("Missing tab value");

        value.check("number");

        if(fill !== undefined) fill.checkSpecific("fill");

        engine.addRenderTime(engine.fetchDelay(" "));
    }

    static onRender(engine, token) {
        const [value, fill] = token.args;

        if(fill !== undefined) engine.renderCharacter(" ".repeat(value.value), token.style);
        else engine.renderRaw("&nbsp;".repeat(value.value));
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

        if(engine.pages[pageName.value] === undefined) throw new Error(`Page not found: ${pageName.value}`);

        if (engine.header.previewMode) {
            let charCount = engine.header.wordWrap;
            if (charCount === undefined) {

                const fontSize = parseFloat(getComputedStyle(engine.target).fontSize);
                const targetWidth = engine.target.clientWidth;
                charCount = Math.floor(targetWidth / fontSize);
            }

            engine.renderRaw(`<br>${"=".repeat(charCount)}<br>`)
            engine.openPage(pageName.value);
            return;
        }

        const text = token.args[1];
        const keep = token.args[2] !== undefined;

        let button = document.createElement("div");
        button.classList.add("button");
        button.textContent = "▌" + text.value;

        button.addEventListener("click", () => {
            if (keep === false) {
                engine.clearTargetHTML();
                engine.resetSpanTextStyle();
            }
            engine.openPage(pageName.value);
        });

        engine.appendToTarget(button);
    }
}

class ForcePageTag extends Tag {
    static tagName = "@forcepage";

    static onUse(engine, token) {
        const [pageName, keep] = token.args;

        pageName.check("string");
        if(keep !== undefined) keep.checkSpecific("keep");

        if (engine.pages[pageName.value] === undefined) throw new Error(`Page not found: ${pageName.value}`);

        if(keep === undefined) engine.clearTargetHTML();
        engine.openPage(pageName.value);
    }
}

class ColorTag extends Tag {
    static tagName = "color";

    static onUse(engine, token) {
        const value = token.args[0];
        if (value === undefined) throw new Error("Missing color value");

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
        const value = token.args[0];
        if (value === undefined) throw new Error("Missing background color value");

        if (!value.is("color") && !value.equalsSpecific("reset")) throw new Error(`Invalid background color value: Expected color or reset, got ${value.type}`);

        if (value.is("color")) {
            engine.state.currentBg = value.value;
        } else if (value.equalsSpecific("reset")) {
            engine.state.currentBg = engine.header.backgroundColor;
        }

        engine.resetSpanTextStyle();
    }
}

class ResetColorsTag extends Tag {
    static tagName = "resetcolors";

    static onUse(engine, token) {
        engine.state.currentColor = engine.header.textColor;
        engine.state.currentBg = engine.header.backgroundColor;

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
        engine.header.charDelay = engine.state.charDelay;
        engine.state.tagSpeedOverride = false;
    }
}

class RepeatTag extends Tag {
    static tagName = "repeat";

    static blockOpenArgsPattern = String.raw`-?\d+(?:\.\d+)?(?:\s+instant)?`;

    static extractBlock(rawArgs, content, ctx) {
        const [count, instant] = rawArgs.map(arg => TagArgument.parse(arg));

        count.check("number");
        if(instant !== undefined) instant.checkSpecific("instant");

        const tokens = ctx.engine.tokenize(content);

        let result = "";

        if (instant !== undefined) result += "[@forceinstant]";

        result += content.repeat(count.value);

        if (instant !== undefined) result += "[@forceinstant off]";

        return result;
    }

    // See JitterTag for why the non-instant expansion below must happen
    // once at tokenize time rather than every time onUse fires.
    static onTokenization(rawArgs, ctx) {
        const args = rawArgs.map(arg => TagArgument.parse(arg));
        const [value, count, instant] = args;

        value.check("string");
        count.check("number");

        if (instant !== undefined) instant.checkSpecific("instant");

        if (instant === undefined || instant.value === false) {
            for (let i = 0; i < count.value; i++) {
                ctx.queue.push({
                    type: "character",
                    value: value.value
                });
            }

            return false;
        }

        return args;
    }

    static onUse(engine, token) {
        // Only reached for the "instant" form now - the non-instant form is
        // expanded once at tokenize time (see onTokenization above).
        const [value, count] = token.args;

        engine.renderCharacter(value.value.repeat(count.value), token.style);
    }
}

class ForceInstantTag extends Tag {
    static tagName = "@forceinstant";

    static onUse(engine, token) {
        let instant = token.args[0];
        if (instant === undefined) return engine.state.userInstantOverride = true;

        instant.checkSpecific("off");

        engine.state.userInstantOverride = false;
    }
}


class NewlineTag extends Tag {
    static tagName = "newline";

    static onUse(engine, token) {
        let instant = token.args[0];
        if (instant !== undefined) instant.checkSpecific("instant");
        if (instant === undefined) instant = false;

        if (instant == false) engine.addRenderTime(engine.state.newlineDelay);
        engine.state.scrollCount = SuperType.defaultScrollCount;
        engine.state.lineWidth = 0;
        engine.state.inWord = false;
    }

    static onRender(engine, token) {
        engine.renderRaw("<br>");
    }
}

class LinebreakTag extends Tag {
    static tagName = "linebreak";

    static onUse(engine, token) {
        let instant = token.args[0];
        if (instant !== undefined) instant.checkSpecific("instant");
        if (instant === undefined) instant = false;

        if (instant == false) engine.addRenderTime(engine.state.newlineDelay);
        engine.state.scrollCount = SuperType.defaultScrollCount;
        engine.state.lineWidth = 0;
        engine.state.inWord = false;
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

    // See JitterTag for why this expansion must happen once at tokenize
    // time rather than every time onUse fires.
    static onTokenization(rawArgs, ctx) {
        const args = rawArgs.map(arg => TagArgument.parse(arg));

        let value = args[0];
        let group = args[1];

        if (value === undefined) {
            throw new Error("Missing glitch value");
        }

        value.check("number");

        if (group !== undefined) {
            group.checkSpecific("group");
            return args;
        }

        // expand temporary glitches into group glitches
        for (let i = 0; i < value.value; i++) {
            ctx.queue.push({
                type: "tag",
                name: "glitch",
                args: [
                    new TagArgument("number", 1),
                    new TagArgument("specific", "group")
                ],
            });
        }

        return false;
    }

    static onUse(engine, token) {
        engine.addRenderTime(engine.state.charDelay);
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

    static jitters = {};

    // Expansion into one-character group tags happens here, at tokenize
    // time, which runs exactly once per occurrence of the tag in the body.
    // It must NOT happen in onUse: onUse fires every time process() reaches
    // this token, and openPage() resets state.token back to 0 every time a
    // page is (re)opened - so an onUse-driven expansion would splice in a
    // fresh batch of characters in front of the previous batch on every
    // revisit, permanently growing the page's token array and rendering
    // duplicated text (e.g. "jittery!" becoming "jitteryjitteryjittery!"
    // after a few visits).
    static onTokenization(rawArgs, ctx) {
        const args = rawArgs.map(arg => TagArgument.parse(arg));

        const value = args[0];
        const strength = args[1];
        let third = args[2];

        if (value === undefined) throw new Error("Missing jitter value");
        if (strength === undefined) throw new Error("Missing jitter strength");

        value.check("string");
        strength.check("number");

        if (third !== undefined) third.checkSpecific("group", "shared");

        // Already a single-character token (produced by the expansion
        // below) - nothing further to expand, push it as-is.
        if (third !== undefined && third.equalsSpecific("group")) {
            return args;
        }

        const sharedID = third !== undefined && third.equalsSpecific("shared")
            ? Math.random().toString(36).substr(2, 9)
            : undefined;

        for (const ch of value.value) {
            const tagToken = {
                type: "tag",
                name: "jitter",
                args: [
                    new TagArgument("string", ch),
                    new TagArgument("number", strength.value),
                    new TagArgument("specific", "group")
                ],
            };

            if (sharedID !== undefined) tagToken.sharedID = sharedID;

            ctx.queue.push(tagToken);
        }

        return false;
    }

    static onUse(engine, token) {
        const value = token.args[0];

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


class UnscrambleTag extends Tag {
    static tagName = "unscramble";
    static unscrambles = {};

    // See JitterTag for why this expansion must happen once at tokenize
    // time rather than every time onUse fires.
    static onTokenization(rawArgs, ctx) {
        const args = rawArgs.map(arg => TagArgument.parse(arg));
        const [value, num1, num2] = args;

        if (value === undefined) throw new Error("Missing unscramble value");
        if (num1 === undefined) throw new Error("Missing unscramble min time");

        value.check("string");
        num1.check("number");
        if (num2 !== undefined) num2.check("number");

        for (const ch of value.value) {
            const tk = {
                type: "tag",
                name: "unscramble",
                args: [
                    new TagArgument("string", ch),
                    new TagArgument("number", num1.value)
                ],
            };

            if (num2 !== undefined) tk.args.push(new TagArgument("number", num2.value));

            ctx.queue.push(tk);
        }

        return false;
    }

    static onUse(engine, token) {
        const [value, num1, num2] = token.args;

        value.check("string");
        num1.check("number");
        if (num2 !== undefined) num2.check("number");

        // Per-character setup.
        const id = Math.random().toString(36).substr(2, 9);

        const min = num1.value;
        const max = num2 === undefined ? min : num2.value;

        UnscrambleTag.unscrambles[id] = {
            text: value.value,
            start: performance.now(),
            maxTime: max,
            times: value.value.split("").map(() =>
                min + Math.random() * (max - min)
            )
        };

        token.unscrambleID = id;

        engine.addRenderTime(engine.fetchDelay(value.value));
    }

    static onRender(engine, token) {
        const unscramble = UnscrambleTag.unscrambles[token.unscrambleID];

        if (!unscramble) return;

        const now = performance.now();

        const text = unscramble.text
            .split("")
            .map((char, i) => {
                if (char === " ") return " ";

                if (now - unscramble.start >= unscramble.times[i]) {
                    return char;
                }

                return SuperType.randomCharacter();
            })
            .join("");


        engine.resetSpanTextStyle();
        engine.renderCharacter(text, token.style);
        unscramble.textNode = engine.state.currentText;
        engine.resetSpanTextStyle();
    }
}

class SeparateTag extends Tag {
    static tagName = "@forceseparate";

    static onUse(engine, token) {
        let value = true;
        if(token.args[0] !== undefined && token.args[0].equalsSpecific("off")) value = false;

        engine.state.separateElements = value;
    }
} 

class GradientTag extends Tag {
    static tagName = "gradient";

    static onTokenization(rawArgs, ctx) {
        const args = rawArgs.map(arg => TagArgument.parse(arg));
        const [text, css] = args;

        if (text === undefined) throw new Error("Missing gradient text");
        if (css === undefined) throw new Error("Missing gradient css");

        text.check("string");
        css.check("string");

        const stops = GradientTag.parseGradient(css.value);
        const chars = [...text.value];

        ctx.queue.push({
            type: "tag",
            name: "payload",
            payload: {
                onuse: (engine, token) => {
                    if (engine.state.gradientColorStack === undefined) engine.state.gradientColorStack = [];
                    engine.state.gradientColorStack.push(engine.state.currentColor);
                }
            }
        })
    

        for (let i = 0; i < chars.length; i++) {
            const t = chars.length === 1 ? 0 : i / (chars.length - 1);
            const color = GradientTag.sampleGradient(stops, t);

            ctx.queue.push({
                type: "tag",
                name: "payload",
                args: [new TagArgument("color", color)],
                payload: {
                    onuse: (engine, token) => {
                        engine.state.currentColor = token.args[0].value;
                    }
                }
            });

            ctx.queue.push({ type: "character", value: chars[i] });
        }

        ctx.queue.push({
            type: "tag",
            name: "payload",
            payload: {
                onuse: (engine, token) => {
                    const stack = engine.state.gradientColorStack;
                    if (stack && stack.length) engine.state.currentColor = stack.pop();
                }
            }
        });

        return false;
    }
    static parseGradient(css) {
        const parts = GradientTag.splitTopLevel(css.trim());

        let stopParts = parts;

        // Optional leading angle/direction, e.g. "90deg" or "to right".
        if (parts.length && /^-?\d+(\.\d+)?(deg|grad|rad|turn)$|^to\s+\w/i.test(parts[0].trim())) {
            stopParts = parts.slice(1);
        }

        if (stopParts.length < 2) {
            throw new Error(`Invalid gradient css: Need at least 2 color stops, got ${stopParts.length}`);
        }

        const stops = stopParts.map(part => {
            const trimmed = part.trim();
            const posMatch = trimmed.match(/^(.*?)(?:\s+(-?\d+(?:\.\d+)?)%)?$/);

            return {
                color: GradientTag.parseColor(posMatch[1].trim()),
                position: posMatch[2] !== undefined ? parseFloat(posMatch[2]) / 100 : null
            };
        });

        const n = stops.length;
        stops.forEach((stop, i) => {
            if (stop.position === null) stop.position = n === 1 ? 0 : i / (n - 1);
        });

        return stops;
    }

    static splitTopLevel(str) {
        const parts = [];
        let depth = 0;
        let current = "";

        for (const ch of str) {
            if (ch === "(") depth++;
            if (ch === ")") depth--;

            if (ch === "," && depth === 0) {
                parts.push(current);
                current = "";
            } else {
                current += ch;
            }
        }

        if (current.trim() !== "") parts.push(current);

        return parts;
    }

    static parseColor(str) {
        if (/^#[0-9a-fA-F]{6}$/.test(str)) {
            return [
                parseInt(str.slice(1, 3), 16),
                parseInt(str.slice(3, 5), 16),
                parseInt(str.slice(5, 7), 16)
            ];
        }

        if (/^#[0-9a-fA-F]{3}$/.test(str)) {
            return [
                parseInt(str[1] + str[1], 16),
                parseInt(str[2] + str[2], 16),
                parseInt(str[3] + str[3], 16)
            ];
        }

        const rgbMatch = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i);
        if (rgbMatch) {
            return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
        }

        const named = GradientTag.namedColors[str.toLowerCase()];
        if (named) return named;

        throw new Error(`Invalid gradient color: ${str}`);
    }

    static sampleGradient(stops, t) {
        t = Math.max(0, Math.min(1, t));

        if (t <= stops[0].position) return GradientTag.rgbToHex(stops[0].color);
        if (t >= stops[stops.length - 1].position) return GradientTag.rgbToHex(stops[stops.length - 1].color);

        for (let i = 0; i < stops.length - 1; i++) {
            const a = stops[i];
            const b = stops[i + 1];

            if (t >= a.position && t <= b.position) {
                const span = b.position - a.position;
                const localT = span === 0 ? 0 : (t - a.position) / span;

                return GradientTag.rgbToHex([
                    Math.round(a.color[0] + (b.color[0] - a.color[0]) * localT),
                    Math.round(a.color[1] + (b.color[1] - a.color[1]) * localT),
                    Math.round(a.color[2] + (b.color[2] - a.color[2]) * localT)
                ]);
            }
        }

        return GradientTag.rgbToHex(stops[stops.length - 1].color);
    }

    static rgbToHex([r, g, b]) {
        const clamp = v => Math.max(0, Math.min(255, v));
        return "#" + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, "0")).join("");
    }

    static namedColors = {
        red: [255, 0, 0], blue: [0, 0, 255], green: [0, 128, 0], yellow: [255, 255, 0],
        orange: [255, 165, 0], purple: [128, 0, 128], pink: [255, 192, 203], black: [0, 0, 0],
        white: [255, 255, 255], cyan: [0, 255, 255], magenta: [255, 0, 255], lime: [0, 255, 0],
        gray: [128, 128, 128], grey: [128, 128, 128], violet: [238, 130, 238], indigo: [75, 0, 130],
        gold: [255, 215, 0], silver: [192, 192, 192], navy: [0, 0, 128], teal: [0, 128, 128],
        maroon: [128, 0, 0], olive: [128, 128, 0], coral: [255, 127, 80], salmon: [250, 128, 114],
        crimson: [220, 20, 60], turquoise: [64, 224, 208], lavender: [230, 230, 250]
    };
}

// 
/**
 * @description cannot be used by the user, used to run javascript code
 *  @example
 *  engine.insertToken({
 *      type: "tag",
 *      name: "payload",
 *      payload: {
 *          onuse: (engine, token) => {
 *              console.log("on use payload!");
 *          },
 *          onrender: (engine, token) => {
 *              console.log("on render payload!");
 *          }
 *      }
 *  })
*/
class PayloadTag extends Tag {
    static tagName = "payload";

    static onUse(engine, token) {
        if(token.payload == undefined) throw new Error("Missing payload");
        if(token.payload.onuse !== undefined) token.payload.onuse(engine, token);
    }

    static onRender(engine, token) {
        if(token.payload == undefined) throw new Error("Missing payload");
        if(token.payload.onrender !== undefined) token.payload.onrender(engine, token);
    }
}

class AccuracyTag extends Tag {
    static tagName = "accuracy";

    static onUse(engine, token) {
        const value = token.args[0];

        value.check("number");

        if(value.value < 0 || value.value > 1) throw new Error(`Invalid accuracy value: Expected number between 0 and 1, got ${value.value}`);

        engine.state.accuracy = value.value;
    }
}

class PageTag extends Tag {
    static tagName = "page";

    // "page" tokens are never dispatched through process(): load() filters
    // them out of the token stream entirely, calling routeToPage below to
    // decide which page subsequent tokens get routed into. onUse/onRender
    // are intentionally unused.
    static routeToPage(engine, token, index) {
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
    // extractBlock below to strip `[mixin "name"] ... [mixin end]` blocks
    // out of the raw body before tokenization happens. onUse/onRender are
    // intentionally unused.
    static extractBlock(rawArgs, content, ctx) {
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

class ForceScrollTag extends Tag {
    static tagName = "forcescroll";

    static onUse(engine, token) {
        engine.state.scrollCount = SuperType.defaultScrollCount;
    }
}

export class SuperType {
    static MAX_CHARACTERS_PER_FRAME = 200;

    static randomCharacters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "!", "@", "#", "$", "%", "&", "\\", "<", ">", "?"];

    static randomCharacter() {
        return SuperType.randomCharacters[Math.floor(Math.random() * SuperType.randomCharacters.length)];
    }

    static specificTypes = ["reset", "override", "default", "group", "end", "instant", "off", "shared", "fill", "keep"];

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

        this._glitchFrame = requestAnimationFrame(this.glitchLoop);
    }

    jitterLoop = () => {
        for(const jitter of this.state.jitters) {
            jitter.textNode.parentElement.style.transform = `translate(${(Math.random() * 2 - 1) * (jitter.strength / 10)}px, ${(Math.random() * 2 - 1) * (jitter.strength / 10)}px)`;
        }

        // get shared jitters

        for(const jitters of Object.values(JitterTag.jitters)) {
            const transform = `translate(${(Math.random() * 2 - 1) * (jitters[0].strength / 10)}px, ${(Math.random() * 2 - 1) * (jitters[0].strength / 10)}px)`;
            jitters.forEach(jitter => {
                jitter.textNode.parentElement.style.transform = transform;
            })
            //jitter.textNode.parentElement.style.transform = `translate(${(Math.random() * 2 - 1) * (jitter.strength / 10)}px, ${(Math.random() * 2 - 1) * (jitter.strength / 10)}px)`;
        }

        this._jitterFrame = requestAnimationFrame(this.jitterLoop);
    }

    unscrambleLoop = () => {
        const now = performance.now();

        for (const [id, unscramble] of Object.entries(UnscrambleTag.unscrambles)) {
            if (!unscramble.textNode) continue;

            if (now - unscramble.start >= unscramble.maxTime) {
                unscramble.textNode.data = unscramble.text;
                delete UnscrambleTag.unscrambles[id];
                continue;
            }

            unscramble.textNode.data = unscramble.text
                .split("")
                .map((ch, i) => {
                    if (ch === " ") return " ";
                    if (now - unscramble.start >= unscramble.times[i]) return ch;
                    return SuperType.randomCharacter();
                })
                .join("");
        }

        this._unscrambleFrame = requestAnimationFrame(this.unscrambleLoop);
    }

    clearLoops() {
        this.state.glitches = [];
        this.state.jitters = [];
        this.state.unscrambles = [];

        GlitchTag.glitches = {};
        JitterTag.jitters = {};
        UnscrambleTag.unscrambles = {};
    }

    /**
     * Fully tears down this instance: cancels all running rAF loops,
     * removes its DOM and event listeners, and clears any jitter/glitch/
     * unscramble bookkeeping it registered. Call this (or just construct a
     * new SuperType on the same target, which calls this automatically)
     * before discarding an instance - otherwise its animation loops keep
     * running forever and its DOM is never removed, causing effects like
     * jitter to visibly duplicate every time a new page/instance is opened
     * on top of it.
     */
    destroy() {
        cancelAnimationFrame(this._renderFrame);
        cancelAnimationFrame(this._glitchFrame);
        cancelAnimationFrame(this._jitterFrame);
        cancelAnimationFrame(this._unscrambleFrame);

        this.clearLoops();

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }

        if (this._keydownHandler) {
            this.targetParent.removeEventListener("keydown", this._keydownHandler);
        }

        if (this._wheelHandler) {
            this.targetParent.removeEventListener("wheel", this._wheelHandler);
        }

        if (this.target && this.target.parentNode) {
            this.target.remove();
        }

        if (this.targetParent && this.targetParent.__superTypeInstance === this) {
            delete this.targetParent.__superTypeInstance;
        }
    }

    setResetTarget(page){
        localStorage.setItem("supertype-reset-target", page);
    }

    getResetTarget(){
        const target = localStorage.getItem("supertype-reset-target");
        return target;
    }

    removeResetTarget(){
        localStorage.removeItem("supertype-reset-target");
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
        this.startIndex = {};
        this.mixins = {};

        this.startCount = 0;

        this.allowedControls = new Set();
        this.functions = new Map();

        for (const [name, func] of Object.entries(functions)) {
            if (typeof func !== "function") {
                throw new Error(`Invalid function for ${name}: Expected function, got ${typeof func}`);
            }

            this.functions.set(name, func);
        }

        // If a SuperType instance is already attached to this target (e.g. a
        // previous "page" that was opened by constructing a new SuperType on
        // the same container), tear it down first. Without this, the old
        // instance's DOM never gets removed and its render/jitter/glitch
        // rAF loops and event listeners keep running forever, stacking
        // visibly with every new instance (e.g. jitter text duplicating on
        // every new page).
        if (target.__superTypeInstance) {
            target.__superTypeInstance.destroy();
        }

        const div = document.createElement("div");
        div.classList.add("supertype");
        target.appendChild(div);

        this.targetParent = target;
        this.target = div;
        this.fileName = null;
        target.__superTypeInstance = this;

        // Cached layout measurements used by word-wrap. Both are invalidated
        // (set back to null) only when the layout could actually have
        // changed, rather than either caching forever (stale after the
        // element/font changes) or re-measuring on every character (forces
        // a synchronous reflow per call, which gets slower the more content
        // is already on the page).
        this._containerWidth = null;
        this._fontBase = null;

        if (typeof ResizeObserver !== "undefined") {
            this._resizeObserver = new ResizeObserver(() => {
                this._containerWidth = null;
                this._fontBase = null; // font-size can be responsive too
            });
            this._resizeObserver.observe(this.target);
        }

        if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                this._fontBase = null;
            });
        }

        this._keydownHandler = (e) => {
            // allowCtrl is a special option that allows the user to use ctrl+key or cmd+key to trigger the control, but only if the control is allowed. This is useful for allowing the user to use ctrl+space to pause/resume, for example.
            const controlsCheck = (value, key, { allowCtrl = false } = {}) => {
                if (!(this.allowedControls.has(value) || this.allowedControls.has("all"))) return false;
                if (e.key !== key) return false;
                if (!allowCtrl && (e.ctrlKey || e.metaKey)) return false;
                return true;
            }

            if(controlsCheck("pause", " ")) {
                this.paused() ? this.resume() : this.pause();
            }

            if(controlsCheck("instant", "i")) this.state.userInstantOverride = !this.state.userInstantOverride;

            if(controlsCheck("fastforward", "ArrowRight")) this.state.userSpeedOverride = this.state.userSpeedOverride === null ? 2 : null;

            if(controlsCheck("reset", "r")){
                this.setResetTarget(this.state.page);
                location.reload();
            }
        };

        this.targetParent.addEventListener("keydown", this._keydownHandler)

        this.target.style.whiteSpace = "pre-wrap";

        this.state = {
            token: 0,
            pausedAt: 0,
            nextTime: performance.now(),
            paused: false,
            page: "root",

            glitches: [],
            jitters: [],
            unscrambles: [],

            scrollCount: 0,
            lineWidth: 0,
            inWord: false,

            tagSpeedOverride: false,
            userSpeedOverride: null,
            userInstantOverride: false,

            charDelay: null,
            newlineDelay: null,
            currentColor: null,
            currentBg: null,
            fragment: null,

            currentSpan: null,
            currentText: null,
            currentStyle: null,

            scrollLocked: false,
            pauseLocked: false,

            ignoreCustomDelays: false,

            rawMode: false,

            accuracy: 1,
            separateElements: false
        }
    }

    static allowedControls = ["reset", "instant", "pause", "fastforward", "all"]

    allowControls(...controls){
        for(const control of controls){
            if(!SuperType.allowedControls.includes(control)){
                throw new Error(`Invalid control: ${control}`);
            }

            this.allowedControls.add(control);
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
    openPage(page = "root") {
        if(this.header.previewMode === true) this.header.instant = true;

        this.state.page = page;
        this.state.token = this.startIndex[page] ?? 0;
        this.state.paused = false;
        this.state.nextTime = performance.now();
        this.state.tagSpeedOverride = false;
        this.state.scrollCount = 0;

        this.clearLoops();

        this.state.charDelay = +(new Number(this.header.charDelay))
        this.state.newlineDelay = +(new Number(this.header.newlineDelay))

        this.state.currentColor = new String(this.header.textColor).toString();
        this.state.currentBg = new String(this.header.backgroundColor).toString();

        this.state.scrollLocked = false;
        this.state.pauseLocked = false;
        this.state.separateElements = false;

        this.resetSpanTextStyle();


        this.fragment = null;

        this._renderFrame = requestAnimationFrame(this.render);
        if(this.startCount === 0){
            this._glitchFrame = requestAnimationFrame(this.glitchLoop);
            this._jitterFrame = requestAnimationFrame(this.jitterLoop);
            this._unscrambleFrame = requestAnimationFrame(this.unscrambleLoop);
        }
        this.startCount++;
    }

    start(){
        if(this.getResetTarget() !== null){
            const page = this.getResetTarget();
            this.removeResetTarget();
            this.openPage(page);
            return;
        }
        this.openPage();
    }

    /**
     * Runs extractBlock (see Tag) for every registered tag that defines
     * it, pulling matched `[name ...] ... [name end]` blocks out of the raw
     * body before tokenization happens (e.g. mixin definitions). Adding a
     * new tag that needs this requires touching nothing here - just define
     * an `extractBlock` static method on the Tag class.
     *
     * This is deliberately NOT built on String.replace(): replace() always
     * stringifies whatever its callback returns immediately, so an async
     * extractBlock would come back as the literal text "[object Promise]"
     * instead of being awaited. Scanning manually with exec() lets us await
     * each replacement before resuming the search on the updated body.
     *
     * @param {string} body
     * @returns {Promise<string>}
     */
    async runExtractBlockHooks(body) {
        for (const [name, TagClass] of SuperType.tags) {
            if (!Object.hasOwn(TagClass, "extractBlock")) continue;

            const argsPattern = TagClass.blockOpenArgsPattern ?? "[^\\]]*";
            const re = new RegExp(`\\[${name}(?:\\s+(${argsPattern}))?\\]([\\s\\S]*?)\\[${name}\\s+end\\]`, "g");

            let match;
            re.lastIndex = 0;

            while ((match = re.exec(body)) !== null) {
                const [fullMatch, rawArgsStr, content] = match;
                const rawArgs = (rawArgsStr ?? "").match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];

                const replacement = (await TagClass.extractBlock(rawArgs, content, { engine: this })) ?? "";

                body = body.slice(0, match.index) + replacement + body.slice(match.index + fullMatch.length);
                re.lastIndex = match.index + replacement.length;
            }
        }

        return body;
    }

    /**
     * Runs beforeTokenization (see Tag) for every registered tag that
     * defines it. This fires once per tag class, immediately before
     * tokenize() is called over the (already block-extracted) body, and is
     * meant for one-time setup side effects rather than text rewriting.
     * Adding a new tag that needs this requires touching nothing here -
     * just define a `beforeTokenization` static method on the Tag class.
     *
     * @param {string} body
     * @returns {void}
     */
    runBeforeTokenizationHooks(body) {
        for (const [name, TagClass] of SuperType.tags) {
            if (!Object.hasOwn(TagClass, "beforeTokenization")) continue;

            TagClass.beforeTokenization({ engine: this, body });
        }
    }

    /**
     * Loads a SuperType file from the given path, parses it, and prepares it for rendering.
     * @param {string} path - The path to the SuperType file to load.
     * @returns 
     */
    async load(path) {
        this.data = (await this.fetch(path)).replaceAll(/\{\{#[\s\S]*?#\}\}/g, "");

        this.fileName = path.split("/").pop().split(".")[0];

        const start = this.data.indexOf("typewriter");
        const open = this.data.indexOf("{", start);

        let depth = 1;
        let i = open + 1;

        while (i < this.data.length && depth > 0) {
            if (this.data[i] === "{") depth++;
            else if (this.data[i] === "}") depth--;
            i++;
        }

        this._wheelHandler = (e) => {
            // allow the user to scroll
            if(this.state.scrollLocked == true) return;

            this.targetParent.scrollBy({
                top: (e.shiftKey ? (13*4) : 13) * Math.sign(e.deltaY),
                behavior: "instant"
            });
        };

        this.targetParent.addEventListener("wheel", this._wheelHandler);

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

        this.body = await this.runExtractBlockHooks(this.body);

        if(this.header.charDelay === undefined) throw new Error("Missing charDelay in header");
        if(this.header.newlineDelay === undefined) throw new Error("Missing newlineDelay in header");
        if(this.header.textColor === undefined) throw new Error("Missing textColor in header");
        if(this.header.backgroundColor === undefined) throw new Error("Missing backgroundColor in header");

        if(this.header.customDelays === undefined) this.header.customDelays = {};
        if(this.header.instant === undefined) this.header.instant = false;
        if(this.header.completionBar === undefined) this.header.completionBar = false;

        this.target.style.display = "inline-block";
        this.target.style.width = this.header.wordWrap ? `${this.header.wordWrap}ch` : "auto";

        this.runBeforeTokenizationHooks(this.body);

        this.tokens = this.tokenize(this.body)

        let currentPage = "root";

        for(let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];

            const TagClass = token.type === "tag" ? SuperType.tags.get(token.name) : undefined;

            if (TagClass && Object.hasOwn(TagClass, "routeToPage")) {
                const routedValue = TagClass.routeToPage(this, token, i);

                if (routedValue != null) currentPage = routedValue;
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

        for (let page in this.pages) {
            const idx = this.pages[page].findIndex(t => t.type === "tag" && t.name === "@start");
            if (idx !== -1) this.startIndex[page] = idx;
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
            this._renderFrame = requestAnimationFrame(this.render);
            return;
        }

        const fragment = document.createDocumentFragment();
        this.state.fragment = fragment;

        let processed = 0;

        try {
            while (now >= this.state.nextTime && (
                processed < SuperType.MAX_CHARACTERS_PER_FRAME ||
                (this.state.userInstantOverride || this.header.instant)
            )) {
                const token = this.pages[this.state.page][this.state.token++];

                if (!token) {
                    this.state.scrollLocked = false;
                    this.state.pauseLocked = true;
                    this.pause();

                    if (this.header.backToTop === true) {
                        requestAnimationFrame(() => {
                            this.scrollWindow(0);
                        });
                    }

                    break;
                }

                this.process(token);
                processed++;
            }
        } catch (err) {
            const token = this.pages[this.state.page][this.state.token - 1];
            console.error(
                this.formatTokenError(
                    err,
                    token,
                    this.state.token - 1
                )
            );
        } finally {
            if (fragment.childNodes.length) {
                this.target.appendChild(fragment);

                if (this.state.scrollCount > 0) {
                    this.state.scrollCount--;

                    requestAnimationFrame(() => {
                        this.scrollTargetParent(this.targetParent.scrollHeight);
                    });
                }
            }
        }

        this._renderFrame = requestAnimationFrame(this.render);
    }

    addRenderTime(ms){
        if(this.state.userInstantOverride) return;
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
            if(JitterTag.jitters[sharedID] === undefined){
                JitterTag.jitters[sharedID] = [jitter];
            } else {
                JitterTag.jitters[sharedID].push(jitter);
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
        if(this.state.accuracy < 1){
            for(let i = 0; i < text.length; i++){
                // get a random number between 0 and 1, and if it's greater than the accuracy, replace the character with a random character
                if(Math.random() > this.state.accuracy){
                    text = text.substring(0, i) + SuperType.randomCharacter() + text.substring(i + 1);
                }
            }
        }


        const sameStyle =
            this.state.currentStyle &&
            this.state.currentStyle.bold === style.bold &&
            this.state.currentStyle.italic === style.italic &&
            this.state.currentStyle.underline === style.underline &&
            this.state.currentStyle.strikethrough === style.strikethrough &&
            this.state.currentColor === this.state.currentStyle.color &&
            this.state.currentBg === this.state.currentStyle.bg;

        if ((!sameStyle) || this.state.separateElements === true) {
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

        if (this._containerWidth === null) {
            this._containerWidth = this.target.getBoundingClientRect().width;
        }
        const containerWidth = this._containerWidth;

        if (this.state.lineWidth > 0 && this.state.lineWidth + wordWidth > containerWidth) {
            if (wordWidth <= containerWidth) {
                this.state.fragment.appendChild(document.createElement("br"));
                this.resetSpanTextStyle();
                this.state.lineWidth = 0;
            } else {
                this.state.lineWidth = containerWidth;
            }
        }
    }

    findTagEnd(body, openIndex) {
        let i = openIndex + 1;
        let inDoubleString = false;
        let inSingleString = false;

        while (i < body.length) {
            const ch = body[i];

            if (ch === "\\" && (inDoubleString || inSingleString) && i + 1 < body.length) {
                i += 2;
                continue;
            }

            if (ch === '"' && !inSingleString) {
                inDoubleString = !inDoubleString;
                i++;
                continue;
            }

            if (ch === "'" && !inDoubleString) {
                inSingleString = !inSingleString;
                i++;
                continue;
            }

            if (ch === "]" && !inDoubleString && !inSingleString) {
                return i;
            }

            i++;
        }

        return -1;
    }

    tokenize(body) {
        const queue = [];
        let i = 0;

        let inDoubleString = false;

        // Tracks the body offset the token currently being scanned started
        // at, so every token can be traced back to a line/column for error
        // reporting (see resolvePosition() / formatTokenError()).
        let tokenStart = 0;
        const push = (tok) => {
            tok.pos = tokenStart;
            queue.push(tok);
        };

        while (i < body.length) {
            tokenStart = i;

            // escaped characters
            if (body[i] === "\\" && this.state.rawMode === false) {
                if (i + 1 < body.length) {
                    push({
                        type: "character",
                        value: body[i + 1]
                    });

                    i += 2;
                    continue;
                }
            }

            // quote handling
            if (this.state.rawMode === false) {
                if (body[i] === '"') {
                    inDoubleString = !inDoubleString;
                    push({
                        type: "character",
                        value: '"'
                    });

                    i++;
                    continue;
                }
            }

            if (body[i] === "[" && !inDoubleString) {
                const end = this.findTagEnd(body, i);

                if (end !== -1) {
                    const content = body.slice(i + 1, end).trim();
                    const parts = content.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
                    const name = parts.shift();

                    const isRawEnd = name === "raw" && parts.length === 1 && parts[0] === "end";

                    if (this.state.rawMode !== true || isRawEnd) {
                        const TagClass = SuperType.tags.get(name) ?? Tag;

                        const result = TagClass.onTokenization(parts, {
                            engine: this, queue, body, index: i
                        });

                        if (result !== false) {
                            push({ type: "tag", name, args: result });
                        }

                        i = end + 1;
                        continue;
                    }
                }
            }
            if (body[i] === "\n") {
                if (this.state.rawMode) {
                    push({
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
                push({
                    type: this.state.rawMode ? "character" : "style",
                    value: this.state.rawMode ? "*" : "bold"
                });

                i++;
                continue;
            }

            if(body[i] === "_") {
                push({
                    type: this.state.rawMode ? "character" : "style",
                    value: this.state.rawMode ? "_" : "underline"
                });

                i++;
                continue;
            }

            if(body[i] === "-") {
                push({
                    type: this.state.rawMode ? "character" : "style",
                    value: this.state.rawMode ? "-" : "strikethrough"
                });

                i++;
                continue;
            }

            if(body[i] === "/") {
                push({
                    type: this.state.rawMode ? "character" : "style",
                    value: this.state.rawMode ? "/" : "italic"
                });

                i++;
                continue;
            }



            push({
                type: "character",
                value: body[i]
            });

            i++;
        }

        return queue;
    }

    clearTargetHTML(){
        this.target.innerHTML = "";
    }

    /**
     * Resolves a body character offset (as stashed on tokens by tokenize()
     * via `token.pos`) into a 1-indexed { line, column }.
     * @param {number} pos
     * @returns {{line: number, column: number} | null}
     */
    resolvePosition(pos) {
        if (typeof pos !== "number" || !this.body) return null;

        const before = this.body.slice(0, pos);
        const lines = before.split("\n");

        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    /**
     * Builds a pretty, multi-line error report for a token that threw
     * during render()/process(), including its source line/column when
     * available.
     * @param {Error} err
     * @param {object | null} token
     * @param {number | null} tokenIndex
     * @returns {string}
     */
    formatTokenError(err, token, tokenIndex) {
        const pos = token ? this.resolvePosition(token.pos) : null;


        const lines = [
            "",
            "┌─ SuperType error ─────────────────────────────────",
            `│ ${err.message}`,
            `|`,
            `| File : ${this.fileName}.st`,
            `| Page : ${this.state.page}`,
            `| Tag  : ${token.name ?? "unknown"}`
        ];

        if(pos){
            const sourceLine = this.body.split("\n")[pos.line - 1] ?? "";
            lines.push(
                `| Raw  : ${sourceLine}`,
            )
        }

        lines.push("└───────────────────────────────────────────────────");

        return lines.join("\n");
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
    RepeatTag,
    ImportTag,
    ResetColorsTag,
    ForceScrollTag,
    UnscrambleTag,
    AccuracyTag,
    PayloadTag,
    GradientTag,
    SeparateTag,
    ForceInstantTag,
    StartTag,
    ForcePageTag
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