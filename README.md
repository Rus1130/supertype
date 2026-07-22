# supertype
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
    customDelays: {
        String: Number
    }
}
```

## Tags
`label<Type>` is used to show the type of the value that is expected for that specific label. For example, `speed delay<Number>` means that the `delay` value must be a `Number`.
| Tag                                        | Description                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `[newline]`                                | Creates a new line.                                                                                                 |
| `[newline instant]`                        | Creates a new line instantly.                                                                                       |
| `[linebreak]`                              | Two new lines for the timing of 1.                                                                                  |
| `[linebreak instant]`                      | Creates two new lines instantly.                                                                                    |
| `[sleep ms<Number>]`                       | Pauses the typewriter for `ms` milliseconds.                                                                        |
| `[speed delay<Number>]`                    | Sets `charDelay` to `delay` milliseconds.                                                                           |
| `[speed delay<Number> override]`           | Sets `charDelay` to `delay` milliseconds and ignores all `customDelays`.                                            |
| `[speeddefault]`                           | Resets `charDelay` to the default value and disables override mode.                                                 |
| `[custom character<String> delay<Number>]` | Sets `customDelays[character]` to `delay` milliseconds.                                                             |
| `[customremove character<String>]`         | Removes `customDelays[character]`.                                                                                  |
| `[color color<Color>]`                     | Sets the text color to `color`.                                                                                     |
| `[color reset]`                            | Resets the text color to the default.                                                                               |
| `[bg color<Color>]`                        | Sets the background color to `color`.                                                                               |
| `[bg reset]`                               | Resets the background color to the default.                                                                         |
| `[page name<String>]`                      | Creates a page with name `name`.                                                                                    |
| `[page end]`                               | Closes a page.                                                                                                      |
| `[gopage page<String> text<String>]`       | Creates a button that opens page `page`, with text `text` on the button.                                            |
| `[gopage page<String> text<String> keep]`  | Creates a button that opens page `page`, with text `text` on the button, and does not reset already displayed text. |
| `[glitch count<Number>]`                   | Inserts `count` glitching characters as a single group.                                                             |
| `[glitch count<Number> separate]`          | Inserts `count` glitching characters, rendering each one separately.                                                |
| `[tab count<Number>]`                      | Inserts `count` spaces.                                                                                             |
| `[function name<String>]`                  | Calls the JavaScript function with the specified name.                                                              |
| `[removelast count<Number>]`               | Removes the last `count` rendered characters from the typewriter.                                                   |
| `[instant]`                                | Toggles `instant` mode.                                                                                             |

## Comment
```
{{#
hi
#}}
```

## Markdown Guide
```
*bold*
/italic/
-strike-
_underline_
\-escape\-
```