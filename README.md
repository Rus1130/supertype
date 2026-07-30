# supertype
SuperType is an easy way to add a typewriter effect to your webpage. Just type your text in a `.st` file, and it will be rendered on your webpage with a typewriter effect. You can also add tags to change the speed, color, and other properties of the typewriter.
## Examples
Look at `example.st` for an example of how to use supertype. Look at `index.html` for an example of how to use supertype in a webpage.

## Types
```
  Number : 1
         | 1000

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
| Tag                          | Description                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `[newline]`                  | Creates a new line. Raw newlines are ignored in .st files.                                                      |
| `[newline instant]`          | Creates a new line instantly.                                                                                   |
| `[linebreak]`                | Two new lines for the timing of 1.                                                                              |
| `[linebreak instant]`        | Creates two new lines instantly.                                                                                |
| `[tab count<Number>]`        | Inserts `count` spaces.                                                                                         |
| `[removelast count<Number>]` | Removes the last `count` rendered characters from the typewriter.                                               |
| `[mixin name<Sring>]`        | Starts a mixin with the name `name`. See the Mixins section for more information.                               |
| `[mixin end]`                | Ends a mixin.                                                                                                   |
| `[@use name<String> ...]`    | Uses the mixin with the name `name`, and passes in the parameters. See the Mixins section for more information. |

### Timing
Modifies character timing.
| Tag                                        | Description                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------|
| `[sleep ms<Number>]`                       | Pauses the typewriter for `ms` milliseconds.                             |
| `[speed delay<Number>]`                    | Sets `charDelay` to `delay` milliseconds.                                |
| `[speed delay<Number> override]`           | Sets `charDelay` to `delay` milliseconds and ignores all `customDelays`. |
| `[speeddefault]`                           | Resets `charDelay` to the default value and disables override mode.      |
| `[custom character<String> delay<Number>]` | Sets `customDelays[character]` to `delay` milliseconds.                  |
| `[customremove character<String>]`         | Removes `customDelays[character]`.                                       |
| `[instant]`                                | Toggles instant mode.                                                    |
| `[instant off]`                            | Turns off instant mode.                                                  |
| `[ignore]`                                 | Toggles if custom character delays are ignored.                          |
| `[ignore off]`                             | Turns off ignore mode.                                                   |

### Styling
Change the color of the text and background.
| Tag                                        | Description                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------|
| `[color color<Color>]`  | Sets the text color to `color`.                                                                                                 |
| `[color reset]`         | Resets the text color to the default.                                                                                           |
| `[bg color<Color>]`     | Sets the background color to `color`.                                                                                           |
| `[bg reset]`            | Resets the background color to the default.                                                                                     |
| `[raw]`                 | Enables mode, which ignores all tags and formatting. Color and background are not effected, but cannot be changed inside of it. |
| `[raw end]`             | Exits raw mode.                                                                                                                 |

### Pages
| Tag                                       | Description                                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `[page name<String>]`                     | Creates a page with name `name`.                                                                                  |
| `[page end]`                              | Closes a page.                                                                                                    |
| `[gopage page<String> text<String>]`      | Creates a button that opens page `page`, with text `text` on the button.                                          |
| `[gopage page<String> text<String> keep]` | Creates a button that opens page `page`, with text `text` on the button, and does reset currently displayed text. |

### Miscellaneous
Other tags.
| Tag                                             | Description                                                                                                                                          |
| ----------------------------------------------- | -----------------------------------------------------------------------------------------------------------------------------------------------------|
| `[glitch count<Number>]`                        | Inserts `count` glitching characters.                                                                                                                |
| `[glitch count<Number> keep]`                   | Inserts `count` glitching characters as a single group.                                                                                              |
| `[jitter text<String> strength<Number>]`        | Inserts `text` with a jittering effect of `strength`.                                                                                                |
| `[jitter text<String> strength<Number> keep]`   | Inserts `text` with a jittering effect of `strength` as a single group.                                                                              |
| `[jitter text<String> strength<Number> shared]` | Inserts `text` with a jittering effect of `strength` as a single group, and shares the jittering effect across all instances of the same `sharedID`. |
| `[function name<String>]`                       | Calls the JavaScript function with the specified name. JS functions are defined in the `SuperType` class constructor.                                |

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