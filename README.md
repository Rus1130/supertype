# supertype
## Examples
Look at `example.tw` for an example of how to use supertype. Look at `index.html` for an example of how to use supertype in a webpage.
## Comment
```
{{#
hi
#}}
```

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

[sleep Number] - pauses typewriter for Number milliseconds

[speed Number] - sets charDelay milliseconds
[speed Number override] - sets charDelay, ignores customDelays milliseconds

[speeddefault] - resets charDelay to default charDelay milliseconds. Also disables override

[custom String Number] - sets customDelays[String] to Number milliseconds
[customremove String] - removes customDelays[String]

[color Color] - sets textColor
[color reset] - resets textColor to default

[bg Color] - sets backgroundColor
[bg reset] - resets backgroundColor to default

[page String] - creates a page with the given name
[page end] - ends the page

[gopage String String] - create a button that goes to the page with the first String, and displays the second String as the button text
[gopage String String keep] - create a button that goes to the page with the first String, and displays the second String as the button text. Does not reset displayed text

[glitch Number] - funny glitch text thats Number characters long
[glitch Number separate] - funny glitch text thats Number characters long, but each character is separate

[tab Number] - is Number spaces

[function String] - calls the function with the given name. Functions are defined in JavaScript
```

## Markdown Guide
```
*bold*
/italic/
-strike-
_underline_
\-escape\-
```