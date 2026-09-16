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
[mixin "b"]
hi!
[mixin end]
hiiii[newline]

{{# channels, amount #}}
{{# chance #}}
{{# blocksize, count #}}
{{# amplitude, frequency #}}
{{# hueBlocksize, hueCount #}}

[function "set image bit corrupt" 0.7]
[function "set image block glitch" 50 100]
[function "set image hue rotate" 100 150]
[function "set image wave distort" 10 0.1]
[function "set image channel shift" "rb" 10]

{{#src, width, height, speed#}}
[function "image" "img-to-st/test-img-NOT-MINE.png" 312 438 100][newline]
hello!
