# supertype
SuperType is an easy way to add a typewriter effect to your webpage. Just type your text in a `.st` file, and it will be rendered on your webpage with a typewriter effect. You can also add tags to change the speed, color, and other properties of the typewriter. I recommend using this [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VSCode to be able to see it effectively.
## Why?
I created this because I have a personal problem where I tend to skip ahead in texts and spoil myself to later parts. I wanted a way to create texts without the ability to skip ahead. Later inspirations were the text effects of Undertale and Deltarune.
## Examples
Look at `example.st` for an example of how to use supertype. Look at `index.html` for an example of how to use supertype in a webpage.

## Terms
- Wrapped tag: `[tagName] ... [tagname end]`
- Root (context): the main content of the `.st` file; all text and tags outside of pages and mixins.

## Types
```
  Number : 1
         | 1000
         | 3.5

  String : "hello"
         | "multiple words"

 Boolean : true
         | false

   Color : #ff0000
         | 255,0,0


Specific : override
         | reset
         | default
         | keep
         | end
         | instant
         | on
         | off
```

## Header
`|` is used to show value defaults. For example, `Number | 1000` means that if you do not include a value for that specific `Number`, it will default to `1000`.
```
typewriter: {
    charDelay: Number
    newlineDelay: Number
    textColor: Color
    backgroundColor: Color
    instant: Boolean | false
    completionBar: Boolean | false
    wordWrap: Number | Infinity
    previewMode: Boolean | false
    backToTop: Boolean | false
    customDelays: {
        String: Number
    }
}
```

## Tags
`label<Type>` is used to show the type of the value that is expected for that specific label. For example, `speed delay<Number>` means that the `delay` value must be a `Number`. If something is followed by `?`, it means that the value is optional.

### Text
Controls how text is desplayed.
| Tag                                  | Description                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `[newline]`                          | Creates a new line. Raw newlines are ignored in .st files.                                                      |
| `[newline instant]`                  | Creates a new line instantly.                                                                                   |
| `[linebreak]`                        | Two new lines for the timing of 1.                                                                              |
| `[linebreak instant]`                | Creates two new lines instantly.                                                                                |
| `[tab count<Number>]`                | Inserts `count` spaces.                                                                                         |
| `[tab count<Number> fill]`           | Inserts `count` spaces. The spaces will be the background color.                                                |
| `[removelast count<Number>]`         | Removes the last `count` rendered characters from the typewriter.                                               |
| `[removelast count<Number> keep]`    | Removes the last `count` rendered characters from the typewriter as a single group.                             |
| `[repeat str<String> count<Number>]` | Repeats `str` `count` times.                                                                                    |
| `[repeat str<String> count<Number> instant]` | Instantly epeats `str` `count` times.                                                                                   |
| `[repeat count<Number>] ... [repeat end]` | Repeats the content `count` times.                                                   |
| `[repeat count<Number> instant] ... [repeat end]` | Instantly repeats the content `count` times.                                                   |
| `[mixin name<Sring>] ... [mixin end]`                | Creates a mixin with the name `name`. See the Mixins section for more information. |
| `[@use name<String> ...]`            | Uses the mixin with the name `name`, and passes in the parameters. See the Mixins section for more information. |

### Fun Text Effects
FUN!
| Tag                                             | Description                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `[glitch count<Number>]`                        | Inserts `count` glitching characters.                             |
| `[glitch count<Number> keep]`                   | Inserts `count` glitching characters as a single group.           |
| `[jitter text<String> strength<Number>]`        | Inserts `text` with a jittering effect of `strength`.             |
| `[jitter text<String> strength<Number> keep]`   | Inserts `text` with a jittering effect of `strength` all at once. |
| `[jitter text<String> strength<Number> shared]` | Inserts `text` with a shared jittering effect of `strength`.      |
| `[accuracy value<Number>]`                      | Sets the accuracy of the typewriter. Value is 0 to 1.           |
| `[unscramble text<String> ms<Number>]`          | Unscrambles `text` over `ms` milliseconds.    |
| `[unscramble text<String> minimumMs<Number> maximumMs<Number>]` | Unscrambles `text` over a random time between `minimumMs` and `maximumMs` milliseconds. |

### Timing
Modifies character timing.
| Tag                                        | Description                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `[sleep ms<Number>]`                       | Pauses the typewriter for `ms` milliseconds.                                              |
| `[speed delay<Number>]`                    | Sets `charDelay` to `delay` milliseconds.                                                 |
| `[speed delay<Number> override]`           | Sets `charDelay` to `delay` milliseconds and ignores all `customDelays`.                  |
| `[speeddefault]`                           | Resets `charDelay` to the default value and disables override mode.                       |
| `[custom character<String> delay<Number>]` | Sets `customDelays[character]` to `delay` milliseconds. Use "\n" to change newline delay. |
| `[customremove character<String>]`         | Removes `customDelays[character]`.                                                        |
| `[instant]`                                | Toggles instant mode.                                                                     |
| `[instant off]`                            | Turns off instant mode.                                                                   |
| `[ignore]`                                 | Toggles if custom character delays are ignored.                                           |
| `[ignore off]`                             | Turns off ignore mode.                                                                    |

### Styling
Change the color of the text and background.
| Tag                    | Description                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------|
| `[color color<Color>]` | Sets the text color to `color`.                                                                                                 |
| `[color reset]`        | Resets the text color to the default.                                                                                           |
| `[bg color<Color>]`    | Sets the background color to `color`.                                                                                           |
| `[bg reset]`           | Resets the background color to the default.                                                                                     |
| `[resetcolors]`        | Resets the text and background colors to the default.                                                                           |
| `[raw] ... [raw end]` | Renders the text and tags inside the tags without any styling.                                                                           |
| `[swap]`               | Swaps the text and background colors.                                                                                           |
| `[gradient text<String> gradient<String>]` | Creates a gradient effect on `text` using the CSS gradient `gradient`.                                                         |

### Pages
| Tag                                       | Description                                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `[page name<String>] ... [page end]`      | Creates a page with the name `name`. The content inside the tags will be rendered when the page is opened.        |
| `[gopage page<String> text<String>]`      | Creates a button that opens page `page`, with text `text` on the button.                                          |

### Miscellaneous
Other tags.
| Tag                       | Description                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `[function name<String>]` | Calls the JavaScript function with the specified name. JS functions are defined in the `SuperType` class constructor. |
| `[@import]`               | See `imports` section.                                                                                                |
| `[@forcescroll]`           | Forces the typewriter to scroll.                                                                                      |
| `[@forceseparate]`             | Forces the typewriter to separate elements.                                                                           |
| `[@forceseparate off]`         | Turns off separate mode.                                                                                              |
| `[@forceinstant]`           | Forces the typewriter to render instantly.                                                                           |
| `[@forceinstant off]`         | Turns off force instant mode.                                                                                              |

### Mixins
Mixins are a way to create reusable blocks of tags and text.

#### Create a mixin
```
[mixin "name"]
    hello![newline]
[mixin end]
```

Using the mixin above would look like this:

```
[@use "name"]
[@use "name"]
```

And would render as:

```
hello!
hello!
```

#### Use a mixin with parameters
Include `<String>`, `<Number>`, `<Boolean>`, or `<Color>` in the mix-in to use parameters. The order they appear in the mixin dictates the order they must be passed in when using the mixin.

```
[mixin "name"]
    hello <String>![newline]
[mixin end]
```

```
[@use "name" "johny"]
[@use "name" "clara"]
```

```
hello johny!
hello clara!
```

### Imports
Imports are a way to include other `.st` files into your current file.

`importExample.st`:
```
typewriter: {
    charDelay: 40
    newlineDelay: 120
    textColor: #ffffff
    backgroundColor: #000000
    customDelays: {
        ",": 500
    }
}
imported root page.

[page "page"]
    this is an imported page. WOW! [newline]
[page end]

[mixin "imported-mixin"]
    this is an imported mixin, <String>![newline]
[mixin end]
```
To import the files, used a wrapped import tag in your main `.st` file. Inside of the tag, include the path to the file you want to import. If you want to import multiple files, separate the paths by newlines.
```
[@import]
    importExample.st
[@import end]
```

Once imported, the pages and mixins can be used. Page names are prefixed with the file name, so `page` becomes `fileName-page`, including the root context. Mixins are not prefixed. Headers are ignored.

## Comment
```
{{#
hi
#}}
```

## Markdown Guide
Markdown persists through newlines, but due to limitations of the vscode extension, it will not show as so in `.st` files.
```
*bold*
/italic/
-strike-
_underline_
\-escape\-
```