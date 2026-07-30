typewriter: {
    charDelay: 28
    newlineDelay: 150
    textColor: #ffffff
    backgroundColor: #000000
    wordWrap: 100
    backToTop: true
    instant: true
}

[mixin "ok"]
    [color #339900]<String>[color reset][newline]
    [jitter <String> <Number>][newline]
[mixin end]

[@use "ok" "first string" "second string" 10]
[@use "ok" "therd" "4rd" 20]