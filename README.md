# supertype
## Examples
Look at `example.tw` for an example of how to use supertype. Look at `index.html` for an example of how to use supertype in a webpage.

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
`word<Number>` means that `word` is just a label assigned to what would be put in the `Number` type, to limit confusion.


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
    customDelays: {
        String: Number
    }
}
```

## Tags
```
[newline] - creates a new line
[newline instant] - creates a new line instantly

[linebreak] - two new lines for the timing of 1
[linebreak instant] - two new lines instantly

[sleep ms<Number>] - pauses typewriter for ms milliseconds

[speed delay<Number>] - sets charDelay to delay milliseconds
[speed delay<Number> override] - sets charDelay to delay milliseconds, and overrides any customDelays

[speeddefault] - resets charDelay to default charDelay milliseconds. Also disables override

[custom character<String> delay<Number>] - sets customDelays[character] to delay milliseconds
[customremove String] - removes customDelays[String]

[color color<Color>] - sets textColor to color
[color reset] - resets textColor to default

[bg color<Color>] - sets backgroundColor to color
[bg reset] - resets backgroundColor to default

[page name<String>] - creates a page with the given name.
[page end] - ends the page

[gopage page<String> text<String>] - goes to the page with the given name, and displays the given text. Resets displayed text
[gopage page<String> text<String> keep] - goes to the page with the given name, and displays the given text. Keeps displayed text

[glitch count<Number>] - adds ``count``
[glitch Number separate] - funny glitch text thats Number characters long, but each character is separate

[tab Number] - is Number spaces

[function String] - calls the function with the given name. Functions are defined in JavaScript
```
| Tag                                        | Description                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `[newline]`                                | Creates a new line.                                                                                                |
| `[newline instant]`                        | Creates a new line instantly.                                                                                      |
| `[linebreak]`                              | Two new lines for the timing of 1                                                                                  |
| `[linebreak instant]`                      | Creates two new lines instantly.                                                                                   |
| `[sleep ms<Number>]`                       | Pauses the typewriter for `ms` milliseconds.                                                                       |
| `[speed delay<Number>]`                    | Sets `charDelay` to `delay` milliseconds.                                                                          |
| `[speed delay<Number> override]`           | Sets `charDelay` to `delay` milliseconds and ignores all `customDelays`.                                           |
| `[speeddefault]`                           | Resets `charDelay` to the default value and disables override mode.                                                |
| `[custom character<String> delay<Number>]` | Sets `customDelays[character]` to `delay` milliseconds.                                                            |
| `[customremove character<String>]`         | Removes `customDelays[character]`.                                                                                 |
| `[color color<Color>]`                     | Sets the text color to `color`.                                                                                    |
| `[color reset]`                            | Resets the text color to the default.                                                                              |
| `[bg color<Color>]`                        | Sets the background color to `color`.                                                                              |
| `[bg reset]`                               | Resets the background color to the default.                                                                        |
| `[page name<String>]`                      | Creates a page with name `name`.                                                                                   |
| `[page end]`                               | Closes a page.                                                                                                     |
| `[gopage page<String> text<String>]`       | Creates a button that opens page `page`, with text `text` on the button.                                           |
| `[gopage page<String> text<String> keep]`  | Creates a button that opens page `page`, with text `text` on the button, and does not reset already displayed text |
| `[glitch count<Number>]`                   | Inserts `count` glitching characters as a single group.                                                            |
| `[glitch count<Number> separate]`          | Inserts `count` glitching characters, rendering each one separately.                                               |
| `[tab count<Number>]`                      | Inserts `count` spaces.                                                                                            |
| `[function name<String>]`                  | Calls the JavaScript function with the specified name.                                                             |

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