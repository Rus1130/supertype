{{# written 21 july, 2026 #}}
typewriter: {
    charDelay: 20
    newlineDelay: 200
    textColor: #ffffff
    backgroundColor: #000000
    customDelays: {
        ",": 300
        ".": 400
        ":": 300
    }
    wordWrap: 150
    backToTop: true
}
{{# definition #}}
[mixin "content mixin"]
    *[color #ff0000]<Content>!* WOW![color reset][newline]
    wow hi. <String>
[mixin end]

{{# usage #}}
[@use "content mixin" "My name is bill"]
    You can add /cool things/[newline]fun
[@use end]

