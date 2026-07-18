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
    customDelays: {
        String: Number
    }
}
```

Tags:
```
[newline] - creates a new line
[linebreak] - two new lines

[sleep Number] - pauses typewriter for Number milliseconds

[speed Number] - sets charDelay milliseconds
[speed Number override] - sets charDelay, ignores customDelays milliseconds

[speed default] - resets speed to default charDelay milliseconds
[speed default Number] - changes default charDelay to Number milliseconds

[custom String Number] - sets customDelays[String] to Number milliseconds
[customremove String] - removes customDelays[String]

[color Color] - sets textColor
[color reset] - resets textColor to default

[bg Color] - sets backgroundColor
[bg reset] - resets backgroundColor to default

[page String] - creates a page with the given name
[page end] - ends the page

[gopage String] - creates a button that, when clicked, switches to the page with the given name
[gopage String keep] - does not reset the screen when switching pages

[pause] - pauses typewriter
[play] - resumes typewriter

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