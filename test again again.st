typewriter: {
    charDelay: 25
    newlineDelay: 100
    textColor: #ffffff
    backgroundColor: #000000
    customDelays: {
        ",": 350
        ".": 600
    }
    instant: true
}
[mixin "green"]
    [color #339900]<String>[color reset]
[mixin end]
[mixin "yellow"]
    [color #FFCC00]<String>[color reset]
[mixin end]

[mixin "line ok"]
    [tab <Number>]<String>.[sleep <Number>][repeat "." <Number>][@use "green" "OK"][newline]
[mixin end]

[mixin "line many ok"]
    [tab <Number>]<String>.[sleep <Number>][repeat "." <Number>][@use "green" "OK"] [@use "green" "<Number>"][newline]
[mixin end]

[mixin "half line ok"]
[tab <Number>]<String> [@use "green" "OK"][newline]
[mixin end]

[mixin "half line warning"]
[tab <Number>]<String> [@use "yellow" "WARNING"][newline]
[mixin end]

[mixin "start"]
    [$start][$instant][speed 3 override]
[mixin end]

{{# [$start][$instant] #}}
[speed 3 override]

ELECTRICAL =========================[newline]
[@use "line ok" 11 "PRIMARY REACTOR" 2000 9]
[@use "line ok" 11 "SECONDARY REACTOR" 1000 7]
[@use "line ok" 11 "BATTERY" 150 17]
[@use "line ok" 11 "CURRENT DRAW" 10 12]
[@use "half line ok" 32 "1\_4" 5]
[@use "half line warning" 34 "5" 7]
[@use "half line ok" 34 "6" 7]