# supertype
comment:
```
{{#
hi
#}}
```

types:
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

Header:
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

Tags:
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
[tab Number] - is Number spaces
```

markdown guide:
```
*bold*
/italic/
-strike-
_underline_
\-escape\-
```