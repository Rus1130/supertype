{{# written 6 aug, 2026 #}}
typewriter: {
    charDelay: 46
    newlineDelay: 200
    textColor: #ffffff
    backgroundColor: #000000
    customDelays: {
        ",": 400
        ".": 600
        ":": 150
        "–": 500
    }
    wordWrap: 110
}
whatt

[mixin "wow"]
    [repeat <Number>]
        repeatings![newline]
    [repeat end]
[mixin end]
wow
[gopage "importExample-page" "imported page"]

[@use "wow" 3]

[linebreak]

{{# [function "input" "type here: " false][newline]
last user input: [function "lastsentinput"][newline]
/*[function "sine" 17 0.6 1][gradient "what the fuck!!!!" "90deg, #c8d8fb, #6f6fff"]/* #}}