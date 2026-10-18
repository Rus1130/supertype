/**
 * FunctionImportManager
 * ---------------------------------------------------------------
 * Bundles every custom SuperType function (plus all helper functions and
 * state they depend on) into one self-contained object.
 *
 * Load SuperType first, then this file.
 *
 * USAGE
 *   // everything:
 *   const tw = new SuperType(document.body, FunctionImportManager.all());
 *
 *   // only some:
 *   const tw = new SuperType(document.body, FunctionImportManager.pick("image", "sine"));
 *
 *   // everything except some:
 *   const tw = new SuperType(document.body, FunctionImportManager.except("input"));
 *
 *   // merge with your own functions:
 *   const tw = new SuperType(document.body, {
 *       ...FunctionImportManager.all(),
 *       "myfunc": function (engine, token) { ... }
 *   });
 *
 *   // optional: give the manager your instance (otherwise `engine` is used)
 *   FunctionImportManager.bind(tw);
 *
 *   // optional: change where the "end" Return button goes
 *   FunctionImportManager.config.returnUrl = "https://example.com/";
 *
 * Available functions:
 *   lastsentinput, input, end, jitterlerp, sine, "change random image seed",
 *   "set image channel shift", "set image bit corrupt", "set image block glitch",
 *   "set image wave distort", "set image hue rotate", image
 */
const FunctionImportManager = (() => {
    "use strict";

    // ------------------------------------------------------------------
    // Internal state
    // ------------------------------------------------------------------
    const config = {
        returnUrl: "https://rus1130.github.io/space2313/",
        returnText: "▌< Return",
    };

    const state = {
        host: null,                 // optional bound SuperType instance
        lastUserInputTokens: [],
        lastUserInputValue: "",
        sineStyleInjected: false,

        // image effect settings
        channelShiftChannels: "",
        channelShiftAmount: 0,
        bitCorruptChance: 0,
        blockGlitchBlockSize: 0,
        blockGlitchCount: 0,
        waveDistortAmplitude: 0,
        waveDistortFrequency: 0,
        hueRotateBlockSize: 0,
        hueRotateCount: 0,
        priority: [],               // order in which effects get applied
    };

    const hostOf = (engine) => state.host || engine;

    // ------------------------------------------------------------------
    // Helpers: color
    // ------------------------------------------------------------------
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [r * 255, g * 255, b * 255];
    }

    // ------------------------------------------------------------------
    // Helpers: random + misc
    // ------------------------------------------------------------------
    function mulberry32(seed) {
        let a = seed;
        return function () {
            a |= 0;
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    let rand = mulberry32(20319923);
    function setSeed(seed) { rand = mulberry32(seed); }

    function copyToClipboard(text) {
        return navigator.clipboard.writeText(text)
            .then(() => console.log("Copied to clipboard"))
            .catch(err => console.error("Could not copy text: ", err));
    }

    // ------------------------------------------------------------------
    // Helpers: image loading + glitch effects
    // ------------------------------------------------------------------
    async function scanPixels(imgSrc, width, height) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgSrc;
        await img.decode();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, width, height);

        const data = ctx.getImageData(0, 0, width, height).data;
        const bitmap = [];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const hex = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
                row.push(hex.toString(16).padStart(6, "0"));
            }
            bitmap.push(row);
        }
        return bitmap;
    }

    function rowGlitch(ctx, width, height, glitchiness = 0.1) {
        const rowCount = Math.floor(height * glitchiness);
        for (let n = 0; n < rowCount; n++) {
            const y = Math.floor(rand() * height);
            const rowHeight = 1 + Math.floor(rand() * 4);
            const shift = Math.floor((rand() - 0.5) * width * 0.3);

            const slice = ctx.getImageData(0, y, width, rowHeight);
            ctx.clearRect(0, y, width, rowHeight);
            ctx.putImageData(slice, shift, y);
        }
    }

    function bitCorrupt(ctx, width, height, chance = 0.002) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (rand() < chance) {
                const channel = i + Math.floor(rand() * 3);
                data[channel] = rand() < 0.5 ? 0 : 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }

    function blockGlitch(ctx, width, height, blockSize = 8, count = 20) {
        for (let n = 0; n < count; n++) {
            const sx = Math.floor(rand() * (width - blockSize));
            const sy = Math.floor(rand() * (height - blockSize));
            const dx = Math.min(width - blockSize, Math.max(0, sx + (rand() - 0.5) * 30));
            const dy = Math.min(height - blockSize, Math.max(0, sy + (rand() - 0.5) * 30));

            const block = ctx.getImageData(sx, sy, blockSize, blockSize);
            ctx.putImageData(block, dx, dy);
        }
    }

    function waveDistort(ctx, width, height, amplitude = 5, frequency = 0.1) {
        const phase = rand() * Math.PI * 2;
        const imgData = ctx.getImageData(0, 0, width, height);
        const src = imgData.data;
        const out = new Uint8ClampedArray(src);

        for (let y = 0; y < height; y++) {
            const shift = Math.round(Math.sin(y * frequency + phase) * amplitude);
            for (let x = 0; x < width; x++) {
                const srcX = Math.min(width - 1, Math.max(0, x - shift));
                const i = (y * width + x) * 4;
                const si = (y * width + srcX) * 4;
                out[i] = src[si];
                out[i + 1] = src[si + 1];
                out[i + 2] = src[si + 2];
                out[i + 3] = src[si + 3];
            }
        }
        ctx.putImageData(new ImageData(out, width, height), 0, 0);
    }

    function hueRotateBlocks(ctx, width, height, blockSize = 20, count = 15) {
        for (let n = 0; n < count; n++) {
            const x = Math.floor(rand() * (width - blockSize));
            const y = Math.floor(rand() * (height - blockSize));
            const rotation = rand();

            const block = ctx.getImageData(x, y, blockSize, blockSize);
            const data = block.data;

            for (let i = 0; i < data.length; i += 4) {
                const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
                const [r2, g2, b2] = hslToRgb((h + rotation) % 1, s, l);
                data[i] = r2;
                data[i + 1] = g2;
                data[i + 2] = b2;
            }
            ctx.putImageData(block, x, y);
        }
    }

    function channelShift(ctx, width, height, channels, amount = 4) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const src = imgData.data;
        const out = new Uint8ClampedArray(src);

        const channelMap = { r: 0, g: 1, b: 2 };
        const indices = [...new Set(channels.toLowerCase())].map(ch => {
            const idx = channelMap[ch];
            if (idx === undefined) {
                throw new Error(`Invalid channel: "${ch}". Expected some combination of "r", "g", "b"`);
            }
            return idx;
        });

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const shiftedX = Math.min(width - 1, x + amount);
                const si = (y * width + shiftedX) * 4;

                out[i] = src[i];
                out[i + 1] = src[i + 1];
                out[i + 2] = src[i + 2];
                out[i + 3] = src[i + 3];

                for (const idx of indices) out[i + idx] = src[si + idx];
            }
        }
        ctx.putImageData(new ImageData(out, width, height), 0, 0);
    }

    function applyQueuedEffects(ctx, width, height) {
        for (const effect of state.priority) {
            switch (effect) {
                case "shift":
                    channelShift(ctx, width, height, state.channelShiftChannels, state.channelShiftAmount);
                    break;
                case "corrupt":
                    bitCorrupt(ctx, width, height, state.bitCorruptChance);
                    break;
                case "block":
                    blockGlitch(ctx, width, height, state.blockGlitchBlockSize, state.blockGlitchCount);
                    break;
                case "hue":
                    hueRotateBlocks(ctx, width, height, state.hueRotateBlockSize, state.hueRotateCount);
                    break;
                case "wave":
                    waveDistort(ctx, width, height, state.waveDistortAmplitude, state.waveDistortFrequency);
                    break;
            }
        }
        state.priority = [];
    }

    function requireArg(arg, message, token) {
        if (arg == undefined) throw new SuperTypeError(message, token);
    }

    // ------------------------------------------------------------------
    // The SuperType functions
    // ------------------------------------------------------------------
    const functions = {
        "lastsentinput": function (engine, token) {
            engine.insertTokens(state.lastUserInputTokens);
        },

        "input": function (engine, token) {
            const host = hostOf(engine);
            const [name, prefixText] = token.args;
            prefixText.check("string");

            const renderPrefixTokens = [...prefixText.value].map(ch => ({
                type: "character",
                value: ch,
                style: token.style
            }));

            const inputElement = document.createElement("input");
            inputElement.type = "text";
            inputElement.classList.add("user-input");
            inputElement.style.height = "12px";
            inputElement.style.color = host.state.currentColor;
            inputElement.style.backgroundColor = host.state.currentBg;
            inputElement.style.outline = "none";
            inputElement.style.border = "none";
            inputElement.style.padding = "0";

            inputElement.onkeydown = (event) => {
                event.stopPropagation();
                inputElement.style.width = (inputElement.value.length + 1) + "ch";

                if (event.key === "Enter") {
                    event.preventDefault();
                    inputElement.disabled = true;

                    state.lastUserInputValue = inputElement.value;
                    state.lastUserInputTokens = [...inputElement.value].map(ch => ({
                        type: "character",
                        value: ch,
                        style: token.style
                    }));

                    engine.unlockPause();
                    engine.resume();
                }
            };

            engine.insertTokens([...renderPrefixTokens, {
                type: "tag",
                name: "!payload",
                payload: {
                    onUse: function (engine) {
                        engine.pause();
                        engine.lockPause();
                        host.appendToTarget(inputElement);
                        requestAnimationFrame(() => inputElement.focus());
                    }
                }
            }]);
        },

        "end": function (engine) {
            const host = hostOf(engine);
            const returnButton = document.createElement("div");
            returnButton.classList.add("button");
            returnButton.id = "return";
            returnButton.textContent = config.returnText;
            returnButton.onclick = () => { location.href = config.returnUrl; };
            host.appendToTarget(returnButton);
            host.target.style.overflowY = "scroll";
            host.target.classList.add("hide-scrollbar");
        },

        "jitterlerp": function (engine, token) {
            const [name, text, leftValue, rightValue] = token.args;
            text.check("string");
            leftValue.check("number");
            rightValue.check("number");

            const last = Math.max(1, text.value.length - 1); // avoid divide-by-zero
            const tokens = [];

            for (let i = 0; i < text.value.length; i++) {
                const strength = leftValue.value + (rightValue.value - leftValue.value) * (i / last);
                tokens.push({
                    type: "tag",
                    name: "jitter",
                    style: token.style,
                    args: [
                        new TagArgument("string", text.value[i]),
                        new TagArgument("number", strength),
                    ]
                });
            }
            engine.insertTokens(tokens);
        },

        "sine": function (engine, token) {
            if (!state.sineStyleInjected) {
                const cssStyle = document.createElement("style");
                cssStyle.textContent = `
                    @keyframes typewriter-sine {
                        from { transform: translateY(var(--sine-amplitude)); }
                        50% { transform: translateY(calc(var(--sine-amplitude) * -1)); }
                        to { transform: translateY(var(--sine-amplitude)); }
                    }
                    .typewriter-sine {
                        display: inline-block;
                        animation-name: typewriter-sine;
                        animation-timing-function: linear;
                        animation-iteration-count: infinite;
                    }
                `;
                document.body.appendChild(cssStyle);
                state.sineStyleInjected = true;
            }

            const [name, lastCharacters, frequency, amplitude] = token.args;
            lastCharacters.check("number");
            frequency.check("number");
            amplitude.check("number");

            const count = lastCharacters.value;
            const duration = 1 / frequency.value;

            function applySine(element, index) {
                element.style.setProperty("--sine-amplitude", `${amplitude.value}px`);
                element.style.animationDuration = `${duration}s`;
                element.style.animationDelay = `${-duration * (index / count)}s`;
                element.classList.add("typewriter-sine");
            }

            if (!engine._sinePatched) {
                engine._sinePatched = true;
                engine._sineQueue = [];

                const original = engine.renderCharacter.bind(engine);

                engine.renderCharacter = function (text, style) {
                    if (engine._sineQueue.length === 0) {
                        return original(text, style);
                    }

                    for (let i = 0; i < text.length; i++) {
                        if (engine._sineQueue.length === 0) {
                            engine.renderCharacter = original;
                            engine._sinePatched = false;
                            original(text.slice(i), style);
                            return;
                        }

                        original(text[i], style);
                        const { index } = engine._sineQueue.shift();
                        applySine(engine.state.currentSpan, index);
                    }

                    if (engine._sineQueue.length === 0) {
                        engine.renderCharacter = original;
                        engine._sinePatched = false;
                    }
                };
            }

            for (let i = 0; i < count; i++) engine._sineQueue.push({ index: i });
        },

        "change random image seed": function (engine, token) {
            const [name, seed] = token.args;
            requireArg(seed, "change random image seed function requires a seed argument", token);
            seed.check("number");
            setSeed(seed.value);
        },

        "set image channel shift": function (engine, token) {
            const [name, channels, amount] = token.args;
            requireArg(channels, "image channel shift function requires a channels argument", token);
            requireArg(amount, "image channel shift function requires an amount argument", token);
            channels.check("string");
            amount.check("number");

            state.channelShiftChannels = channels.value;
            state.channelShiftAmount = amount.value;
            state.priority.push("shift");
        },

        "set image bit corrupt": function (engine, token) {
            const [name, chance] = token.args;
            requireArg(chance, "image bit corrupt function requires a chance argument", token);
            chance.check("number");

            state.bitCorruptChance = chance.value;
            state.priority.push("corrupt");
        },

        "set image block glitch": function (engine, token) {
            const [name, blockSize, count] = token.args;
            requireArg(blockSize, "image block glitch function requires a block size argument", token);
            requireArg(count, "image block glitch function requires a count argument", token);
            blockSize.check("number");
            count.check("number");

            state.blockGlitchBlockSize = blockSize.value;
            state.blockGlitchCount = count.value;
            state.priority.push("block");
        },

        "set image wave distort": function (engine, token) {
            const [name, amplitude, frequency] = token.args;
            requireArg(amplitude, "image wave distort function requires an amplitude argument", token);
            requireArg(frequency, "image wave distort function requires a frequency argument", token);
            amplitude.check("number");
            frequency.check("number");

            state.waveDistortAmplitude = amplitude.value;
            state.waveDistortFrequency = frequency.value;
            state.priority.push("wave");
        },

        "set image hue rotate": function (engine, token) {
            const [name, blockSize, count] = token.args;
            requireArg(blockSize, "image hue rotate function requires a block size argument", token);
            requireArg(count, "image hue rotate function requires a count argument", token);
            blockSize.check("number");
            count.check("number");

            state.hueRotateBlockSize = blockSize.value;
            state.hueRotateCount = count.value;
            state.priority.push("hue");
        },

        "image": async function (engine, token) {
            const [name, imagePath, width, height, speed] = token.args;
            engine.header.wordWrap = Infinity;

            requireArg(imagePath, "image function requires an image path argument", token);
            requireArg(width, "image function requires a width argument", token);
            requireArg(height, "image function requires a height argument", token);
            requireArg(speed, "image function requires a speed argument", token);

            imagePath.check("string");
            width.check("number");
            height.check("number");
            speed.check("number");

            engine.insertTokens([{
                type: "tag",
                name: "textsize",
                style: {},
                args: [new TagArgument("number", 1)]
            }]);

            engine.pause();

            const randID = Math.random().toString(36).substring(2, 15);

            try {
                const array = await scanPixels(imagePath.value, width.value, height.value);

                engine.insertPayload({
                    onRender: (engine) => {
                        const real = document.createElement("canvas");
                        real.width = width.value;
                        real.height = height.value;
                        real.style.imageRendering = "pixelated";
                        const realCtx = real.getContext("2d");

                        const canvas = document.createElement("canvas");
                        canvas.id = `image-${randID}`;
                        canvas.width = width.value;
                        canvas.height = height.value;
                        canvas.style.imageRendering = "pixelated";

                        for (let i = 0; i < array.length; i++) {
                            for (let j = 0; j < array[i].length; j++) {
                                realCtx.fillStyle = `#${array[i][j]}`;
                                realCtx.fillRect(j, i, 1, 1);
                            }
                        }

                        applyQueuedEffects(realCtx, width.value, height.value);

                        engine.appendToTarget(canvas);
                        const ctx = canvas.getContext("2d");

                        const rowDelay = speed.value;
                        const rowTokens = [];

                        for (let y = 0; y < height.value; y++) {
                            rowTokens.push({
                                type: "tag",
                                name: "!payload",
                                payload: {
                                    onUse: (engine) => { engine.addRenderTime(rowDelay); },
                                    onRender: () => {
                                        ctx.drawImage(
                                            real,
                                            0, y, width.value, 1,
                                            0, y, width.value, 1
                                        );
                                    }
                                }
                            });
                        }

                        engine.insertTokens(rowTokens);
                    }
                });
            } finally {
                engine.resume();
            }
        },
    };

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------
    const api = {
        /** Settings you can tweak (returnUrl, returnText). */
        config,

        /** Names of all bundled functions. */
        names() { return Object.keys(functions); },

        /** Every function, as a fresh object ready for `new SuperType(el, ...)`. */
        all() { return { ...functions }; },

        /** Only the named functions. */
        pick(...names) {
            names = names.flat();
            const out = {};
            for (const n of names) {
                if (!(n in functions)) throw new Error(`FunctionImportManager: unknown function "${n}"`);
                out[n] = functions[n];
            }
            return out;
        },

        /** Everything except the named functions. */
        except(...names) {
            names = names.flat();
            const out = { ...functions };
            for (const n of names) delete out[n];
            return out;
        },

        /** Optionally bind your SuperType instance (used by input/end). */
        bind(instance) { state.host = instance; return api; },

        /** Last text the user submitted via the `input` function. */
        get lastInput() { return state.lastUserInputValue; },

        /** Reset image effect queue and input memory. */
        reset() {
            state.lastUserInputTokens = [];
            state.lastUserInputValue = "";
            state.priority = [];
            return api;
        },

        /** Exposed helpers, in case you want them elsewhere. */
        helpers: {
            rgbToHsl, hslToRgb, mulberry32, setSeed, copyToClipboard,
            scanPixels, rowGlitch, bitCorrupt, blockGlitch,
            waveDistort, hueRotateBlocks, channelShift,
        },
    };

    return api;
})();

export { FunctionImportManager };