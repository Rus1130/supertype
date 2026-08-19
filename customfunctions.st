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

[mixin "progress-bar-frame"]
    [instant]\[[repeat "=" <Number>][tab <Number>]\][instant off]
[mixin end]

[@use "progress-bar-frame" 0 20]
[@use "progress-bar-frame" 1 19]
[@use "progress-bar-frame" 2 18]
[@use "progress-bar-frame" 3 17]
[@use "progress-bar-frame" 4 16]
[@use "progress-bar-frame" 5 15]
[@use "progress-bar-frame" 6 14]
[@use "progress-bar-frame" 7 13]
[@use "progress-bar-frame" 8 12]
[@use "progress-bar-frame" 9 11]
[@use "progress-bar-frame" 10 10]
[@use "progress-bar-frame" 11 9]
[@use "progress-bar-frame" 12 8]
[@use "progress-bar-frame" 13 7]
[@use "progress-bar-frame" 14 6]
[@use "progress-bar-frame" 15 5]
[@use "progress-bar-frame" 16 4]
[@use "progress-bar-frame" 17 3]
[@use "progress-bar-frame" 18 2]
[@use "progress-bar-frame" 19 1]
[@use "progress-bar-frame" 20 0]

{{# [mixin "progress-bar"]
        [instant]
        \[[tab 20]\]
        [instant off]
    [sleep 200][removelast 20 none instant]

    \[=[tab 19]\][sleep 200][removelast 20 none instant]
    [speeddefault]
[mixin end]

[@use "progress-bar"] #}}

[linebreak]

{{# [function "input" "type here: " false][newline]
last user input: [function "lastsentinput"][newline]
/*[function "sine" 17 0.6 1][gradient "what the fuck!!!!" "90deg, #c8d8fb, #6f6fff"]/* #}}